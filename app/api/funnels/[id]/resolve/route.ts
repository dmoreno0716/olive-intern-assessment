import { supabaseAdmin } from "@/lib/supabase/admin";
import { notFound, ok, serverError } from "@/lib/api/json";
import { resolveVariant, RoutingRulesSchema } from "@/lib/api/routing";

export async function GET(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;
  const url = new URL(req.url);
  const source = url.searchParams.get("source");
  const dwellMs = Number(url.searchParams.get("dwell_ms") ?? 0) || 0;

  const supabase = supabaseAdmin();
  const { data, error } = await supabase
    .from("variants")
    .select("id, name, spec, routing_rules")
    .eq("funnel_id", id)
    .order("created_at", { ascending: true });

  if (error) return serverError(error.message);
  if (!data || data.length === 0) return notFound("No variants for this funnel");

  const candidates = data.map((v) => ({
    id: v.id,
    name: v.name,
    routing_rules: RoutingRulesSchema.parse(v.routing_rules ?? {}),
  }));

  const picked = resolveVariant(candidates, { source, dwellMs });
  if (!picked) return notFound("No variant matched");

  const variantRow = data.find((v) => v.id === picked.id)!;
  return ok({
    variant: {
      id: variantRow.id,
      name: variantRow.name,
      spec: variantRow.spec,
      routing_rules: picked.routing_rules,
    },
  });
}
