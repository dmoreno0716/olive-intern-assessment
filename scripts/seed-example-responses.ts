/**
 * Generates ~10 realistic fake sessions + per-screen response rows for a
 * given funnel so the dashboard has data to render in screenshots and
 * the recording demo. Standalone helper — used by `seed-examples.ts`,
 * but can also be invoked directly with `pnpm tsx
 * scripts/seed-example-responses.ts <funnel_id>` for any pre-existing
 * funnel.
 *
 * Heuristics intentionally produce a varied dashboard:
 *   - Source mix: tiktok (40%) / instagram (25%) / facebook (15%) /
 *     direct (20%).
 *   - ~70% of starts complete the funnel; the rest abandon at a random
 *     middle screen so the drop-off chart shows non-trivial steps.
 *   - ~80% of completers click the final CTA (Intent rate ~80%).
 *   - Answers to ChoiceList/MultiChoice questions are sampled from the
 *     spec's actual `options[]`, so the responses table renders human
 *     labels and the result donut groups by real values.
 *   - Started_at is jittered across the last 14 days so the sparkline
 *     is non-flat.
 *
 * Run directly: pnpm tsx scripts/seed-example-responses.ts <funnel_id> [count]
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import {
  createClient,
  type SupabaseClient,
} from "@supabase/supabase-js";

import type { CatalogNode } from "../lib/catalog/types";
import { resolveSupabaseEnv } from "./_seed-env";

type ScreenInfo = {
  screen_id: string;
  screen_index: number;
  kind: string;
  fields: { field: string; sample: () => unknown; isSegmentation: boolean }[];
};

type SeedSummary = {
  sessions: number;
  completed: number;
  cta: number;
  abandoned: number;
};

const SOURCES: { source: string | null; weight: number }[] = [
  { source: "tiktok", weight: 40 },
  { source: "instagram", weight: 25 },
  { source: "facebook", weight: 15 },
  { source: null, weight: 20 }, // direct
];

function pickWeighted<T>(items: { source: T; weight: number }[]): T {
  const total = items.reduce((s, i) => s + i.weight, 0);
  const r = Math.random() * total;
  let acc = 0;
  for (const i of items) {
    acc += i.weight;
    if (r <= acc) return i.source;
  }
  return items[items.length - 1].source;
}

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Walk a Screen node and return one sampler per answer-bearing primitive
 * inside it. The first ChoiceList/MultiChoice/ImageChoiceGrid found in
 * the spec is flagged as the segmentation field — the dashboard groups
 * the result donut by it, so a deterministic sampler there gives us a
 * clean distribution across slices.
 */
function deriveScreens(spec: CatalogNode[]): ScreenInfo[] {
  let segmentationFieldFound: string | null = null;

  const screens: ScreenInfo[] = [];
  spec.forEach((node, i) => {
    const props = (node.props ?? {}) as { id?: string; kind?: string };
    const screen: ScreenInfo = {
      screen_id: props.id ?? `screen-${i}`,
      screen_index: i,
      kind: props.kind ?? "question",
      fields: [],
    };
    const visit = (n: CatalogNode) => {
      const p = (n.props ?? {}) as Record<string, unknown>;
      if (typeof p.field === "string") {
        if (n.kind === "ChoiceList" || n.kind === "ImageChoiceGrid") {
          const opts = (p.options ?? []) as { value?: string }[];
          const values = opts.map((o) => o.value).filter(Boolean) as string[];
          const isSeg =
            !segmentationFieldFound &&
            (n.kind === "ChoiceList" || n.kind === "ImageChoiceGrid");
          if (isSeg) segmentationFieldFound = p.field as string;
          screen.fields.push({
            field: p.field as string,
            sample: () =>
              values[randInt(0, values.length - 1)] ?? "unknown",
            isSegmentation: isSeg,
          });
        } else if (n.kind === "MultiChoice") {
          const opts = (p.options ?? []) as { value?: string }[];
          const values = opts.map((o) => o.value).filter(Boolean) as string[];
          screen.fields.push({
            field: p.field as string,
            sample: () => {
              const k = randInt(1, Math.max(1, Math.min(3, values.length)));
              return values
                .slice()
                .sort(() => Math.random() - 0.5)
                .slice(0, k);
            },
            isSegmentation: false,
          });
        } else if (n.kind === "ScalePicker") {
          const min = typeof p.min === "number" ? p.min : 1;
          const max = typeof p.max === "number" ? p.max : 5;
          screen.fields.push({
            field: p.field as string,
            sample: () => randInt(min, max),
            isSegmentation: false,
          });
        } else if (n.kind === "EmailInput" || n.kind === "EmailGate") {
          screen.fields.push({
            field: p.field as string,
            sample: () =>
              `demo+${Math.random().toString(36).slice(2, 8)}@olive.app`,
            isSegmentation: false,
          });
        } else if (
          n.kind === "ShortText" ||
          n.kind === "LongText" ||
          n.kind === "NumberInput" ||
          n.kind === "ToggleRow"
        ) {
          screen.fields.push({
            field: p.field as string,
            sample: () => {
              if (n.kind === "NumberInput") return randInt(1, 50);
              if (n.kind === "ToggleRow") return Math.random() > 0.5;
              const samples = [
                "Quick weeknight meals",
                "Cooking for a family of four",
                "Trying to eat more vegetables",
                "Want to try new cuisines",
                "Reduce grocery waste",
              ];
              return samples[randInt(0, samples.length - 1)];
            },
            isSegmentation: false,
          });
        }
      }
      for (const k of ["body", "footer", "children"]) {
        const arr = p[k];
        if (Array.isArray(arr)) {
          for (const c of arr) {
            if (c && typeof c === "object") visit(c as CatalogNode);
          }
        }
      }
    };
    visit(node);
    screens.push(screen);
  });
  return screens;
}

export async function seedFakeResponses(
  supabase: SupabaseClient,
  args: {
    funnelId: string;
    variantId: string;
    spec: CatalogNode[];
    count?: number;
  },
): Promise<SeedSummary> {
  const count = args.count ?? 10;
  const screens = deriveScreens(args.spec);
  const totalScreens = screens.length;

  const summary: SeedSummary = {
    sessions: 0,
    completed: 0,
    cta: 0,
    abandoned: 0,
  };

  // Cluster the started_at timestamps across the last 14 days so the
  // sparkline shows real variation. ~30% of sessions land "today",
  // ~50% in the last 3 days, the rest spread over 14.
  const now = Date.now();
  function startedAtFor(idx: number): Date {
    const r = Math.random();
    let dayDelta: number;
    if (r < 0.3) dayDelta = 0;
    else if (r < 0.5) dayDelta = randInt(0, 1);
    else if (r < 0.85) dayDelta = randInt(1, 3);
    else dayDelta = randInt(3, 14);
    const ms =
      now - dayDelta * 86_400_000 - randInt(0, 86_400_000) - idx * 1000;
    return new Date(ms);
  }

  for (let i = 0; i < count; i++) {
    const startedAt = startedAtFor(i);
    const source = pickWeighted(SOURCES);

    // 70% of sessions complete; abandoners drop at a random middle index.
    const willComplete = Math.random() < 0.7;
    const dropIndex = willComplete
      ? totalScreens
      : randInt(1, Math.max(1, totalScreens - 1));

    // Build per-screen response rows up to dropIndex.
    const screenDwells: number[] = [];
    const responseRows: {
      screen_id: string;
      screen_index: number;
      answer: Record<string, unknown>;
      dwell_ms: number;
      submitted_at: string;
    }[] = [];

    let cursor = startedAt.getTime();
    for (let s = 0; s < dropIndex; s++) {
      const screen = screens[s];
      // Realistic dwell: question screens linger longer than intros.
      const dwellMs =
        screen.kind === "intro"
          ? randInt(1200, 4500)
          : screen.kind === "result"
            ? randInt(2000, 7000)
            : screen.kind === "gate"
              ? randInt(3000, 9000)
              : randInt(2500, 12000);
      screenDwells.push(dwellMs);
      const answer: Record<string, unknown> = {};
      for (const f of screen.fields) {
        answer[f.field] = f.sample();
      }
      cursor += dwellMs;
      responseRows.push({
        screen_id: screen.screen_id,
        screen_index: screen.screen_index,
        answer,
        dwell_ms: dwellMs,
        submitted_at: new Date(cursor).toISOString(),
      });
    }

    const totalDwell = screenDwells.reduce((s, x) => s + x, 0);
    const completedAt = willComplete ? new Date(cursor).toISOString() : null;
    const abandonedAt = willComplete ? null : new Date(cursor).toISOString();
    const ctaClicked = willComplete && Math.random() < 0.8;

    const { data: sessRow, error: sErr } = await supabase
      .from("sessions")
      .insert({
        funnel_id: args.funnelId,
        variant_id: args.variantId,
        source,
        started_at: startedAt.toISOString(),
        completed_at: completedAt,
        abandoned_at: abandonedAt,
        cta_clicked: ctaClicked,
        total_dwell_ms: totalDwell,
      })
      .select("id")
      .single();
    if (sErr) throw sErr;

    if (responseRows.length > 0) {
      const { error: rErr } = await supabase.from("responses").insert(
        responseRows.map((r) => ({
          session_id: sessRow.id,
          screen_id: r.screen_id,
          screen_index: r.screen_index,
          answer: r.answer,
          dwell_ms: r.dwell_ms,
          submitted_at: r.submitted_at,
        })),
      );
      if (rErr) throw rErr;
    }

    summary.sessions += 1;
    if (willComplete) summary.completed += 1;
    if (!willComplete) summary.abandoned += 1;
    if (ctaClicked) summary.cta += 1;
  }

  return summary;
}

// ─── direct CLI invocation: pnpm tsx scripts/seed-example-responses.ts <id> [n]
if (
  typeof process !== "undefined" &&
  process.argv[1] &&
  process.argv[1].endsWith("seed-example-responses.ts")
) {
  loadEnvLocal();
  const funnelId = process.argv[2];
  const count = process.argv[3] ? parseInt(process.argv[3], 10) : 10;
  if (!funnelId) {
    console.error("Usage: pnpm tsx scripts/seed-example-responses.ts <funnel_id> [count]");
    process.exit(1);
  }
  const { url, serviceRoleKey, target } = resolveSupabaseEnv();
  console.log(`→ Supabase target: ${target} (${url})`);
  const supa = createClient(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  (async () => {
    const { data: variants, error } = await supa
      .from("variants")
      .select("id, spec")
      .eq("funnel_id", funnelId)
      .order("created_at", { ascending: true });
    if (error || !variants || variants.length === 0) {
      console.error("Funnel not found or has no variants:", funnelId);
      process.exit(1);
    }
    const variant = variants[0];
    const result = await seedFakeResponses(supa, {
      funnelId,
      variantId: variant.id,
      spec: variant.spec as CatalogNode[],
      count,
    });
    console.log(`✓ ${result.sessions} sessions seeded for ${funnelId}`);
    console.log(`  ${result.completed} completed · ${result.cta} CTA clicks · ${result.abandoned} abandoned`);
  })().catch((err) => {
    console.error("seed-example-responses failed:", err);
    process.exit(1);
  });
}

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
