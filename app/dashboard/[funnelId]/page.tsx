import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { loadAnalytics } from "@/lib/api/analytics";
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
  // Resolve the public URL for share/copy from the request host so the
  // dashboard works on localhost, Vercel preview URLs, and the
  // production domain without per-environment config.
  const proto = (h.get("x-forwarded-proto") ?? "http").split(",")[0]!.trim();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const origin = `${proto}://${host}`;
  const publicUrl = `${origin}/f/${funnelId}`;

  // Call the shared analytics builder directly. We previously did
  // `await fetch(${origin}/api/funnels/${funnelId}/analytics)` here, but
  // that's a function-to-function HTTP round-trip on Vercel which flaked
  // on cold starts and surfaced as a generic "Analytics failed to load"
  // even when the underlying query succeeded. Calling in-process keeps
  // the data path simple and lets real Supabase errors propagate with
  // their messages intact.
  const result = await loadAnalytics(funnelId);
  if (result.kind === "notFound") notFound();
  if (result.kind === "error") {
    return <FatalLoad message={result.message} funnelId={funnelId} />;
  }
  const analytics = result.payload;

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
