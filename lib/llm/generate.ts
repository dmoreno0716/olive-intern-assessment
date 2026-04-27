import type { CatalogNode } from "@/lib/catalog/types";
import { anthropicClient, DEFAULT_MAX_TOKENS, DEFAULT_MODEL } from "./client";
import { fillUserTemplate, loadPrompt } from "./prompts";
import { addUsage, computeCost, emptyUsage } from "./pricing";
import { formatIssuesForPrompt, parseAndValidate } from "./parse";
import type {
  GenerationResult,
  StreamEvent,
  TokenUsage,
  ValidationIssue,
} from "./types";

export type GenerateOptions = {
  model?: string;
  maxTokens?: number;
  abortSignal?: AbortSignal;
  onEvent?: (event: StreamEvent) => void;
};

/**
 * Generate a funnel spec from the creator's natural-language prompt.
 *
 * Strategy:
 *   1. Stream the model's response, forwarding text deltas via onEvent so
 *      the Studio can drive its filmstrip materialization.
 *   2. After the stream ends, parse + validate against SpecSchema
 *      (`@/lib/api/specSchema`).
 *   3. On validation failure, retry exactly once. The retry message
 *      contains the original prompt PLUS the previous attempt's text and
 *      the validation issues. If the retry also fails, return a
 *      structured error with the issues attached.
 *
 * Token usage and cost are accumulated across attempts and returned for
 * dashboard reporting.
 *
 * Test fault-injection: see streamOnce — env vars
 * OLIVE_TEST_FORCE_INVALID_FIRST and OLIVE_TEST_FORCE_INVALID_ALL replace
 * the LLM call with synthetic bad output to deterministically exercise
 * the retry path.
 */
export async function generateFunnelSpec(
  userPrompt: string,
  options: GenerateOptions = {},
): Promise<GenerationResult> {
  const model = options.model ?? DEFAULT_MODEL;
  const maxTokens = options.maxTokens ?? DEFAULT_MAX_TOKENS;
  const onEvent = options.onEvent;

  onEvent?.({ type: "start", model });

  const system = loadPrompt("system.md");
  const baseUserMessage = fillUserTemplate(userPrompt);

  let totalUsage: TokenUsage = emptyUsage();

  // Attempt 1
  const first = await streamOnce({
    attempt: 1,
    model,
    maxTokens,
    system,
    userMessage: baseUserMessage,
    onEvent,
    abortSignal: options.abortSignal,
  });
  totalUsage = addUsage(totalUsage, first.usage);

  const firstParsed = parseAndValidate(first.text);
  if (firstParsed.ok) {
    return success(firstParsed.spec, totalUsage, model, 1, onEvent);
  }
  onEvent?.({ type: "validation_error", attempt: 1, issues: firstParsed.issues });

  // Attempt 2 — retry with the previous attempt + issues fed back in.
  onEvent?.({ type: "retry", attempt: 2 });
  const retryUserMessage = buildRetryMessage(baseUserMessage, first.text, firstParsed.issues);
  const second = await streamOnce({
    attempt: 2,
    model,
    maxTokens,
    system,
    userMessage: retryUserMessage,
    onEvent,
    abortSignal: options.abortSignal,
  });
  totalUsage = addUsage(totalUsage, second.usage);

  const secondParsed = parseAndValidate(second.text);
  if (secondParsed.ok) {
    return success(secondParsed.spec, totalUsage, model, 2, onEvent);
  }

  const cost = computeCost(model, totalUsage);
  onEvent?.({
    type: "error",
    message: "Validation failed after retry",
    issues: secondParsed.issues,
    rawText: second.text,
  });
  return {
    ok: false,
    error: "Validation failed after retry",
    issues: secondParsed.issues,
    rawText: second.text,
    usage: totalUsage,
    cost,
    model,
    attempts: 2,
  };
}

function success(
  spec: CatalogNode[],
  usage: TokenUsage,
  model: string,
  attempts: number,
  onEvent: GenerateOptions["onEvent"],
): GenerationResult {
  const cost = computeCost(model, usage);
  onEvent?.({ type: "final", spec, usage, cost, model, attempts });
  return { ok: true, spec, usage, cost, model, attempts };
}

type StreamArgs = {
  attempt: 1 | 2;
  model: string;
  maxTokens: number;
  system: string;
  userMessage: string;
  onEvent?: (event: StreamEvent) => void;
  abortSignal?: AbortSignal;
};

/**
 * Synthetic bad output used by the fault-injection env vars below.
 * The kind "ProgressDots" is not a registered catalog kind, so the
 * SpecSchema validator flags it with a clear "Unknown kind" issue —
 * the kind of failure we expect to actually catch in production.
 */
const SYNTHETIC_INVALID_TEXT = JSON.stringify(
  [
    {
      kind: "Screen",
      props: {
        id: "intro",
        kind: "intro",
        body: [
          { kind: "ProgressDots", props: { steps: 3 } },
          { kind: "Heading", props: { text: "Hello" } },
        ],
        footer: [{ kind: "PrimaryCTA", props: { label: "Start" } }],
      },
    },
  ],
  null,
  2,
);

function shouldInjectFault(attempt: 1 | 2): boolean {
  if (process.env.OLIVE_TEST_FORCE_INVALID_ALL === "1") return true;
  if (process.env.OLIVE_TEST_FORCE_INVALID_FIRST === "1" && attempt === 1) return true;
  return false;
}

async function streamOnce(args: StreamArgs): Promise<{ text: string; usage: TokenUsage }> {
  // Test-only fault injection. When the env var is set, we skip the LLM
  // call entirely and return a synthetic bad spec. The validator will
  // flag it the same way it flags real model misbehavior. NEVER set
  // these env vars outside of test runs.
  if (shouldInjectFault(args.attempt)) {
    if (process.env.OLIVE_LLM_DEBUG === "1") {
      console.error(`[fault-injection] attempt ${args.attempt}: returning synthetic invalid spec`);
    }
    args.onEvent?.({ type: "delta", text: SYNTHETIC_INVALID_TEXT });
    return { text: SYNTHETIC_INVALID_TEXT, usage: emptyUsage() };
  }

  const client = anthropicClient();
  const stream = client.messages.stream(
    {
      model: args.model,
      max_tokens: args.maxTokens,
      system: args.system,
      messages: [{ role: "user", content: args.userMessage }],
    },
    args.abortSignal ? { signal: args.abortSignal } : undefined,
  );

  let text = "";

  for await (const event of stream) {
    if (
      event.type === "content_block_delta" &&
      event.delta.type === "text_delta"
    ) {
      const chunk = event.delta.text;
      text += chunk;
      args.onEvent?.({ type: "delta", text: chunk });
    }
  }

  const finalMessage = await stream.finalMessage();
  const usage: TokenUsage = {
    input_tokens: finalMessage.usage.input_tokens ?? 0,
    output_tokens: finalMessage.usage.output_tokens ?? 0,
    cache_creation_input_tokens: finalMessage.usage.cache_creation_input_tokens ?? undefined,
    cache_read_input_tokens: finalMessage.usage.cache_read_input_tokens ?? undefined,
  };

  return { text, usage };
}

function buildRetryMessage(
  baseUser: string,
  previousAttempt: string,
  issues: ValidationIssue[],
): string {
  return [
    baseUser,
    "",
    "---",
    "",
    "Your previous reply did NOT validate. Here it is, followed by the issues:",
    "",
    "<previous_attempt>",
    previousAttempt.trim(),
    "</previous_attempt>",
    "",
    "<validation_issues>",
    formatIssuesForPrompt(issues),
    "</validation_issues>",
    "",
    "Re-emit the entire spec, fixed. Output only the JSON array, starting with `[`.",
  ].join("\n");
}
