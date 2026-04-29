import { supabaseAdmin } from "@/lib/supabase/admin";
import type { CatalogNode } from "@/lib/catalog/types";

/**
 * Server-only analytics aggregator. Used by:
 *   - app/api/funnels/[id]/analytics/route.ts (HTTP endpoint)
 *   - app/dashboard/[funnelId]/page.tsx       (server-component fetch)
 *
 * The dashboard previously made an HTTP fetch back to its own analytics
 * route during SSR; on Vercel that's a function-to-function round-trip
 * that flakes on cold starts (intermittently returns non-OK with no
 * body, surfacing as the user-facing "Analytics failed to load"
 * fallback even when the underlying query succeeds). Sharing this
 * function keeps the data path in-process and lets real errors bubble
 * with their stack rather than collapse to an opaque non-OK response.
 *
 * Returns a tagged union so callers don't have to wrap in try/catch:
 *   { kind: "ok", payload }      — happy path
 *   { kind: "notFound" }         — funnel id doesn't exist
 *   { kind: "error", message }   — Supabase error with the underlying message
 */

type SessionRow = {
  id: string;
  variant_id: string;
  source: string | null;
  started_at: string;
  completed_at: string | null;
  abandoned_at: string | null;
  cta_clicked: boolean;
  total_dwell_ms: number;
};

type VariantRow = {
  id: string;
  name: string;
  spec: unknown;
  routing_rules: unknown;
};

type ResponseRow = {
  id: string;
  session_id: string;
  screen_id: string;
  screen_index: number;
  answer: unknown;
  dwell_ms: number;
  submitted_at: string;
};

export type ScreenInfo = {
  screen_id: string;
  screen_index: number;
  kind: string;
  label: string;
};

export type DropOffEntry = {
  screen_id: string;
  screen_index: number;
  kind: string;
  label: string;
  reached: number;
  median_dwell_ms: number;
};

export type SourceBreakdown = {
  source: string;
  started: number;
  completed: number;
  cta_clicked: number;
  completion_rate: number;
};

export type ResultBucket = {
  result_id: string;
  label: string;
  color_index: number;
  count: number;
};

export type TopResult = {
  label: string;
  color_index: number;
  count: number;
  pct: number;
};

export type VariantAnalytics = {
  variant_id: string;
  variant_name: string;
  started: number;
  completed: number;
  cta_clicked: number;
  completion_rate: number;
  cta_rate: number;
  cta_intent_rate: number;
  has_result_screen: boolean;
  screens: ScreenInfo[];
  drop_off: DropOffEntry[];
  sparkline_30d: number[];
  per_source: SourceBreakdown[];
  result_distribution: ResultBucket[];
  top_result: TopResult | null;
};

export type SessionAnalytics = {
  session_id: string;
  started_at: string;
  completed_at: string | null;
  abandoned_at: string | null;
  variant_id: string;
  variant_name: string;
  source: string | null;
  total_dwell_ms: number;
  cta_clicked: boolean;
  screens_completed: number;
  total_screens: number;
  result: { label: string; color_index: number } | null;
  answers: {
    screen_id: string;
    screen_index: number;
    screen_label: string;
    screen_kind: string;
    dwell_ms: number;
    fields: { field: string; value: unknown; label?: string }[];
  }[];
};

export type AnalyticsPayload = {
  totals: { started: number; completed: number; cta_clicked: number };
  per_variant: VariantAnalytics[];
  per_source_total: SourceBreakdown[];
  responses: SessionAnalytics[];
  any_has_result_screen: boolean;
  spark_days: number;
};

export type AnalyticsResult =
  | { kind: "ok"; payload: AnalyticsPayload }
  | { kind: "notFound" }
  | { kind: "error"; message: string };

/**
 * Walk a Screen node and return a short, human-readable label (the
 * first Heading.text or Eyebrow.text — falls back to the screen kind).
 * Used for chart axis labels and tooltips.
 */
function deriveScreenLabel(node: CatalogNode): string {
  const props = (node.props ?? {}) as { kind?: string };
  let found: string | null = null;
  const visit = (n: CatalogNode) => {
    if (found) return;
    if (n.kind === "Heading" || n.kind === "Eyebrow") {
      const text = (n.props as { text?: string } | undefined)?.text;
      if (typeof text === "string" && text.trim().length > 0) {
        found = text.trim();
        return;
      }
    }
    const p = (n.props ?? {}) as Record<string, unknown>;
    for (const k of ["body", "footer", "children"]) {
      const arr = p[k];
      if (Array.isArray(arr)) {
        for (const c of arr) {
          if (c && typeof c === "object") visit(c as CatalogNode);
        }
      }
    }
  };
  visit(node);
  if (found) return found;
  const kind = props.kind ?? "screen";
  return kind.charAt(0).toUpperCase() + kind.slice(1);
}

function deriveScreens(spec: unknown): ScreenInfo[] {
  if (!Array.isArray(spec)) return [];
  return spec.map((node, i) => {
    const n = node as CatalogNode;
    const props = (n.props ?? {}) as { id?: string; kind?: string };
    return {
      screen_id: props.id ?? `screen-${i}`,
      screen_index: i,
      kind: props.kind ?? "question",
      label: deriveScreenLabel(n),
    };
  });
}

/**
 * Find the first ChoiceList/MultiChoice/ImageChoiceGrid field name in a
 * variant's spec. We use that as the segmentation field for the result-
 * distribution donut: without a real scoring engine, the answer to the
 * primary segmentation question is the most natural "outcome" axis.
 */
function findSegmentationField(spec: unknown): string | null {
  if (!Array.isArray(spec)) return null;
  let found: string | null = null;
  const visit = (n: CatalogNode) => {
    if (found) return;
    if (
      n.kind === "ChoiceList" ||
      n.kind === "MultiChoice" ||
      n.kind === "ImageChoiceGrid"
    ) {
      const f = (n.props as { field?: string } | undefined)?.field;
      if (typeof f === "string" && f.length > 0) {
        found = f;
        return;
      }
    }
    const p = (n.props ?? {}) as Record<string, unknown>;
    for (const k of ["body", "footer", "children"]) {
      const arr = p[k];
      if (Array.isArray(arr)) {
        for (const c of arr) {
          if (c && typeof c === "object") visit(c as CatalogNode);
        }
      }
    }
  };
  for (const n of spec) {
    if (n && typeof n === "object") visit(n as CatalogNode);
    if (found) break;
  }
  return found;
}

function median(arr: number[]): number {
  if (arr.length === 0) return 0;
  const sorted = [...arr].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? Math.round((sorted[mid - 1] + sorted[mid]) / 2)
    : sorted[mid];
}

/**
 * Hash a string into an integer in [0, 5) so each result label maps to one
 * of the 5 result palette slots (--r1..--r5) deterministically. Same
 * label always picks the same color across reloads, variants, and views.
 */
function colorIndexFor(label: string): number {
  let h = 5381;
  for (let i = 0; i < label.length; i++) {
    h = ((h << 5) + h + label.charCodeAt(i)) | 0;
  }
  return Math.abs(h) % 5;
}

const SPARK_DAYS = 30;

export async function loadAnalytics(funnelId: string): Promise<AnalyticsResult> {
  const supabase = supabaseAdmin();

  const { data: funnel, error: fErr } = await supabase
    .from("funnels")
    .select("id")
    .eq("id", funnelId)
    .maybeSingle();
  if (fErr) return { kind: "error", message: fErr.message };
  if (!funnel) return { kind: "notFound" };

  const [variantsRes, sessionsRes] = await Promise.all([
    supabase
      .from("variants")
      .select("id, name, spec, routing_rules")
      .eq("funnel_id", funnelId)
      .order("created_at", { ascending: true }),
    supabase
      .from("sessions")
      .select(
        "id, variant_id, source, started_at, completed_at, abandoned_at, cta_clicked, total_dwell_ms",
      )
      .eq("funnel_id", funnelId)
      .order("started_at", { ascending: false }),
  ]);

  if (variantsRes.error) return { kind: "error", message: variantsRes.error.message };
  if (sessionsRes.error) return { kind: "error", message: sessionsRes.error.message };

  const variants = (variantsRes.data ?? []) as VariantRow[];
  const sessions = (sessionsRes.data ?? []) as SessionRow[];

  let responses: ResponseRow[] = [];
  if (sessions.length > 0) {
    const { data: respData, error: rErr } = await supabase
      .from("responses")
      .select(
        "id, session_id, screen_id, screen_index, answer, dwell_ms, submitted_at",
      )
      .in(
        "session_id",
        sessions.map((s) => s.id),
      );
    if (rErr) return { kind: "error", message: rErr.message };
    responses = (respData ?? []) as ResponseRow[];
  }

  const responsesBySession = new Map<string, ResponseRow[]>();
  for (const r of responses) {
    const arr = responsesBySession.get(r.session_id) ?? [];
    arr.push(r);
    responsesBySession.set(r.session_id, arr);
  }
  for (const arr of responsesBySession.values()) {
    arr.sort((a, b) => a.screen_index - b.screen_index);
  }

  const variantMeta = new Map<
    string,
    {
      name: string;
      screens: ScreenInfo[];
      hasResultScreen: boolean;
      segmentationField: string | null;
      segmentationOptions: Map<string, string>;
    }
  >();

  for (const v of variants) {
    const screens = deriveScreens(v.spec);
    const hasResultScreen = screens.some((s) => s.kind === "result");
    const segmentationField = findSegmentationField(v.spec);

    const optMap = new Map<string, string>();
    if (segmentationField) {
      const visit = (n: CatalogNode) => {
        if (
          n.kind === "ChoiceList" ||
          n.kind === "MultiChoice" ||
          n.kind === "ImageChoiceGrid"
        ) {
          const props = n.props as
            | {
                field?: string;
                options?: { value?: string; label?: string }[];
              }
            | undefined;
          if (props?.field === segmentationField && Array.isArray(props.options)) {
            for (const o of props.options) {
              if (o.value) optMap.set(o.value, o.label ?? o.value);
            }
          }
        }
        const p = (n.props ?? {}) as Record<string, unknown>;
        for (const k of ["body", "footer", "children"]) {
          const arr = p[k];
          if (Array.isArray(arr)) {
            for (const c of arr) {
              if (c && typeof c === "object") visit(c as CatalogNode);
            }
          }
        }
      };
      if (Array.isArray(v.spec)) {
        for (const n of v.spec) {
          if (n && typeof n === "object") visit(n as CatalogNode);
        }
      }
    }

    variantMeta.set(v.id, {
      name: v.name,
      screens,
      hasResultScreen,
      segmentationField,
      segmentationOptions: optMap,
    });
  }

  const todayMidnightUTC = new Date();
  todayMidnightUTC.setUTCHours(0, 0, 0, 0);

  const perVariant: VariantAnalytics[] = variants.map((v) => {
    const meta = variantMeta.get(v.id)!;
    const vSessions = sessions.filter((s) => s.variant_id === v.id);
    const started = vSessions.length;
    const completed = vSessions.filter((s) => s.completed_at).length;
    const cta = vSessions.filter((s) => s.cta_clicked).length;

    const sparkline = new Array<number>(SPARK_DAYS).fill(0);
    for (const s of vSessions) {
      const ts = new Date(s.started_at);
      const dayDelta = Math.floor(
        (todayMidnightUTC.getTime() -
          new Date(
            Date.UTC(
              ts.getUTCFullYear(),
              ts.getUTCMonth(),
              ts.getUTCDate(),
            ),
          ).getTime()) /
          86_400_000,
      );
      if (dayDelta >= 0 && dayDelta < SPARK_DAYS) {
        sparkline[SPARK_DAYS - 1 - dayDelta] += 1;
      }
    }

    const reachByIndex = new Array<number>(meta.screens.length).fill(0);
    const dwellByIndex: number[][] = meta.screens.map(() => []);
    for (const sess of vSessions) {
      const sessResp = responsesBySession.get(sess.id) ?? [];
      const lastIdx = sessResp.length
        ? sessResp[sessResp.length - 1].screen_index
        : -1;
      for (let i = 0; i <= Math.min(lastIdx, meta.screens.length - 1); i++) {
        reachByIndex[i] += 1;
      }
      if (sess.completed_at && lastIdx + 1 < meta.screens.length) {
        for (let i = lastIdx + 1; i < meta.screens.length; i++) {
          reachByIndex[i] += 1;
        }
      }
      for (const r of sessResp) {
        if (r.screen_index < meta.screens.length) {
          dwellByIndex[r.screen_index].push(r.dwell_ms);
        }
      }
    }
    const dropOff: DropOffEntry[] = meta.screens.map((s, i) => ({
      screen_id: s.screen_id,
      screen_index: s.screen_index,
      kind: s.kind,
      label: s.label,
      reached: reachByIndex[i],
      median_dwell_ms: median(dwellByIndex[i]),
    }));

    const sourceMap = new Map<
      string,
      { source: string; started: number; completed: number; cta_clicked: number }
    >();
    for (const s of vSessions) {
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
    const perSource: SourceBreakdown[] = [...sourceMap.values()].map((r) => ({
      ...r,
      completion_rate: r.started ? r.completed / r.started : 0,
    }));

    let resultDistribution: ResultBucket[] = [];
    let topResult: TopResult | null = null;

    if (meta.hasResultScreen && meta.segmentationField) {
      const counts = new Map<string, number>();
      for (const sess of vSessions) {
        if (!sess.completed_at) continue;
        const sessResp = responsesBySession.get(sess.id) ?? [];
        for (const r of sessResp) {
          const ans = (r.answer ?? {}) as Record<string, unknown>;
          const v = ans[meta.segmentationField];
          if (v != null) {
            const key = Array.isArray(v) ? v.join(",") : String(v);
            counts.set(key, (counts.get(key) ?? 0) + 1);
            break;
          }
        }
      }
      resultDistribution = [...counts.entries()].map(([value, count]) => {
        const label = meta.segmentationOptions.get(value) ?? value;
        return {
          result_id: value,
          label,
          color_index: colorIndexFor(label),
          count,
        };
      });
      resultDistribution.sort((a, b) => b.count - a.count);
      if (resultDistribution[0]) {
        const r = resultDistribution[0];
        topResult = {
          label: r.label,
          color_index: r.color_index,
          count: r.count,
          pct: completed ? r.count / completed : 0,
        };
      }
    }

    return {
      variant_id: v.id,
      variant_name: meta.name,
      started,
      completed,
      cta_clicked: cta,
      completion_rate: started ? completed / started : 0,
      cta_rate: started ? cta / started : 0,
      cta_intent_rate: completed ? cta / completed : 0,
      has_result_screen: meta.hasResultScreen,
      screens: meta.screens,
      drop_off: dropOff,
      sparkline_30d: sparkline,
      per_source: perSource,
      result_distribution: resultDistribution,
      top_result: topResult,
    };
  });

  const totalSourceMap = new Map<
    string,
    { source: string; started: number; completed: number; cta_clicked: number }
  >();
  for (const s of sessions) {
    const key = s.source ?? "direct";
    const row = totalSourceMap.get(key) ?? {
      source: key,
      started: 0,
      completed: 0,
      cta_clicked: 0,
    };
    row.started += 1;
    if (s.completed_at) row.completed += 1;
    if (s.cta_clicked) row.cta_clicked += 1;
    totalSourceMap.set(key, row);
  }
  const perSourceTotal: SourceBreakdown[] = [...totalSourceMap.values()].map((r) => ({
    ...r,
    completion_rate: r.started ? r.completed / r.started : 0,
  }));

  const totals = {
    started: sessions.length,
    completed: sessions.filter((s) => s.completed_at).length,
    cta_clicked: sessions.filter((s) => s.cta_clicked).length,
  };

  const responseList: SessionAnalytics[] = sessions.map((sess) => {
    const meta = variantMeta.get(sess.variant_id);
    const sessResp = responsesBySession.get(sess.id) ?? [];
    const totalScreens = meta?.screens.length ?? 0;
    const lastReachedIdx = sessResp.length
      ? sessResp[sessResp.length - 1].screen_index
      : -1;
    const screensCompleted = sess.completed_at
      ? totalScreens
      : Math.max(0, lastReachedIdx + 1);

    let result: { label: string; color_index: number } | null = null;
    if (meta?.hasResultScreen && meta.segmentationField && sess.completed_at) {
      for (const r of sessResp) {
        const ans = (r.answer ?? {}) as Record<string, unknown>;
        const v = ans[meta.segmentationField];
        if (v != null) {
          const key = Array.isArray(v) ? v.join(",") : String(v);
          const label = meta.segmentationOptions.get(key) ?? key;
          result = { label, color_index: colorIndexFor(label) };
          break;
        }
      }
    }

    const answers = sessResp.map((r) => {
      const screen = meta?.screens.find((s) => s.screen_index === r.screen_index);
      const ans = (r.answer ?? {}) as Record<string, unknown>;
      const flat: { field: string; value: unknown; label?: string }[] = [];
      for (const [field, val] of Object.entries(ans)) {
        let label: string | undefined;
        if (meta?.segmentationField === field) {
          const key = Array.isArray(val) ? val.join(",") : String(val);
          label = meta.segmentationOptions.get(key);
        }
        flat.push({ field, value: val, label });
      }
      return {
        screen_id: r.screen_id,
        screen_index: r.screen_index,
        screen_label: screen?.label ?? r.screen_id,
        screen_kind: screen?.kind ?? "question",
        dwell_ms: r.dwell_ms,
        fields: flat,
      };
    });

    return {
      session_id: sess.id,
      started_at: sess.started_at,
      completed_at: sess.completed_at,
      abandoned_at: sess.abandoned_at,
      variant_id: sess.variant_id,
      variant_name: meta?.name ?? "—",
      source: sess.source ?? null,
      total_dwell_ms: sess.total_dwell_ms,
      cta_clicked: sess.cta_clicked,
      screens_completed: screensCompleted,
      total_screens: totalScreens,
      result,
      answers,
    };
  });

  const anyHasResultScreen = perVariant.some((v) => v.has_result_screen);

  return {
    kind: "ok",
    payload: {
      totals,
      per_variant: perVariant,
      per_source_total: perSourceTotal,
      responses: responseList,
      any_has_result_screen: anyHasResultScreen,
      spark_days: SPARK_DAYS,
    },
  };
}
