import { z } from "zod";
import { supabaseAdmin } from "@/lib/supabase/admin";
import {
  badRequest,
  notFound,
  ok,
  readJson,
  serverError,
} from "@/lib/api/json";
import { RoutingRulesSchema } from "@/lib/api/routing";
import { SpecSchema } from "@/lib/api/specSchema";

const PatchBody = z
  .object({
    name: z.string().min(1).max(120).optional(),
    spec: SpecSchema.optional(),
    routing_rules: RoutingRulesSchema.optional(),
  })
  .refine(
    (b) => b.name !== undefined || b.spec !== undefined || b.routing_rules !== undefined,
    { message: "At least one of name, spec, routing_rules is required" },
  );

export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;
  const parsed = await readJson(req, PatchBody);
  if (parsed.error) return parsed.error;

  const update: Record<string, unknown> = {};
  if (parsed.data.name !== undefined) update.name = parsed.data.name;
  if (parsed.data.spec !== undefined) update.spec = parsed.data.spec;
  if (parsed.data.routing_rules !== undefined)
    update.routing_rules = parsed.data.routing_rules;

  const supabase = supabaseAdmin();
  const { data, error } = await supabase
    .from("variants")
    .update(update)
    .eq("id", id)
    .select("id, funnel_id, name, spec, routing_rules, created_at, updated_at")
    .maybeSingle();

  if (error) return serverError(error.message);
  if (!data) return notFound("Variant not found");
  return ok(data);
}

export async function DELETE(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;
  const supabase = supabaseAdmin();

  const { count, error: countErr } = await supabase
    .from("variants")
    .select("id", { count: "exact", head: true })
    .eq("funnel_id", (await getFunnelIdForVariant(id)) ?? "");
  if (countErr) return serverError(countErr.message);
  if ((count ?? 0) <= 1) {
    return badRequest("Cannot delete the only variant of a funnel");
  }

  const { error } = await supabase.from("variants").delete().eq("id", id);
  if (error) return serverError(error.message);
  return ok({ deleted: id });
}

async function getFunnelIdForVariant(id: string): Promise<string | null> {
  const supabase = supabaseAdmin();
  const { data } = await supabase
    .from("variants")
    .select("funnel_id")
    .eq("id", id)
    .maybeSingle();
  return data?.funnel_id ?? null;
}
