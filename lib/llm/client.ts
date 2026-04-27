import Anthropic from "@anthropic-ai/sdk";

let cached: Anthropic | undefined;

export function anthropicClient(): Anthropic {
  if (!cached) {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new Error("ANTHROPIC_API_KEY missing — set it in .env.local");
    }
    cached = new Anthropic({ apiKey });
  }
  return cached;
}

export const DEFAULT_MODEL = process.env.OLIVE_LLM_MODEL ?? "claude-opus-4-7";
export const DEFAULT_MAX_TOKENS = Number(process.env.OLIVE_LLM_MAX_TOKENS ?? 8192);
