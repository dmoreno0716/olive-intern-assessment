"use client";

import { z } from "zod";
import type { CatalogNode } from "../types";

export const ResultBadgeSchema = z.object({ label: z.string() });

export const ResultBadgeDescription =
  "Pill with status dot + label, shown at the top of a result Screen (e.g. 'Your match').";

export function ResultBadge({ node }: { node: CatalogNode }) {
  const props = (node.props ?? {}) as { label?: string };
  return (
    <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-[color-mix(in_oklch,var(--olive-500)_10%,var(--fsurf))] px-3 py-1 font-mono text-[10.5px] font-medium uppercase tracking-[0.06em] text-[var(--olive-700)]">
      <span
        aria-hidden
        className="inline-block h-1.5 w-1.5 rounded-full bg-[var(--olive-500)]"
      />
      {props.label ?? ""}
    </span>
  );
}
