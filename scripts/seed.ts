/**
 * Smoke-test seed: creates one funnel + one variant from the example
 * "Slow Burn" spec, marks the funnel as published, and prints the public
 * URL so you can paste it into the browser or the webview harness.
 *
 * Stable ID: re-running upserts the same row instead of creating a new
 * funnel each time, so localhost:3000/f/<seed-id> keeps working across
 * reseeds.
 *
 * Run: pnpm seed
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { createClient } from "@supabase/supabase-js";

import { exampleQuizSpec } from "../lib/api/exampleSpec";
import { RoutingRulesSchema } from "../lib/api/routing";
import { resolveSupabaseEnv } from "./_seed-env";

loadEnvLocal();

const { url, serviceRoleKey, target } = resolveSupabaseEnv();
console.log(`→ Supabase target: ${target} (${url})`);

const supabase = createClient(url, serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

// Stable demo IDs so the public URL doesn't change on reseed.
const SEED_FUNNEL_ID = "00000000-0000-4000-8000-00000000f001";
const SEED_VARIANT_A_ID = "00000000-0000-4000-8000-00000000a001";

async function main() {
  const { data: funnel, error: funnelErr } = await supabase
    .from("funnels")
    .upsert(
      {
        id: SEED_FUNNEL_ID,
        title: "Slow Burn — protocol matcher",
        description:
          "Three-screen demo funnel seeded from CATALOG.md. Used to smoke-test the public funnel URL and webview harness.",
        status: "published",
      },
      { onConflict: "id" },
    )
    .select("id, title, status")
    .single();
  if (funnelErr) throw funnelErr;

  const { data: variant, error: variantErr } = await supabase
    .from("variants")
    .upsert(
      {
        id: SEED_VARIANT_A_ID,
        funnel_id: funnel.id,
        name: "A",
        spec: exampleQuizSpec,
        routing_rules: RoutingRulesSchema.parse({ is_default: true }),
      },
      { onConflict: "id" },
    )
    .select("id, name")
    .single();
  if (variantErr) throw variantErr;

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  console.log("✓ Seeded funnel + variant (published)");
  console.log(`  funnel_id : ${funnel.id}`);
  console.log(`  variant_id: ${variant.id}`);
  console.log(`  public URL: ${baseUrl}/f/${funnel.id}`);
  console.log(`  with utm  : ${baseUrl}/f/${funnel.id}?utm_source=tiktok`);
  console.log(`  harness   : ${baseUrl}/webview-test`);
}

main().catch((err) => {
  console.error("seed failed:", err);
  process.exit(1);
});

function loadEnvLocal() {
  const path = resolve(process.cwd(), ".env.local");
  let raw: string;
  try {
    raw = readFileSync(path, "utf8");
  } catch {
    return;
  }
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!(key in process.env)) process.env[key] = value;
  }
}
