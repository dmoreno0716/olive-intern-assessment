/**
 * Seeds the 3 example funnels documented under `examples/` so that
 * dashboard screenshots, the README's "tour the live app" links, and
 * the screen-recording demo all line up against stable IDs.
 *
 * For each example: upserts the funnel + a single variant from
 * `examples/<dir>/spec.json`, marks it published, then calls
 * `seedFakeResponses` to generate ~10 sessions with varied sources,
 * answers, dwell, and CTA outcomes so the dashboard has data to show.
 *
 * Re-runs are safe — funnel and variant IDs are stable, sessions are
 * deleted before reseeding so the row count stays near 10.
 *
 * Run: pnpm seed:examples
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import type { CatalogNode } from "../lib/catalog/types";
import { RoutingRulesSchema } from "../lib/api/routing";
import { seedFakeResponses } from "./seed-example-responses";

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

type Example = {
  dir: string;
  funnelId: string;
  variantId: string;
  title: string;
  description: string;
};

// Stable IDs so the live URL never moves across reseeds.
const EXAMPLES: Example[] = [
  {
    dir: "01-eater-quiz",
    funnelId: "00000000-0000-4000-8000-0000000e1001",
    variantId: "00000000-0000-4000-8000-0000000e1a01",
    title: "What kind of eater are you?",
    description:
      "5-question segmentation quiz that maps eating style to an archetype. Demonstrates a pure quiz with no paywall and no email gate (per design/DECISIONS.md #2 — nothing auto-injected).",
  },
  {
    dir: "02-lead-gen",
    funnelId: "00000000-0000-4000-8000-0000000e2001",
    variantId: "00000000-0000-4000-8000-0000000e2a01",
    title: "Olive plan finder",
    description:
      "Lead-gen quiz that captures email and recommends an Olive plan. Demonstrates the full quiz + email gate + result screen pattern.",
  },
  {
    dir: "03-paywall-only",
    funnelId: "00000000-0000-4000-8000-0000000e3001",
    variantId: "00000000-0000-4000-8000-0000000e3a01",
    title: "Olive Pro upsell",
    description:
      "Standalone paywall — no quiz at all. Proves the same renderer can mount non-quiz funnels (the Superwall-replacement story from design/DECISIONS.md #1).",
  },
];

async function loadSpec(dir: string): Promise<CatalogNode[]> {
  const path = resolve(process.cwd(), "examples", dir, "spec.json");
  const raw = readFileSync(path, "utf8");
  return JSON.parse(raw) as CatalogNode[];
}

async function upsertFunnel(supa: SupabaseClient, ex: Example): Promise<void> {
  const spec = await loadSpec(ex.dir);

  const { error: fErr } = await supa.from("funnels").upsert(
    {
      id: ex.funnelId,
      title: ex.title,
      description: ex.description,
      status: "published",
    },
    { onConflict: "id" },
  );
  if (fErr) throw fErr;

  const { error: vErr } = await supa.from("variants").upsert(
    {
      id: ex.variantId,
      funnel_id: ex.funnelId,
      name: "A",
      spec,
      routing_rules: RoutingRulesSchema.parse({ is_default: true }),
    },
    { onConflict: "id" },
  );
  if (vErr) throw vErr;

  // Wipe prior fake sessions for this funnel so the count stays bounded
  // across reseeds (cascade-delete handles responses).
  const { error: dErr } = await supa
    .from("sessions")
    .delete()
    .eq("funnel_id", ex.funnelId);
  if (dErr) throw dErr;
}

async function main() {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  for (const ex of EXAMPLES) {
    console.log(`▶ ${ex.dir}`);
    await upsertFunnel(supabase, ex);
    const spec = await loadSpec(ex.dir);
    const seeded = await seedFakeResponses(supabase, {
      funnelId: ex.funnelId,
      variantId: ex.variantId,
      spec,
      count: 10,
    });
    console.log(
      `  ✓ funnel + variant + ${seeded.sessions} sessions ` +
        `(${seeded.completed} completed, ${seeded.cta} CTA, ${seeded.abandoned} abandoned)`,
    );
    console.log(`  public  : ${baseUrl}/f/${ex.funnelId}`);
    console.log(`  studio  : ${baseUrl}/studio/${ex.funnelId}`);
    console.log(`  dash    : ${baseUrl}/dashboard/${ex.funnelId}`);
    console.log("");
  }
  console.log("✓ All 3 example funnels seeded.");
}

main().catch((err) => {
  console.error("seed-examples failed:", err);
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
