import { notFound } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { resolveVariant, RoutingRulesSchema } from "@/lib/api/routing";
import { SpecSchema } from "@/lib/api/specSchema";
import type { CatalogNode } from "@/lib/catalog/types";
import { FunnelPlayer } from "./FunnelPlayer";
import { FunnelDraft, FunnelLoadError } from "./states";

type Search = { utm_source?: string | string[] };

export const dynamic = "force-dynamic";

export default async function PublicFunnelPage({
  params,
  searchParams,
}: {
  params: Promise<{ funnelId: string }>;
  searchParams: Promise<Search>;
}) {
  const { funnelId } = await params;
  const sp = await searchParams;
  const rawSource = Array.isArray(sp.utm_source) ? sp.utm_source[0] : sp.utm_source;
  const source = normalizeSource(rawSource ?? null);

  const supabase = supabaseAdmin();

  const { data: funnel, error: funnelErr } = await supabase
    .from("funnels")
    .select("id, title, status")
    .eq("id", funnelId)
    .maybeSingle();

  if (funnelErr) {
    return <FunnelLoadError funnelId={funnelId} message={funnelErr.message} />;
  }
  if (!funnel) notFound();
  if (funnel.status !== "published") {
    return <FunnelDraft funnelId={funnelId} title={funnel.title} />;
  }

  const { data: variants, error: vErr } = await supabase
    .from("variants")
    .select("id, name, spec, routing_rules")
    .eq("funnel_id", funnelId)
    .order("created_at", { ascending: true });

  if (vErr) {
    return <FunnelLoadError funnelId={funnelId} message={vErr.message} />;
  }
  if (!variants || variants.length === 0) notFound();

  const candidates = variants.map((v) => ({
    id: v.id,
    name: v.name,
    routing_rules: RoutingRulesSchema.parse(v.routing_rules ?? {}),
  }));
  const picked = resolveVariant(candidates, { source, dwellMs: 0 });
  if (!picked) notFound();

  const variantRow = variants.find((v) => v.id === picked.id)!;
  const specParsed = SpecSchema.safeParse(variantRow.spec);
  if (!specParsed.success) {
    return <FunnelLoadError funnelId={funnelId} message="Invalid spec" />;
  }
  const spec = variantRow.spec as CatalogNode[];

  return (
    <FunnelPlayer
      funnelId={funnelId}
      variantId={variantRow.id}
      variantName={variantRow.name}
      spec={spec}
      source={source}
      title={funnel.title}
    />
  );
}

const KNOWN_SOURCES = new Set(["tiktok", "ig", "instagram", "fb", "facebook", "direct"]);
function normalizeSource(raw: string | null): string | null {
  if (!raw) return null;
  const lower = raw.toLowerCase();
  if (KNOWN_SOURCES.has(lower)) {
    if (lower === "ig") return "instagram";
    if (lower === "fb") return "facebook";
    return lower;
  }
  return lower;
}
