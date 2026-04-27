import { z } from "zod";
import { supabaseAdmin } from "@/lib/supabase/admin";
import {
  badRequest,
  created,
  notFound,
  ok,
  readJson,
  serverError,
} from "@/lib/api/json";

const AnswerEvent = z.object({
  type: z.literal("answer"),
  screen_id: z.string().min(1),
  screen_index: z.number().int().nonnegative(),
  answer: z.unknown(),
  dwell_ms: z.number().int().nonnegative().default(0),
});

const ScreenCompletedEvent = z.object({
  type: z.literal("screen_completed"),
  screen_id: z.string().min(1),
  screen_index: z.number().int().nonnegative(),
  dwell_ms: z.number().int().nonnegative().default(0),
});

const CompletedEvent = z.object({
  type: z.literal("completed"),
});

const AbandonedEvent = z.object({
  type: z.literal("abandoned"),
  last_screen_id: z.string().min(1).optional(),
});

const CtaClickedEvent = z.object({
  type: z.literal("cta_clicked"),
  screen_id: z.string().min(1).optional(),
});

const EventBody = z.discriminatedUnion("type", [
  AnswerEvent,
  ScreenCompletedEvent,
  CompletedEvent,
  AbandonedEvent,
  CtaClickedEvent,
]);

export async function POST(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id: sessionId } = await ctx.params;
  const parsed = await readJson(req, EventBody);
  if (parsed.error) return parsed.error;

  const supabase = supabaseAdmin();

  const { data: session, error: sErr } = await supabase
    .from("sessions")
    .select("id, total_dwell_ms, completed_at, abandoned_at, cta_clicked")
    .eq("id", sessionId)
    .maybeSingle();
  if (sErr) return serverError(sErr.message);
  if (!session) return notFound("Session not found");

  const event = parsed.data;

  if (event.type === "answer") {
    const { data, error } = await supabase
      .from("responses")
      .insert({
        session_id: sessionId,
        screen_id: event.screen_id,
        screen_index: event.screen_index,
        answer: event.answer ?? null,
        dwell_ms: event.dwell_ms,
      })
      .select("id, session_id, screen_id, screen_index, dwell_ms, submitted_at")
      .single();
    if (error) return serverError(error.message);

    const { error: updErr } = await supabase
      .from("sessions")
      .update({ total_dwell_ms: session.total_dwell_ms + event.dwell_ms })
      .eq("id", sessionId);
    if (updErr) return serverError(updErr.message);

    return created(data);
  }

  if (event.type === "screen_completed") {
    const { error } = await supabase
      .from("sessions")
      .update({ total_dwell_ms: session.total_dwell_ms + event.dwell_ms })
      .eq("id", sessionId);
    if (error) return serverError(error.message);
    return ok({ recorded: "screen_completed" });
  }

  if (event.type === "completed") {
    if (session.completed_at) return badRequest("Session already completed");
    const { error } = await supabase
      .from("sessions")
      .update({ completed_at: new Date().toISOString() })
      .eq("id", sessionId);
    if (error) return serverError(error.message);
    return ok({ recorded: "completed" });
  }

  if (event.type === "abandoned") {
    if (session.completed_at) return badRequest("Session already completed");
    const { error } = await supabase
      .from("sessions")
      .update({ abandoned_at: new Date().toISOString() })
      .eq("id", sessionId);
    if (error) return serverError(error.message);
    return ok({ recorded: "abandoned" });
  }

  // cta_clicked
  const { error } = await supabase
    .from("sessions")
    .update({ cta_clicked: true })
    .eq("id", sessionId);
  if (error) return serverError(error.message);
  return ok({ recorded: "cta_clicked" });
}
