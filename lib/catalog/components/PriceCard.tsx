"use client";

import { z } from "zod";
import { Check } from "lucide-react";
import type { CatalogNode } from "../types";

export const PriceCardSchema = z.object({
  title: z.string(),
  subtitle: z.string().optional(),
  bullets: z.array(z.string()).default([]),
  variant: z.enum(["default", "emphasis"]).default("default"),
});

export const PriceCardDescription =
  "The conversion/offer block. Title + subtitle + bullets (rendered with olive checkmarks). Variant 'emphasis' draws an olive border + tinted bg.";

type PriceCardProps = z.infer<typeof PriceCardSchema>;

export function PriceCard({ node }: { node: CatalogNode }) {
  const props = (node.props ?? {}) as Partial<PriceCardProps>;
  const variant = props.variant ?? "default";
  const bullets = props.bullets ?? [];
  const isEmphasis = variant === "emphasis";
  return (
    <div
      className={`flex flex-col gap-3 rounded-[var(--r-lg)] border-[1.5px] px-4 py-[14px] transition-colors ${
        isEmphasis
          ? "border-[var(--olive-500)] bg-[color-mix(in_oklch,var(--olive-500)_8%,var(--fsurf))]"
          : "border-[var(--cream-300)] bg-[var(--fsurf)]"
      }`}
    >
      <div className="flex flex-col gap-1">
        <p className="font-display text-[22px] italic font-normal leading-tight text-[var(--ftext)]">
          {props.title ?? ""}
        </p>
        {props.subtitle && (
          <p className="font-mono text-[12px] uppercase tracking-[0.06em] text-[var(--ftext-m)]">
            {props.subtitle}
          </p>
        )}
      </div>
      {bullets.length > 0 && (
        <ul className="flex flex-col gap-2 pt-1">
          {bullets.map((bullet, i) => (
            <li
              key={i}
              className="flex items-start gap-2.5 font-sans text-[14px] leading-[1.5] text-[var(--ftext)]"
            >
              <Check
                className="mt-0.5 h-[18px] w-[18px] shrink-0 text-[var(--olive-500)]"
                strokeWidth={2.2}
              />
              <span>{bullet}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
