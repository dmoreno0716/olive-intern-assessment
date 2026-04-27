"use client";

import { z } from "zod";
import type { CatalogNode } from "../types";

export const SocialProofSchema = z.object({
  variant: z.enum(["stats", "testimonial"]),
  stats: z
    .array(z.object({ value: z.string(), label: z.string() }))
    .optional(),
  testimonial: z
    .object({ quote: z.string(), author: z.string() })
    .optional(),
});

export const SocialProofDescription =
  "Either a three-stat row (variant 'stats') or a testimonial card (variant 'testimonial'). Use to bolster conversion screens.";

type SocialProofProps = z.infer<typeof SocialProofSchema>;

export function SocialProof({ node }: { node: CatalogNode }) {
  const props = (node.props ?? {}) as Partial<SocialProofProps>;

  if (props.variant === "testimonial" && props.testimonial) {
    return (
      <figure className="flex flex-col gap-3 rounded-[var(--r-lg)] border-[1.5px] border-[var(--fborder)] bg-[var(--fsurf)] px-5 py-4">
        <blockquote className="font-display text-[18px] italic font-normal leading-[1.4] text-[var(--ftext)]">
          “{props.testimonial.quote}”
        </blockquote>
        <figcaption className="font-mono text-[10.5px] uppercase tracking-[0.06em] text-[var(--ftext-m)]">
          — {props.testimonial.author}
        </figcaption>
      </figure>
    );
  }

  const stats = props.stats ?? [];
  return (
    <div className="grid grid-cols-3 gap-2 rounded-[var(--r-lg)] border-[1.5px] border-[var(--fborder)] bg-[var(--fsurf)] px-3 py-4">
      {stats.map((stat, i) => (
        <div
          key={i}
          className="flex flex-col items-center gap-1 px-1 text-center"
        >
          <span className="font-display text-[22px] italic font-normal leading-tight text-[var(--ftext)]">
            {stat.value}
          </span>
          <span className="font-mono text-[10.5px] uppercase tracking-[0.06em] text-[var(--ftext-m)]">
            {stat.label}
          </span>
        </div>
      ))}
    </div>
  );
}
