"use client";

import { z } from "zod";
import type { CatalogNode } from "../types";

export const SecondaryCTASchema = z.object({
  label: z.string(),
  action: z.enum(["skip", "back", "external"]).default("skip"),
  href: z.string().optional(),
});

export const SecondaryCTADescription =
  "Subdued link-style action ('Maybe later', 'Skip this question'). Lives in Screen.footer beneath the PrimaryCTA.";

type SecondaryCTAProps = z.infer<typeof SecondaryCTASchema>;

export function SecondaryCTA({ node }: { node: CatalogNode }) {
  const props = (node.props ?? {}) as Partial<SecondaryCTAProps>;
  return (
    <button
      type="button"
      className="mx-auto inline-flex h-11 items-center justify-center px-2 font-sans text-[14px] font-medium text-[var(--ftext-m)] transition-colors hover:text-[var(--ftext)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--faccent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--fbg)]"
    >
      {props.label ?? ""}
    </button>
  );
}
