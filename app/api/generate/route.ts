import { z } from "zod";
import { ok, readJson } from "@/lib/api/json";
import { exampleQuizSpec } from "@/lib/api/exampleSpec";

const GenerateBody = z.object({
  prompt: z.string().min(1).max(4000),
  funnel_id: z.string().uuid().optional(),
  variant_id: z.string().uuid().optional(),
});

/**
 * Stub: returns the hardcoded "Slow Burn" example spec from CATALOG.md.
 * Round 4 will swap the body for a real Claude call streamed back from
 * @anthropic-ai/sdk, gated by the catalog schemas.
 */
export async function POST(req: Request) {
  const parsed = await readJson(req, GenerateBody);
  if (parsed.error) return parsed.error;

  return ok({
    prompt: parsed.data.prompt,
    spec: exampleQuizSpec,
    model: "stub",
    note: "Round 3 stub — real LLM wiring lands in Round 4.",
  });
}
