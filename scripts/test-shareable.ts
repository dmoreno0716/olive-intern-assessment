/**
 * One-off probe for the shareable-result prompt. Runs the generator once
 * with a single prompt, walks the resulting spec for SecondaryCTA nodes
 * with `action: "share"` (the share affordance), and prints both the
 * full spec and a focused summary.
 *
 * Run: pnpm tsx scripts/test-shareable.ts
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { generateFunnelSpec } from "../lib/llm/generate";
import type { CatalogNode } from "../lib/catalog/types";

loadEnvLocal();

const PROMPT =
  "5-question personality quiz: what kind of eater are you? Include a shareable result card so people can post their type to social media.";

async function main() {
  console.log("=".repeat(72));
  console.log("Shareable-result probe");
  console.log("=".repeat(72));
  console.log(`prompt: ${PROMPT}`);
  console.log("");

  const start = Date.now();
  const result = await generateFunnelSpec(PROMPT, {
    onEvent: (event) => {
      if (event.type === "start") console.log(`model: ${event.model}`);
      if (event.type === "validation_error") {
        console.log(`⚠ attempt ${event.attempt} failed validation:`);
        for (const issue of event.issues.slice(0, 5)) {
          console.log(`   - ${issue.path}: ${issue.message}`);
        }
      }
      if (event.type === "retry") console.log(`↻ retry attempt ${event.attempt}`);
    },
  });
  const durationMs = Date.now() - start;

  if (!result.ok) {
    console.log(`✗ failed after ${result.attempts} attempts: ${result.error}`);
    process.exitCode = 1;
    return;
  }

  console.log(
    `✓ valid spec — ${result.spec.length} screens, ${result.attempts} attempt(s), ${durationMs}ms`,
  );
  console.log(
    `  usage: ${result.usage.input_tokens} in / ${result.usage.output_tokens} out · cost $${result.cost.total_usd.toFixed(4)}`,
  );

  const shareNodes = collectShareNodes(result.spec);
  console.log("");
  console.log("─".repeat(72));
  console.log(`SHARE-AFFORDANCE CHECK`);
  console.log("─".repeat(72));
  if (shareNodes.length === 0) {
    console.log(
      "✗ no SecondaryCTA with action=\"share\" found in the spec. The LLM didn't produce a share affordance — prompts/system.md likely needs the share-pattern guidance.",
    );
    process.exitCode = 2;
  } else {
    console.log(`✓ found ${shareNodes.length} share affordance(s):`);
    for (const node of shareNodes) {
      console.log(`  - label: ${JSON.stringify(node.label)}`);
      if (node.shareTitle) console.log(`    shareTitle: ${JSON.stringify(node.shareTitle)}`);
      if (node.shareText) console.log(`    shareText:  ${JSON.stringify(node.shareText)}`);
      if (node.shareUrl) console.log(`    shareUrl:   ${JSON.stringify(node.shareUrl)}`);
    }
  }

  console.log("");
  console.log("─".repeat(72));
  console.log("FULL SPEC");
  console.log("─".repeat(72));
  console.log(JSON.stringify(result.spec, null, 2));
}

type ShareCTAProps = {
  label: string;
  action: string;
  shareTitle?: string;
  shareText?: string;
  shareUrl?: string;
};

function collectShareNodes(spec: CatalogNode[]): ShareCTAProps[] {
  const out: ShareCTAProps[] = [];
  const walk = (node: unknown) => {
    if (!node || typeof node !== "object") return;
    const n = node as { kind?: string; props?: Record<string, unknown> };
    const props = n.props ?? {};
    if (n.kind === "SecondaryCTA" && props.action === "share") {
      out.push({
        label: String(props.label ?? ""),
        action: String(props.action),
        shareTitle: props.shareTitle as string | undefined,
        shareText: props.shareText as string | undefined,
        shareUrl: props.shareUrl as string | undefined,
      });
    }
    for (const key of ["body", "footer", "children"] as const) {
      const v = props[key];
      if (Array.isArray(v)) v.forEach(walk);
    }
  };
  spec.forEach(walk);
  return out;
}

main().catch((err) => {
  console.error("test-shareable failed:", err);
  process.exitCode = 1;
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
