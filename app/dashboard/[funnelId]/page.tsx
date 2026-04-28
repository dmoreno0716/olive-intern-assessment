import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabase/admin";
import type { AnalyticsPayload } from "@/app/api/funnels/[id]/analytics/route";
import { Dashboard } from "./Dashboard";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ funnelId: string }> };

export default async function DashboardPage({ params }: Props) {
  const { funnelId } = await params;

  const supabase = supabaseAdmin();
  const { data: funnel, error } = await supabase
    .from("funnels")
    .select("id, title, status, created_at, updated_at")
    .eq("id", funnelId)
    .maybeSingle();
  if (error) {
    return <FatalLoad message={error.message} funnelId={funnelId} />;
  }
  if (!funnel) notFound();

  const h = await headers();
  // Resolve the public URL for share/copy. Use the request host so
  // dashboards rendered behind preview URLs still surface a valid link.
  const proto = (h.get("x-forwarded-proto") ?? "http").split(",")[0]!.trim();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const origin = `${proto}://${host}`;
  const publicUrl = `${origin}/f/${funnelId}`;

  const { data: variantsForExistence, error: vErr } = await supabase
    .from("variants")
    .select("id")
    .eq("funnel_id", funnelId)
    .limit(1);
  if (vErr) {
    return <FatalLoad message={vErr.message} funnelId={funnelId} />;
  }
  if (!variantsForExistence || variantsForExistence.length === 0) {
    return <FatalLoad message="Funnel has no variants" funnelId={funnelId} />;
  }

  // Reuse the analytics route for the heavy aggregation. Server fetch
  // (no client round-trip) so the page is fully rendered on first byte.
  const res = await fetch(`${origin}/api/funnels/${funnelId}/analytics`, {
    cache: "no-store",
  });
  if (!res.ok) {
    return <FatalLoad message="Analytics failed to load" funnelId={funnelId} />;
  }
  const analytics = (await res.json()) as AnalyticsPayload;

  return (
    <Dashboard
      funnelId={funnelId}
      funnelTitle={funnel.title}
      funnelStatus={funnel.status as "draft" | "published"}
      funnelUpdatedAt={funnel.updated_at}
      publicUrl={publicUrl}
      analytics={analytics}
    />
  );
}

function FatalLoad({
  message,
  funnelId,
}: {
  message: string;
  funnelId: string;
}) {
  return (
    <main className="min-h-dvh bg-[var(--bg)] px-6 py-16">
      <div className="mx-auto flex max-w-md flex-col items-center gap-3 rounded-[var(--r-lg)] border border-[var(--border-c)] bg-[var(--surface)] p-8 text-center">
        <h1 className="font-serif text-[24px] italic text-[var(--text)]">
          Couldn&apos;t load dashboard
        </h1>
        <p className="font-mono text-[12px] text-[var(--text-mute)]">
          {message}
        </p>
        <p className="font-mono text-[10.5px] uppercase tracking-[0.06em] text-[var(--text-faint)]">
          funnel · {funnelId}
        </p>
      </div>
    </main>
  );
}
