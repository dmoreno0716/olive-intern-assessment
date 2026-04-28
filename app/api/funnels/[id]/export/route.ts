import { supabaseAdmin } from "@/lib/supabase/admin";
import { notFound, serverError } from "@/lib/api/json";

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
type ResponseRow = {
  session_id: string;
  screen_id: string;
  screen_index: number;
  answer: unknown;
  dwell_ms: number;
};
type VariantRow = { id: string; name: string };

/**
 * Wrap a CSV cell. RFC 4180-ish: quote when the value contains a comma,
 * a quote, a CR, or a newline — and double up any embedded quotes.
 */
function csvCell(v: unknown): string {
  if (v === null || v === undefined) return "";
  const s =
    typeof v === "string"
      ? v
      : typeof v === "object"
        ? JSON.stringify(v)
        : String(v);
  if (/[",\r\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id: funnelId } = await ctx.params;
  const supabase = supabaseAdmin();

  const { data: funnel, error: fErr } = await supabase
    .from("funnels")
    .select("id, title")
    .eq("id", funnelId)
    .maybeSingle();
  if (fErr) return serverError(fErr.message);
  if (!funnel) return notFound("Funnel not found");

  const [variantsRes, sessionsRes] = await Promise.all([
    supabase.from("variants").select("id, name").eq("funnel_id", funnelId),
    supabase
      .from("sessions")
      .select(
        "id, variant_id, source, started_at, completed_at, abandoned_at, cta_clicked, total_dwell_ms",
      )
      .eq("funnel_id", funnelId)
      .order("started_at", { ascending: false }),
  ]);
  if (variantsRes.error) return serverError(variantsRes.error.message);
  if (sessionsRes.error) return serverError(sessionsRes.error.message);

  const variants = (variantsRes.data ?? []) as VariantRow[];
  const sessions = (sessionsRes.data ?? []) as SessionRow[];
  const variantNameById = new Map(variants.map((v) => [v.id, v.name]));

  let responses: ResponseRow[] = [];
  if (sessions.length > 0) {
    const { data, error } = await supabase
      .from("responses")
      .select("session_id, screen_id, screen_index, answer, dwell_ms")
      .in(
        "session_id",
        sessions.map((s) => s.id),
      );
    if (error) return serverError(error.message);
    responses = (data ?? []) as ResponseRow[];
  }
  const respBySession = new Map<string, ResponseRow[]>();
  for (const r of responses) {
    const arr = respBySession.get(r.session_id) ?? [];
    arr.push(r);
    respBySession.set(r.session_id, arr);
  }

  const headers = [
    "session_id",
    "started_at",
    "completed_at",
    "abandoned_at",
    "variant_name",
    "source",
    "cta_clicked",
    "total_dwell_ms",
    "screen_index",
    "screen_id",
    "dwell_ms",
    "answer_json",
  ];
  const lines = [headers.join(",")];

  for (const s of sessions) {
    const sessResp = respBySession.get(s.id) ?? [];
    const baseCols = [
      s.id,
      s.started_at,
      s.completed_at ?? "",
      s.abandoned_at ?? "",
      variantNameById.get(s.variant_id) ?? "",
      s.source ?? "",
      s.cta_clicked ? "true" : "false",
      String(s.total_dwell_ms),
    ];
    if (sessResp.length === 0) {
      lines.push([...baseCols, "", "", "", ""].map(csvCell).join(","));
      continue;
    }
    for (const r of sessResp) {
      lines.push(
        [
          ...baseCols,
          String(r.screen_index),
          r.screen_id,
          String(r.dwell_ms),
          r.answer,
        ]
          .map(csvCell)
          .join(","),
      );
    }
  }

  const slug = funnel.title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60) || "funnel";
  const today = new Date().toISOString().slice(0, 10);
  const filename = `${slug}-${today}.csv`;

  return new Response(lines.join("\n"), {
    status: 200,
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="${filename}"`,
      "cache-control": "no-store",
    },
  });
}
