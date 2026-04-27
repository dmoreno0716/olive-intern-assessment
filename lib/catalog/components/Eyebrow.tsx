"use client";

import { z } from "zod";
import type { CatalogNode } from "../types";

export const EyebrowSchema = z.object({
  text: z.string(),
  tone: z.enum(["default", "accent"]).default("default"),
});

export const EyebrowDescription =
  "Small mono uppercase label above a Heading (e.g. 'STEP 3 OF 6', 'LIMITED OFFER').";

type EyebrowProps = z.infer<typeof EyebrowSchema>;

export function Eyebrow({ node }: { node: CatalogNode }) {
  const props = (node.props ?? {}) as Partial<EyebrowProps>;
  const tone = props.tone ?? "default";
  return (
    <p
      className={`font-mono text-[11px] font-medium uppercase tracking-[0.08em] ${
        tone === "accent" ? "text-[var(--olive-700)]" : "text-[var(--ftext-m)]"
      }`}
    >
      {props.text ?? ""}
    </p>
  );
}
