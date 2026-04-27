/**
 * Regression suite for the funnel-spec generator.
 *
 * Pass 1: runs the 5 prompts that appear as "Try one of these" chips in
 *   the Studio empty state (design/STUDIO.md State 1) and prints, for
 *   each: validity status, screen count + kinds, token usage + USD cost,
 *   the full validated spec (or the validation issues).
 *
 * Pass 2: re-runs the first prompt with OLIVE_TEST_FORCE_INVALID_FIRST=1
 *   set, which deterministically forces the first LLM call to return a
 *   synthetic invalid spec (an unknown kind). This exercises the
 *   validation+retry path without relying on the model to misbehave.
 *   Asserts: validation_error event emitted, retry happens, retry
 *   succeeds with attempts=2 OR fails with a structured error.
 *
 * Run: pnpm tsx scripts/test-generation.ts
 *
 * Optional flags:
 *   --json      emit the full pass-1 results as JSON on stdout
 *   --skip-happy   skip the 5-prompt happy path and run only the retry test
 *
 * Set OLIVE_LLM_MODEL in .env.local to override the default model.
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { generateFunnelSpec } from "../lib/llm/generate";
import type { CatalogNode } from "../lib/catalog/types";
import type { StreamEvent } from "../lib/llm/types";

loadEnvLocal();

const PROMPTS: { label: string; prompt: string }[] = [
  { label: "eater-quiz",    prompt: "5-question quiz: what kind of eater are you?" },
  { label: "lead-gen",      prompt: "Lead-gen quiz that recommends an Olive plan" },
  { label: "paywall",       prompt: "Standalone paywall for Olive Pro upsell" },
  { label: "onboarding",    prompt: "Onboarding quiz for new Olive users" },
  { label: "feedback",      prompt: "3-question feedback survey" },
];

type RunSummary = {
  label: string;
  prompt: string;
  ok: boolean;
  attempts: number;
  model: string;
  durationMs: number;
  screenCount?: number;
  screenKinds?: string[];
  fields?: string[];
  usage: { input_tokens: number; output_tokens: number };
  cost: { input_usd: number; output_usd: number; total_usd: number };
  issues?: { path: string; message: string }[];
  spec?: CatalogNode[];
};

async function main() {
  const emitJson = process.argv.includes("--json");
  const skipHappy = process.argv.includes("--skip-happy");

  if (process.env.OLIVE_TEST_FORCE_INVALID_FIRST === "1" || process.env.OLIVE_TEST_FORCE_INVALID_ALL === "1") {
    console.warn(
      "⚠ OLIVE_TEST_FORCE_INVALID_* is already set in the environment — pass-1 tests will be affected. Unset it for a clean baseline.",
    );
  }

  const summaries: RunSummary[] = [];

  if (!skipHappy) {
    console.log("=".repeat(72));
    console.log("PASS 1 — happy-path regression (5 prompts, real LLM)");
    console.log("=".repeat(72));

    for (const { label, prompt } of PROMPTS) {
      summaries.push(await runPrompt(label, prompt));
    }
  }

  console.log("");
  console.log("=".repeat(72));
  console.log("PASS 2 — retry-path test (OLIVE_TEST_FORCE_INVALID_FIRST=1)");
  console.log("=".repeat(72));
  const retry = await runRetryPathTest();

  if (!skipHappy) {
    console.log("");
    console.log("=".repeat(72));
    console.log("PASS 1 SUMMARY");
    console.log("=".repeat(72));

    const totalCost = summaries.reduce((acc, s) => acc + s.cost.total_usd, 0);
    const totalInput = summaries.reduce((acc, s) => acc + s.usage.input_tokens, 0);
    const totalOutput = summaries.reduce((acc, s) => acc + s.usage.output_tokens, 0);
    const okCount = summaries.filter((s) => s.ok).length;

    for (const s of summaries) {
      const status = s.ok ? "✓" : "✗";
      const screens = s.ok ? `${s.screenCount} screens` : "FAILED";
      console.log(
        `  ${status} ${s.label.padEnd(12)} ${screens.padEnd(11)} ` +
          `${s.attempts}× ${s.durationMs}ms  $${s.cost.total_usd.toFixed(4)}`,
      );
    }
    console.log("");
    console.log(`  ${okCount}/${summaries.length} valid`);
    console.log(`  total tokens: ${totalInput} in / ${totalOutput} out`);
    console.log(`  total cost:   $${totalCost.toFixed(4)}`);
    console.log(`  per-quiz avg: $${(totalCost / Math.max(summaries.length, 1)).toFixed(4)}`);

    if (okCount < summaries.length) process.exitCode = 1;

    if (emitJson) {
      process.stdout.write("\n--- JSON (pass 1) ---\n");
      process.stdout.write(JSON.stringify(summaries, null, 2));
      process.stdout.write("\n");
    } else {
      console.log("");
      console.log("=".repeat(72));
      console.log("FULL SPECS (pass 1)");
      console.log("=".repeat(72));
      for (const s of summaries) {
        console.log("");
        console.log(`▶ ${s.label}`);
        if (s.spec) {
          console.log(JSON.stringify(s.spec, null, 2));
        } else {
          console.log("  (no spec — generation failed)");
        }
      }
    }
  }

  console.log("");
  console.log("=".repeat(72));
  console.log("PASS 2 SUMMARY (retry path)");
  console.log("=".repeat(72));
  if (retry.passed) {
    console.log(`  ✓ all ${retry.checks.length} retry-path assertions passed`);
  } else {
    console.log(`  ✗ ${retry.checks.filter((c) => !c.ok).length}/${retry.checks.length} retry-path assertions failed`);
    process.exitCode = 1;
  }
}

async function runPrompt(label: string, prompt: string): Promise<RunSummary> {
  console.log("");
  console.log("─".repeat(72));
  console.log(`▶ ${label}`);
  console.log(`  prompt: ${prompt}`);

  const start = Date.now();
  const result = await generateFunnelSpec(prompt, {
    onEvent: makeLogger(),
  });
  const durationMs = Date.now() - start;

  const summary: RunSummary = {
    label,
    prompt,
    ok: result.ok,
    attempts: result.attempts,
    model: result.model,
    durationMs,
    usage: { input_tokens: result.usage.input_tokens, output_tokens: result.usage.output_tokens },
    cost: result.cost,
  };

  if (result.ok) {
    const screens = result.spec.map(extractScreenInfo);
    summary.screenCount = screens.length;
    summary.screenKinds = screens.map((s) => `${s.id}:${s.kind}`);
    summary.fields = collectFields(result.spec);
    summary.spec = result.spec;
    console.log(`  ✓ valid spec — ${screens.length} screens, ${result.attempts} attempt(s), ${durationMs}ms`);
    console.log(`  screens: ${summary.screenKinds.join(", ")}`);
    if (summary.fields.length) console.log(`  fields:  ${summary.fields.join(", ")}`);
  } else {
    summary.issues = result.issues ?? [];
    console.log(`  ✗ failed after ${result.attempts} attempt(s): ${result.error}`);
    for (const issue of summary.issues.slice(0, 8)) {
      console.log(`     - ${issue.path}: ${issue.message}`);
    }
  }
  console.log(
    `  usage: ${result.usage.input_tokens} in / ${result.usage.output_tokens} out` +
      ` · cost $${result.cost.total_usd.toFixed(4)}` +
      ` (in $${result.cost.input_usd.toFixed(4)} / out $${result.cost.output_usd.toFixed(4)})`,
  );

  return summary;
}

type RetryCheck = { name: string; ok: boolean };
type RetryReport = { passed: boolean; checks: RetryCheck[] };

async function runRetryPathTest(): Promise<RetryReport> {
  const prompt = "3-question quiz about your favorite season";
  console.log("");
  console.log(`▶ retry-path`);
  console.log(`  prompt: ${prompt}`);
  console.log(`  setup: setting OLIVE_TEST_FORCE_INVALID_FIRST=1 — attempt 1 will return a synthetic spec containing an unknown kind ("ProgressDots"). Attempt 2 hits the real LLM with the validation issues fed back in the prompt.`);

  const events: StreamEvent[] = [];
  const previous = process.env.OLIVE_TEST_FORCE_INVALID_FIRST;
  process.env.OLIVE_TEST_FORCE_INVALID_FIRST = "1";

  const start = Date.now();
  let result: Awaited<ReturnType<typeof generateFunnelSpec>>;
  try {
    result = await generateFunnelSpec(prompt, {
      onEvent: (event) => {
        events.push(event);
        logEvent(event);
      },
    });
  } finally {
    if (previous === undefined) delete process.env.OLIVE_TEST_FORCE_INVALID_FIRST;
    else process.env.OLIVE_TEST_FORCE_INVALID_FIRST = previous;
  }
  const durationMs = Date.now() - start;

  const validationErrorEvents = events.filter((e) => e.type === "validation_error");
  const retryEvents = events.filter((e) => e.type === "retry");
  const finalEvents = events.filter((e) => e.type === "final");
  const errorEvents = events.filter((e) => e.type === "error");
  const firstValidationError = validationErrorEvents[0];

  const checks: RetryCheck[] = [
    {
      name: "1 validation_error event emitted on attempt 1",
      ok: validationErrorEvents.length === 1 && firstValidationError?.type === "validation_error" && firstValidationError.attempt === 1,
    },
    {
      name: "validation_error event includes detailed issues (with path + message)",
      ok:
        firstValidationError?.type === "validation_error" &&
        firstValidationError.issues.length > 0 &&
        firstValidationError.issues.every((i) => typeof i.path === "string" && typeof i.message === "string"),
    },
    {
      name: 'validation_error flagged the synthetic "ProgressDots" unknown kind',
      ok:
        firstValidationError?.type === "validation_error" &&
        firstValidationError.issues.some((i) => /ProgressDots|Unknown kind/i.test(i.message)),
    },
    {
      name: "retry event emitted with attempt=2",
      ok: retryEvents.length === 1 && retryEvents[0].type === "retry" && retryEvents[0].attempt === 2,
    },
    {
      name: "result.attempts === 2",
      ok: result.attempts === 2,
    },
    {
      name: "result is structured (success final OR clean error event, no crash)",
      ok: (result.ok === true && finalEvents.length === 1) || (result.ok === false && errorEvents.length === 1),
    },
  ];

  console.log("");
  if (result.ok) {
    const screens = result.spec.map(extractScreenInfo);
    console.log(`  ✓ retry recovered — valid spec, ${screens.length} screens, ${durationMs}ms`);
    console.log(`  screens: ${screens.map((s) => `${s.id}:${s.kind}`).join(", ")}`);
  } else {
    console.log(`  ⓘ retry also failed — clean structured error returned (no crash)`);
    console.log(`  error: ${result.error}`);
    for (const issue of (result.issues ?? []).slice(0, 5)) {
      console.log(`     - ${issue.path}: ${issue.message}`);
    }
  }
  console.log(
    `  usage: ${result.usage.input_tokens} in / ${result.usage.output_tokens} out` +
      ` · cost $${result.cost.total_usd.toFixed(4)} (only the retry hits the LLM)`,
  );
  console.log("");

  for (const check of checks) {
    console.log(`  ${check.ok ? "✓" : "✗"} ${check.name}`);
  }

  return { passed: checks.every((c) => c.ok), checks };
}

function makeLogger(): (event: StreamEvent) => void {
  return (event) => logEvent(event);
}

function logEvent(event: StreamEvent): void {
  if (event.type === "start") console.log(`  model: ${event.model}`);
  if (event.type === "validation_error") {
    console.log(`  ⚠ attempt ${event.attempt} failed validation:`);
    for (const issue of event.issues.slice(0, 5)) {
      console.log(`     - ${issue.path}: ${issue.message}`);
    }
    if (event.issues.length > 5) {
      console.log(`     … ${event.issues.length - 5} more issues`);
    }
  }
  if (event.type === "retry") console.log(`  ↻ retry attempt ${event.attempt}`);
  if (event.type === "error") console.log(`  ✗ error event: ${event.message}`);
}

function extractScreenInfo(node: CatalogNode): { id: string; kind: string } {
  const props = (node.props ?? {}) as { id?: string; kind?: string };
  return { id: props.id ?? "?", kind: props.kind ?? "?" };
}

function collectFields(spec: CatalogNode[]): string[] {
  const fields: string[] = [];
  const walk = (node: unknown) => {
    if (!node || typeof node !== "object") return;
    const n = node as { kind?: string; props?: Record<string, unknown> };
    const props = n.props ?? {};
    if (typeof props.field === "string") fields.push(props.field);
    for (const key of ["body", "footer", "children"] as const) {
      const v = props[key];
      if (Array.isArray(v)) v.forEach(walk);
    }
  };
  spec.forEach(walk);
  return fields;
}

main().catch((err) => {
  console.error("test-generation failed:", err);
  process.exitCode = 1;
});

/**
 * Minimal .env.local loader (same behavior as scripts/seed.ts). Avoids a
 * `dotenv` dependency for one script.
 */
function loadEnvLocal() {
  const path = resolve(process.cwd(), ".env.local");
  let raw: string;
  try {
    raw = readFileSync(path, "utf8");
  } catch {
    return;
  }
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    if (!(key in process.env)) process.env[key] = value;
  }
}
