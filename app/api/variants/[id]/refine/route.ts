import { z } from "zod";
import { notFound, ok, readJson, serverError } from "@/lib/api/json";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { refineFunnelSpec } from "@/lib/llm/refine";
import type { CatalogNode } from "@/lib/catalog/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
// LLM-backed (non-streaming) — typical 5–15s but the long-form refine
// case has hit ~25s. Match /api/generate's 60s ceiling for safety.
export const maxDuration = 60;

const RefineBody = z.object({
  instruction: z.string().min(1).max(2000),
});

/**
 * POST /api/variants/:id/refine
 *
 * Reads the variant's current spec, asks the LLM to apply the
 * instruction, returns the patched spec for the Studio's diff card to
 * show. Does NOT persist — the Studio applies on user accept by PATCHing
 * the variant.
 */
export async function POST(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;
  const parsed = await readJson(req, RefineBody);
  if (parsed.error) return parsed.error;

  const supabase = supabaseAdmin();
  const { data: variant, error: variantErr } = await supabase
    .from("variants")
    .select("id, funnel_id, spec")
    .eq("id", id)
    .maybeSingle();
  if (variantErr) return serverError(variantErr.message);
  if (!variant) return notFound("Variant not found");

  const currentSpec = (variant.spec ?? []) as CatalogNode[];

  const result = await refineFunnelSpec(currentSpec, parsed.data.instruction, {
    abortSignal: req.signal,
  });

  if (!result.ok) {
    return Response.json(
      {
        ok: false,
        error: result.error,
        issues: result.issues,
        usage: result.usage,
        cost: result.cost,
        model: result.model,
        attempts: result.attempts,
      },
      { status: 422 },
    );
  }

  return ok({
    ok: true,
    variant_id: variant.id,
    spec: result.spec,
    model: result.model,
    attempts: result.attempts,
    usage: result.usage,
    cost: result.cost,
  });
}
