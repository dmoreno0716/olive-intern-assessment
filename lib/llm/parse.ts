import type { CatalogNode } from "@/lib/catalog/types";
import { SpecSchema } from "@/lib/api/specSchema";
import type { ValidationIssue } from "./types";

/**
 * Strip the most common LLM JSON wrapping mistakes:
 *  - leading/trailing whitespace
 *  - markdown fences (```json ... ```)
 *  - prose before the first `[` or after the last `]`
 *
 * The system prompt forbids fences and prose, but we forgive them here so
 * one-off slips don't trash an otherwise-valid spec.
 */
export function extractJsonArray(raw: string): string {
  let text = raw.trim();

  if (text.startsWith("```")) {
    text = text.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/, "").trim();
  }

  const firstBracket = text.indexOf("[");
  const lastBracket = text.lastIndexOf("]");
  if (firstBracket === -1 || lastBracket === -1 || lastBracket < firstBracket) {
    return text;
  }
  return text.slice(firstBracket, lastBracket + 1);
}

export type ParsedSpec =
  | { ok: true; spec: CatalogNode[] }
  | { ok: false; issues: ValidationIssue[] };

export function parseAndValidate(rawText: string): ParsedSpec {
  const candidate = extractJsonArray(rawText);

  let parsed: unknown;
  try {
    parsed = JSON.parse(candidate);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return {
      ok: false,
      issues: [{ path: "$", message: `JSON parse failed: ${message}` }],
    };
  }

  const result = SpecSchema.safeParse(parsed);
  if (!result.success) {
    return {
      ok: false,
      issues: result.error.issues.map((i) => ({
        path: i.path.length ? i.path.join(".") : "$",
        message: i.message,
      })),
    };
  }

  return { ok: true, spec: result.data as CatalogNode[] };
}

export function formatIssuesForPrompt(issues: ValidationIssue[]): string {
  return issues
    .slice(0, 25)
    .map((i, n) => `${n + 1}. at ${i.path}: ${i.message}`)
    .join("\n");
}
