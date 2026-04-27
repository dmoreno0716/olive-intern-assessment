"use client";

import { z } from "zod";
import type { CatalogNode } from "../types";

export const CaptionSchema = z.object({ text: z.string() });

export const CaptionDescription =
  "Small body copy used below CTAs ('No card needed', 'We never sell your data').";

export function Caption({ node }: { node: CatalogNode }) {
  const props = (node.props ?? {}) as { text?: string };
  return (
    <p className="text-center font-sans text-[13.5px] leading-[1.5] text-[var(--ftext-m)]">
      {props.text ?? ""}
    </p>
  );
}
