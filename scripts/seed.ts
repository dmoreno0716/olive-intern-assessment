/**
 * Smoke-test seed: creates one funnel and one variant using the example
 * "Slow Burn" spec from design/CATALOG.md, then prints the IDs.
 *
 * Run: pnpm seed
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { createClient } from "@supabase/supabase-js";

import { exampleQuizSpec } from "../lib/api/exampleSpec";
import { RoutingRulesSchema } from "../lib/api/routing";

loadEnvLocal();

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceRoleKey) {
  throw new Error(
    "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local",
  );
}

const supabase = createClient(url, serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

async function main() {
  const { data: funnel, error: funnelErr } = await supabase
    .from("funnels")
    .insert({
      title: "Slow Burn — protocol matcher",
      description:
        "Three-screen demo funnel seeded from CATALOG.md. Used to smoke-test the API surface before Round 4 wires up the LLM.",
    })
    .select("id, title, status")
    .single();
  if (funnelErr) throw funnelErr;

  const { data: variant, error: variantErr } = await supabase
    .from("variants")
    .insert({
      funnel_id: funnel.id,
      name: "A",
      spec: exampleQuizSpec,
      routing_rules: RoutingRulesSchema.parse({ is_default: true }),
    })
    .select("id, name")
    .single();
  if (variantErr) throw variantErr;

  console.log("✓ Seeded funnel + variant");
  console.log(`  funnel_id : ${funnel.id}`);
  console.log(`  variant_id: ${variant.id}`);
  console.log(`  open      : http://127.0.0.1:54323 (table: funnels)`);
}

main().catch((err) => {
  console.error("seed failed:", err);
  process.exit(1);
});

/**
 * Minimal .env.local loader. Avoids pulling in `dotenv` for a one-script
 * dependency. Parses KEY=VALUE lines, ignores comments and blanks.
 */
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
