"use client";

import { z } from "zod";
import type { CatalogNode } from "../types";

export const ProgressBarSchema = z.object({
  override: z.number().min(0).max(1).optional(),
});

export const ProgressBarDescription =
  "Renders inside Screen header. Computes from current screen index automatically; spec props are optional overrides. Auto-rendered by Screen — do not include in spec.";

type ProgressBarProps = z.infer<typeof ProgressBarSchema>;

export function ProgressBar({ node }: { node: CatalogNode }) {
  const props = (node.props ?? {}) as Partial<ProgressBarProps>;
  const value = props.override ?? 0.4;
  return (
    <div className="h-[3px] w-full overflow-hidden rounded-full bg-[var(--fborder)]">
      <div
        className="h-full rounded-full bg-[var(--faccent)] transition-[width] duration-[var(--m-med)] ease-[var(--ease-em)]"
        style={{ width: `${Math.round(value * 100)}%` }}
      />
    </div>
  );
}
