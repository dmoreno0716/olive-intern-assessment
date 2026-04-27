import { supabaseAdmin } from "@/lib/supabase/admin";
import { notFound, ok, serverError } from "@/lib/api/json";

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
