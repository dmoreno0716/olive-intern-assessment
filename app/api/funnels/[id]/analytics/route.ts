import { notFound, ok, serverError } from "@/lib/api/json";
import { loadAnalytics } from "@/lib/api/analytics";

// Re-export the analytics types from the shared module so existing
// `import type { ... } from "@/app/api/funnels/[id]/analytics/route"`
// callers (the dashboard client component) keep working.
export type {
  AnalyticsPayload,
  AnalyticsResult,
  DropOffEntry,
  ResultBucket,
  ScreenInfo,
  SessionAnalytics,
  SourceBreakdown,
  TopResult,
  VariantAnalytics,
} from "@/lib/api/analytics";

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id: funnelId } = await ctx.params;
  const result = await loadAnalytics(funnelId);
  if (result.kind === "notFound") return notFound("Funnel not found");
  if (result.kind === "error") return serverError(result.message);
  return ok(result.payload);
}
