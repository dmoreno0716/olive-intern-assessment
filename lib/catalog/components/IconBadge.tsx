"use client";

import { z } from "zod";
import * as Lucide from "lucide-react";
import type { CatalogNode } from "../types";

export const IconBadgeSchema = z.object({
  icon: z.string(),
  tone: z.enum(["olive", "cream", "accent"]).default("olive"),
});

export const IconBadgeDescription =
  "Round icon-on-tinted-bg used for feature lists, intro accents, success acknowledgements. `icon` is a lucide icon name (PascalCase).";

type IconBadgeProps = z.infer<typeof IconBadgeSchema>;

function getIcon(name: string) {
  const formatted = name.charAt(0).toUpperCase() + name.slice(1);
  return (
    (Lucide as unknown as Record<string, Lucide.LucideIcon>)[formatted] ??
    Lucide.Circle
  );
}

const toneMap: Record<NonNullable<IconBadgeProps["tone"]>, string> = {
  olive: "bg-[color-mix(in_oklch,var(--olive-500)_14%,var(--fsurf))] text-[var(--olive-700)]",
  cream: "bg-[var(--fsurf2)] text-[var(--olive-700)]",
  accent: "bg-[var(--olive-500)] text-[var(--cream-50)]",
};

export function IconBadge({ node }: { node: CatalogNode }) {
  const props = (node.props ?? {}) as Partial<IconBadgeProps>;
  const tone = props.tone ?? "olive";
  const Icon = getIcon(props.icon ?? "Circle");
  return (
    <span
      className={`inline-grid h-12 w-12 place-items-center rounded-full ${toneMap[tone]}`}
    >
      <Icon className="h-6 w-6" strokeWidth={1.6} />
    </span>
  );
}
