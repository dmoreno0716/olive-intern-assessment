/**
 * Resolves which Supabase project the seed scripts should target.
 *
 * Default (no env var) → local Supabase. Reads NEXT_PUBLIC_SUPABASE_URL
 *   + SUPABASE_SERVICE_ROLE_KEY from .env.local — same vars `pnpm dev`
 *   uses, so `pnpm seed` keeps working unchanged.
 *
 * `SEED_TARGET=hosted` → hosted Supabase. Reads SUPABASE_HOSTED_URL +
 *   SUPABASE_HOSTED_SERVICE_ROLE_KEY instead. Used during one-time
 *   hosted-database seeding (Round 8) without disturbing the local-dev
 *   variables in .env.local. The hosted vars are temporary; remove them
 *   from .env.local after seeding.
 *
 * Exported alongside the URL+key so callers can log which project they
 * just touched (we want `pnpm seed:examples` to print "→ hosted" so a
 * stale env doesn't silently target the wrong DB).
 */
export function resolveSupabaseEnv(): {
  url: string;
  serviceRoleKey: string;
  target: "local" | "hosted";
} {
  const target = process.env.SEED_TARGET === "hosted" ? "hosted" : "local";
  const url =
    target === "hosted"
      ? process.env.SUPABASE_HOSTED_URL
      : process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey =
    target === "hosted"
      ? process.env.SUPABASE_HOSTED_SERVICE_ROLE_KEY
      : process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    const required =
      target === "hosted"
        ? "SUPABASE_HOSTED_URL + SUPABASE_HOSTED_SERVICE_ROLE_KEY"
        : "NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY";
    throw new Error(
      `Missing ${required} in environment (target=${target}). Check .env.local.`,
    );
  }
  return { url, serviceRoleKey, target };
}
