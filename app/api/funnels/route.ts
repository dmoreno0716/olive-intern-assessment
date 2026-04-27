import { z } from "zod";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { created, ok, readJson, serverError } from "@/lib/api/json";

const CreateFunnelSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(2000).default(""),
});

export async function POST(req: Request) {
  const parsed = await readJson(req, CreateFunnelSchema);
  if (parsed.error) return parsed.error;

  const supabase = supabaseAdmin();
  const { data, error } = await supabase
    .from("funnels")
    .insert({
      title: parsed.data.title,
      description: parsed.data.description,
    })
    .select("id, title, description, status, created_at, updated_at")
    .single();

  if (error) return serverError(error.message);
  return created(data);
}

export async function GET() {
  const supabase = supabaseAdmin();
  const { data, error } = await supabase
    .from("funnels")
    .select("id, title, description, status, created_at, updated_at")
    .order("updated_at", { ascending: false });

  if (error) return serverError(error.message);
  return ok({ funnels: data ?? [] });
}
