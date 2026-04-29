import { z } from "zod";
import { badRequest, readJson } from "@/lib/api/json";
import { RoutingRulesSchema } from "@/lib/api/routing";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { generateFunnelSpec } from "@/lib/llm/generate";
import type { StreamEvent } from "@/lib/llm/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
// LLM streaming generation can take 20–35s on Opus for the long-form
// prompt. Vercel Hobby default is 10s, which would truncate every Opus
// request mid-stream — bump to the 60s ceiling.
export const maxDuration = 60;

const GenerateBody = z.object({
  prompt: z.string().min(1).max(4000),
  title: z.string().min(1).max(200).optional(),
});

/**
 * POST /api/generate — streams the LLM generation as Server-Sent Events,
 * then persists the validated spec as Variant A of a new funnel.
 *
 * Wire format: each line is `data: <json>\n\n`. The JSON payload follows
 * the StreamEvent union from lib/llm/types, plus a final `persisted`
 * event carrying { funnel_id, variant_id }.
 */
export async function POST(req: Request) {
  const parsed = await readJson(req, GenerateBody);
  if (parsed.error) return parsed.error;

  const { prompt, title } = parsed.data;
  const funnelTitle = title ?? deriveTitle(prompt);

  const encoder = new TextEncoder();

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (event: StreamEvent | PersistEvent | DoneEvent) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
      };

      try {
        const result = await generateFunnelSpec(prompt, {
          onEvent: (event) => send(event),
          abortSignal: req.signal,
        });

        if (!result.ok) {
          // generateFunnelSpec already emitted an `error` event before
          // returning. Close the stream — the failure is already on the wire.
          send({ type: "done", ok: false });
          controller.close();
          return;
        }

        const supabase = supabaseAdmin();
        const { data: funnel, error: funnelErr } = await supabase
          .from("funnels")
          .insert({
            title: funnelTitle,
            description: prompt.slice(0, 2000),
          })
          .select("id")
          .single();
        if (funnelErr) throw new Error(`Funnel insert failed: ${funnelErr.message}`);

        const { data: variant, error: variantErr } = await supabase
          .from("variants")
          .insert({
            funnel_id: funnel.id,
            name: "A",
            spec: result.spec,
            routing_rules: RoutingRulesSchema.parse({ is_default: true }),
          })
          .select("id")
          .single();
        if (variantErr) throw new Error(`Variant insert failed: ${variantErr.message}`);

        send({
          type: "persisted",
          funnel_id: funnel.id,
          variant_id: variant.id,
          model: result.model,
          attempts: result.attempts,
          usage: result.usage,
          cost: result.cost,
        });
        send({ type: "done", ok: true });
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        send({ type: "error", message });
        send({ type: "done", ok: false });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}

type PersistEvent = {
  type: "persisted";
  funnel_id: string;
  variant_id: string;
  model: string;
  attempts: number;
  usage: { input_tokens: number; output_tokens: number };
  cost: { input_usd: number; output_usd: number; total_usd: number };
};

type DoneEvent = { type: "done"; ok: boolean };

function deriveTitle(prompt: string): string {
  const single = prompt.replace(/\s+/g, " ").trim();
  if (single.length <= 80) return single;
  return single.slice(0, 77) + "…";
}

// Surface a JSON error for non-streaming clients hitting GET / wrong methods.
export function GET() {
  return badRequest("POST a JSON body { prompt: string, title?: string } to this endpoint.");
}
