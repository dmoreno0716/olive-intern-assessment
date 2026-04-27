import { z } from "zod";
import { supabaseAdmin } from "@/lib/supabase/admin";
import {
  badRequest,
  created,
  notFound,
  readJson,
  serverError,
} from "@/lib/api/json";
import { RoutingRulesSchema } from "@/lib/api/routing";
import { SpecSchema } from "@/lib/api/specSchema";

const NewVariantBody = z.object({
  mode: z.literal("new"),
  name: z.string().min(1).max(120),
  spec: SpecSchema.default([]),
  routing_rules: RoutingRulesSchema.optional(),
});

const DuplicateBody = z.object({
  mode: z.literal("duplicate"),
  source_variant_id: z.string().uuid(),
  name: z.string().min(1).max(120).optional(),
});

const VariantBody = z.discriminatedUnion("mode", [NewVariantBody, DuplicateBody]);

export async function POST(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id: funnelId } = await ctx.params;
  const parsed = await readJson(req, VariantBody);
  if (parsed.error) return parsed.error;

  const supabase = supabaseAdmin();

  const { data: funnel, error: funnelErr } = await supabase
    .from("funnels")
    .select("id")
    .eq("id", funnelId)
    .maybeSingle();
  if (funnelErr) return serverError(funnelErr.message);
  if (!funnel) return notFound("Funnel not found");

  if (parsed.data.mode === "duplicate") {
    const { data: source, error: srcErr } = await supabase
      .from("variants")
      .select("name, spec, routing_rules, funnel_id")
      .eq("id", parsed.data.source_variant_id)
      .maybeSingle();
    if (srcErr) return serverError(srcErr.message);
    if (!source || source.funnel_id !== funnelId) {
      return badRequest("source_variant_id does not belong to this funnel");
    }
    const { data, error } = await supabase
      .from("variants")
      .insert({
        funnel_id: funnelId,
        name: parsed.data.name ?? `${source.name} · v2`,
        spec: source.spec,
        routing_rules: { ...source.routing_rules, is_default: false },
      })
      .select("id, funnel_id, name, spec, routing_rules, created_at, updated_at")
      .single();
    if (error) return serverError(error.message);
    return created(data);
  }

  const { data, error } = await supabase
    .from("variants")
    .insert({
      funnel_id: funnelId,
      name: parsed.data.name,
      spec: parsed.data.spec,
      routing_rules: parsed.data.routing_rules ?? RoutingRulesSchema.parse({}),
    })
    .select("id, funnel_id, name, spec, routing_rules, created_at, updated_at")
    .single();
  if (error) return serverError(error.message);
  return created(data);
}
