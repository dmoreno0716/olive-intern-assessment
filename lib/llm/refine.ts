import type { CatalogNode } from "@/lib/catalog/types";
import { anthropicClient, DEFAULT_MAX_TOKENS, DEFAULT_MODEL } from "./client";
import { loadPrompt } from "./prompts";
import { addUsage, computeCost, emptyUsage } from "./pricing";
import { formatIssuesForPrompt, parseAndValidate } from "./parse";
import type {
  GenerationResult,
  TokenUsage,
  ValidationIssue,
} from "./types";

export type RefineOptions = {
  model?: string;
  maxTokens?: number;
  abortSignal?: AbortSignal;
};

/**
 * Apply a creator's refinement instruction to the current funnel spec
 * and return the patched spec.
 *
 * Validation + retry strategy mirrors generateFunnelSpec: one retry on
 * failure, with the previous attempt and validation issues fed back in.
 *
 * NOTE: this function does NOT persist the patched spec — the Studio
 * applies it on user accept (per design/STUDIO.md §3 diff card).
 */
export async function refineFunnelSpec(
  currentSpec: CatalogNode[],
  instruction: string,
  options: RefineOptions = {},
): Promise<GenerationResult> {
  const model = options.model ?? DEFAULT_MODEL;
  const maxTokens = options.maxTokens ?? DEFAULT_MAX_TOKENS;
  const system = loadPrompt("refine-system.md");

  const baseUser = buildUserMessage(currentSpec, instruction);

  let totalUsage: TokenUsage = emptyUsage();

  const first = await callOnce({ model, maxTokens, system, userMessage: baseUser, abortSignal: options.abortSignal });
  totalUsage = addUsage(totalUsage, first.usage);

  const firstParsed = parseAndValidate(first.text);
  if (firstParsed.ok) {
    const cost = computeCost(model, totalUsage);
    return { ok: true, spec: firstParsed.spec, usage: totalUsage, cost, model, attempts: 1 };
  }

  const retryUser = buildRetryMessage(baseUser, first.text, firstParsed.issues);
  const second = await callOnce({ model, maxTokens, system, userMessage: retryUser, abortSignal: options.abortSignal });
  totalUsage = addUsage(totalUsage, second.usage);

  const secondParsed = parseAndValidate(second.text);
  const cost = computeCost(model, totalUsage);
  if (secondParsed.ok) {
    return { ok: true, spec: secondParsed.spec, usage: totalUsage, cost, model, attempts: 2 };
  }

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

function buildUserMessage(currentSpec: CatalogNode[], instruction: string): string {
  return [
    "<current_spec>",
    JSON.stringify(currentSpec, null, 2),
    "</current_spec>",
    "",
    "<instruction>",
    instruction,
    "</instruction>",
    "",
    "Apply the instruction. Re-emit the entire spec — the full JSON array of Screens — with the change applied. Preserve everything the instruction did not mention.",
  ].join("\n");
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
    "Re-emit the entire patched spec, fixed. Output only the JSON array, starting with `[`.",
  ].join("\n");
}

type CallArgs = {
  model: string;
  maxTokens: number;
  system: string;
  userMessage: string;
  abortSignal?: AbortSignal;
};

async function callOnce(args: CallArgs): Promise<{ text: string; usage: TokenUsage }> {
  const client = anthropicClient();
  // Refine doesn't need streaming — the Studio waits for the final spec
  // before showing the diff card. Use a non-streaming call for simpler
  // server semantics.
  const message = await client.messages.create(
    {
      model: args.model,
      max_tokens: args.maxTokens,
      system: args.system,
      messages: [{ role: "user", content: args.userMessage }],
    },
    args.abortSignal ? { signal: args.abortSignal } : undefined,
  );

  const text = message.content
    .filter((block): block is Extract<typeof block, { type: "text" }> => block.type === "text")
    .map((block) => block.text)
    .join("");

  const usage: TokenUsage = {
    input_tokens: message.usage.input_tokens ?? 0,
    output_tokens: message.usage.output_tokens ?? 0,
    cache_creation_input_tokens: message.usage.cache_creation_input_tokens ?? undefined,
    cache_read_input_tokens: message.usage.cache_read_input_tokens ?? undefined,
  };

  return { text, usage };
}
