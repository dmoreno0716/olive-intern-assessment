import { z } from "zod";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { notFound, ok, readJson, serverError } from "@/lib/api/json";

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;
  const supabase = supabaseAdmin();

  const { data: funnel, error: funnelErr } = await supabase
    .from("funnels")
    .select("id, title, description, status, created_at, updated_at")
    .eq("id", id)
    .maybeSingle();

  if (funnelErr) return serverError(funnelErr.message);
  if (!funnel) return notFound("Funnel not found");

  const { data: variants, error: variantsErr } = await supabase
    .from("variants")
    .select("id, funnel_id, name, spec, routing_rules, created_at, updated_at")
    .eq("funnel_id", id)
    .order("created_at", { ascending: true });

  if (variantsErr) return serverError(variantsErr.message);

  return ok({ funnel, variants: variants ?? [] });
}

const PatchBody = z
  .object({
    title: z.string().min(1).max(200).optional(),
    description: z.string().max(2000).optional(),
  })
  .refine((b) => b.title !== undefined || b.description !== undefined, {
    message: "At least one of title, description is required",
  });

export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;
  const parsed = await readJson(req, PatchBody);
  if (parsed.error) return parsed.error;

  const update: Record<string, unknown> = {};
  if (parsed.data.title !== undefined) update.title = parsed.data.title;
  if (parsed.data.description !== undefined) {
    update.description = parsed.data.description;
  }

  const supabase = supabaseAdmin();
  const { data, error } = await supabase
    .from("funnels")
    .update(update)
    .eq("id", id)
    .select("id, title, description, status, created_at, updated_at")
    .maybeSingle();

  if (error) return serverError(error.message);
  if (!data) return notFound("Funnel not found");
  return ok(data);
}
