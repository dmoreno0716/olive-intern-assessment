import { z } from "zod";
import { supabaseAdmin } from "@/lib/supabase/admin";
import {
  badRequest,
  created,
  readJson,
  serverError,
} from "@/lib/api/json";

const StartSessionBody = z.object({
  funnel_id: z.string().uuid(),
  variant_id: z.string().uuid(),
  source: z.string().max(80).nullable().optional(),
});

export async function POST(req: Request) {
  const parsed = await readJson(req, StartSessionBody);
  if (parsed.error) return parsed.error;

  const supabase = supabaseAdmin();

  const { data: variant, error: vErr } = await supabase
    .from("variants")
    .select("id, funnel_id")
    .eq("id", parsed.data.variant_id)
    .maybeSingle();
  if (vErr) return serverError(vErr.message);
  if (!variant || variant.funnel_id !== parsed.data.funnel_id) {
    return badRequest("variant_id does not belong to funnel_id");
  }

  const { data, error } = await supabase
    .from("sessions")
    .insert({
      funnel_id: parsed.data.funnel_id,
      variant_id: parsed.data.variant_id,
      source: parsed.data.source ?? null,
    })
    .select(
      "id, funnel_id, variant_id, source, started_at, total_dwell_ms, cta_clicked",
    )
    .single();

  if (error) return serverError(error.message);
  return created(data);
}
