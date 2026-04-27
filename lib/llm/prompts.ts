import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { buildCatalogSection } from "./catalog-prompt";

/**
 * Reads a prompt file from the repo's prompts/ directory.
 *
 * The system + refine prompts are templates: any `{{CATALOG}}` marker is
 * replaced with the live catalog reference generated from the registered
 * Zod schemas in lib/catalog/index.ts (see buildCatalogSection). This
 * keeps the prompt in lock-step with the actual schema — adding or
 * changing a primitive updates the prompt on the next call without an
 * editorial step.
 *
 * Cached after first interpolation.
 */
const cache = new Map<string, string>();

type PromptName = "system.md" | "user-template.md" | "refine-system.md";

export function loadPrompt(name: PromptName): string {
  const cached = cache.get(name);
  if (cached) return cached;
  const path = resolve(process.cwd(), "prompts", name);
  const raw = readFileSync(path, "utf8");
  const rendered = raw.replace("{{CATALOG}}", () => buildCatalogSection());
  cache.set(name, rendered);
  return rendered;
}

export function fillUserTemplate(prompt: string): string {
  return loadPrompt("user-template.md").replace("{{prompt}}", prompt);
}
