import { notFound } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { SpecSchema } from "@/lib/api/specSchema";
import { RoutingRulesSchema } from "@/lib/api/routing";
import { StudioWorkbench } from "./StudioWorkbench";
import type { FunnelRecord, VariantRecord } from "@/lib/studio/types";

export const dynamic = "force-dynamic";

export default async function StudioFunnelPage({
  params,
}: {
  params: Promise<{ funnelId: string }>;
}) {
  const { funnelId } = await params;
  const supabase = supabaseAdmin();

  const { data: funnel, error: funnelErr } = await supabase
    .from("funnels")
    .select("id, title, description, status, created_at, updated_at")
    .eq("id", funnelId)
    .maybeSingle();
  if (funnelErr) throw new Error(funnelErr.message);
  if (!funnel) notFound();

  const { data: variants, error: vErr } = await supabase
    .from("variants")
    .select("id, funnel_id, name, spec, routing_rules, created_at, updated_at")
    .eq("funnel_id", funnelId)
    .order("created_at", { ascending: true });
  if (vErr) throw new Error(vErr.message);

  const validVariants: VariantRecord[] = (variants ?? []).map((v) => {
    const specParsed = SpecSchema.safeParse(v.spec);
    return {
      id: v.id,
      funnel_id: v.funnel_id,
      name: v.name,
      spec: specParsed.success ? (v.spec as VariantRecord["spec"]) : [],
      routing_rules: RoutingRulesSchema.parse(v.routing_rules ?? {}),
      created_at: v.created_at,
      updated_at: v.updated_at,
    };
  });

  return (
    <StudioWorkbench
      funnel={funnel as FunnelRecord}
      variants={validVariants}
    />
  );
}
