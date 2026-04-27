import { supabaseAdmin } from "@/lib/supabase/admin";
import { notFound, ok, serverError } from "@/lib/api/json";

type SessionRow = {
  id: string;
  variant_id: string;
  source: string | null;
  completed_at: string | null;
  abandoned_at: string | null;
  cta_clicked: boolean;
  total_dwell_ms: number;
};

type VariantRow = { id: string; name: string };

type ResponseRow = {
  session_id: string;
  screen_id: string;
  screen_index: number;
  dwell_ms: number;
};

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id: funnelId } = await ctx.params;
  const supabase = supabaseAdmin();

  const { data: funnel, error: fErr } = await supabase
    .from("funnels")
    .select("id")
    .eq("id", funnelId)
    .maybeSingle();
  if (fErr) return serverError(fErr.message);
  if (!funnel) return notFound("Funnel not found");

  const [variantsRes, sessionsRes] = await Promise.all([
    supabase
      .from("variants")
      .select("id, name")
      .eq("funnel_id", funnelId),
    supabase
      .from("sessions")
      .select(
        "id, variant_id, source, completed_at, abandoned_at, cta_clicked, total_dwell_ms",
      )
      .eq("funnel_id", funnelId),
  ]);

  if (variantsRes.error) return serverError(variantsRes.error.message);
  if (sessionsRes.error) return serverError(sessionsRes.error.message);

  const variants = (variantsRes.data ?? []) as VariantRow[];
  const sessions = (sessionsRes.data ?? []) as SessionRow[];

  let responses: ResponseRow[] = [];
  if (sessions.length > 0) {
    const { data: respData, error: rErr } = await supabase
      .from("responses")
      .select("session_id, screen_id, screen_index, dwell_ms")
      .in(
        "session_id",
        sessions.map((s) => s.id),
      );
    if (rErr) return serverError(rErr.message);
    responses = (respData ?? []) as ResponseRow[];
  }

  const perVariant = variants.map((v) => {
    const vSessions = sessions.filter((s) => s.variant_id === v.id);
    const started = vSessions.length;
    const completed = vSessions.filter((s) => s.completed_at).length;
    const cta = vSessions.filter((s) => s.cta_clicked).length;
    return {
      variant_id: v.id,
      variant_name: v.name,
      started,
      completed,
      cta_clicked: cta,
      completion_rate: started ? completed / started : 0,
      cta_rate: started ? cta / started : 0,
    };
  });

  const sourceMap = new Map<
    string,
    { source: string; started: number; completed: number; cta_clicked: number }
  >();
  for (const s of sessions) {
    const key = s.source ?? "direct";
    const row = sourceMap.get(key) ?? {
      source: key,
      started: 0,
      completed: 0,
      cta_clicked: 0,
    };
    row.started += 1;
    if (s.completed_at) row.completed += 1;
    if (s.cta_clicked) row.cta_clicked += 1;
    sourceMap.set(key, row);
  }
  const perSource = [...sourceMap.values()].map((r) => ({
    ...r,
    completion_rate: r.started ? r.completed / r.started : 0,
  }));

  const screenMap = new Map<
    string,
    {
      screen_id: string;
      screen_index: number;
      reached: number;
      dwell_total: number;
    }
  >();
  for (const r of responses) {
    const row = screenMap.get(r.screen_id) ?? {
      screen_id: r.screen_id,
      screen_index: r.screen_index,
      reached: 0,
      dwell_total: 0,
    };
    row.reached += 1;
    row.dwell_total += r.dwell_ms;
    screenMap.set(r.screen_id, row);
  }
  const dropOff = [...screenMap.values()]
    .sort((a, b) => a.screen_index - b.screen_index)
    .map((r) => ({
      screen_id: r.screen_id,
      screen_index: r.screen_index,
      reached: r.reached,
      median_dwell_ms: r.reached ? Math.round(r.dwell_total / r.reached) : 0,
    }));

  const totals = {
    started: sessions.length,
    completed: sessions.filter((s) => s.completed_at).length,
    cta_clicked: sessions.filter((s) => s.cta_clicked).length,
  };

  return ok({
    totals,
    per_variant: perVariant,
    per_source: perSource,
    drop_off: dropOff,
  });
}
