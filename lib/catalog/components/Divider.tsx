"use client";

import { z } from "zod";
import type { CatalogNode } from "../types";

export const DividerSchema = z.object({
  tone: z.enum(["soft", "strong"]).default("soft"),
});

export const DividerDescription = "Horizontal hairline. Use to separate body sections.";

type DividerProps = z.infer<typeof DividerSchema>;

export function Divider({ node }: { node: CatalogNode }) {
  const tone = ((node.props ?? {}) as Partial<DividerProps>).tone ?? "soft";
  return (
    <hr
      className={`border-0 ${
        tone === "strong"
          ? "h-px bg-[var(--fborder-s)]"
          : "h-px bg-[var(--fborder)]"
      }`}
    />
  );
}
