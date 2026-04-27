import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceRoleKey) {
  throw new Error(
    "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in environment.",
  );
}

let cached: SupabaseClient | undefined;

/**
 * Service-role client. Use ONLY from server-side code (Route Handlers,
 * scripts). Bypasses RLS — never import from a client component.
 */
export function supabaseAdmin(): SupabaseClient {
  if (!cached) {
    cached = createClient(url!, serviceRoleKey!, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return cached;
}
