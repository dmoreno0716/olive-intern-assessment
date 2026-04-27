/**
 * Renders the system prompt with the live catalog block substituted in
 * and prints it to stdout. Useful for debugging — see the exact text
 * Claude receives.
 *
 * Run: pnpm tsx scripts/dump-prompt.ts            # system prompt
 *      pnpm tsx scripts/dump-prompt.ts refine     # refine prompt
 *      pnpm tsx scripts/dump-prompt.ts catalog    # just the generated catalog block
 */
import { buildCatalogSection } from "../lib/llm/catalog-prompt";
import { loadPrompt } from "../lib/llm/prompts";

const which = process.argv[2] ?? "system";

if (which === "catalog") {
  process.stdout.write(buildCatalogSection() + "\n");
} else if (which === "refine") {
  process.stdout.write(loadPrompt("refine-system.md") + "\n");
} else {
  process.stdout.write(loadPrompt("system.md") + "\n");
}
