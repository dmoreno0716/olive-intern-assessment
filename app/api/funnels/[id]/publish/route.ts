import { supabaseAdmin } from "@/lib/supabase/admin";
import { badRequest, notFound, ok, serverError } from "@/lib/api/json";

const SOURCES = ["tiktok", "instagram", "facebook", "direct"] as const;

export async function POST(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;
  const supabase = supabaseAdmin();

  const { count, error: countErr } = await supabase
    .from("variants")
    .select("id", { count: "exact", head: true })
    .eq("funnel_id", id);
  if (countErr) return serverError(countErr.message);
  if (!count || count === 0) {
    return badRequest("Funnel must have at least one variant before publishing");
  }

  const { data, error } = await supabase
    .from("funnels")
    .update({ status: "published" })
    .eq("id", id)
    .select("id, title, status, updated_at")
    .maybeSingle();
  if (error) return serverError(error.message);
  if (!data) return notFound("Funnel not found");

  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const funnelUrl = `${baseUrl}/f/${id}`;
  const sourceUrls = SOURCES.map((s) => ({
    source: s,
    url: `${funnelUrl}?utm_source=${s}`,
  }));

  return ok({ funnel: data, url: funnelUrl, source_urls: sourceUrls });
}
