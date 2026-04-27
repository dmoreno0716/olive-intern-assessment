import type { GenerationCost, TokenUsage } from "./types";

/**
 * Per-million-token USD prices for Anthropic models we might run with.
 * Numbers reflect Anthropic's published list pricing as of 2026-04 — see
 * DECISIONS.md for the per-quiz cost analysis. If you change the default
 * model, add its row here.
 */
export const MODEL_PRICES_USD_PER_MTOK: Record<string, { input: number; output: number }> = {
  "claude-opus-4-7": { input: 15, output: 75 },
  "claude-opus-4-5": { input: 15, output: 75 },
  "claude-sonnet-4-6": { input: 3, output: 15 },
  "claude-sonnet-4-5": { input: 3, output: 15 },
  "claude-haiku-4-5": { input: 1, output: 5 },
};

export function computeCost(model: string, usage: TokenUsage): GenerationCost {
  const price = MODEL_PRICES_USD_PER_MTOK[model] ??
    MODEL_PRICES_USD_PER_MTOK[stripDateSuffix(model)] ?? { input: 0, output: 0 };
  const input_usd = (usage.input_tokens / 1_000_000) * price.input;
  const output_usd = (usage.output_tokens / 1_000_000) * price.output;
  return {
    input_usd,
    output_usd,
    total_usd: input_usd + output_usd,
  };
}

function stripDateSuffix(model: string): string {
  return model.replace(/-\d{8}$/, "");
}

export function emptyUsage(): TokenUsage {
  return { input_tokens: 0, output_tokens: 0 };
}

export function addUsage(a: TokenUsage, b: TokenUsage): TokenUsage {
  return {
    input_tokens: a.input_tokens + b.input_tokens,
    output_tokens: a.output_tokens + b.output_tokens,
    cache_creation_input_tokens:
      (a.cache_creation_input_tokens ?? 0) + (b.cache_creation_input_tokens ?? 0) || undefined,
    cache_read_input_tokens:
      (a.cache_read_input_tokens ?? 0) + (b.cache_read_input_tokens ?? 0) || undefined,
  };
}
