"use client";

import { useState } from "react";
import { z } from "zod";
import * as Lucide from "lucide-react";
import type { CatalogNode } from "../types";

export const ChoiceListSchema = z.object({
  field: z.string(),
  options: z.array(
    z.object({
      value: z.string(),
      label: z.string(),
      description: z.string().optional(),
      icon: z.string().optional(),
    })
  ),
  required: z.boolean().default(true),
});

export const ChoiceListDescription =
  "Single-select stack of full-width option cards. The primary answer pattern. Binds to a `field` key.";

type ChoiceListProps = z.infer<typeof ChoiceListSchema>;

function getLucideIcon(name?: string) {
  if (!name) return null;
  const formatted = name.charAt(0).toUpperCase() + name.slice(1);
  const Icon = (Lucide as unknown as Record<string, Lucide.LucideIcon>)[formatted];
  return Icon ?? null;
}

export function ChoiceList({ node }: { node: CatalogNode }) {
  const props = (node.props ?? {}) as Partial<ChoiceListProps>;
  const options = props.options ?? [];
  const [selected, setSelected] = useState<string | null>(null);
  return (
    <ul role="radiogroup" className="flex flex-col gap-2">
      {options.map((opt) => {
        const isSelected = selected === opt.value;
        const Icon = getLucideIcon(opt.icon);
        return (
          <li key={opt.value}>
            <button
              type="button"
              role="radio"
              aria-checked={isSelected}
              onClick={() => setSelected(opt.value)}
              className={`flex w-full min-h-[60px] items-center gap-3 rounded-[var(--r-lg)] border-[1.5px] px-4 py-[15px] text-left transition-colors duration-[var(--m-fast)] ease-[var(--ease)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--faccent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--fbg)] ${
                isSelected
                  ? "border-[var(--olive-500)] bg-[color-mix(in_oklch,var(--olive-500)_6%,var(--fsurf))]"
                  : "border-[var(--fborder)] bg-[var(--fsurf)] hover:border-[var(--fborder-s)]"
              }`}
            >
              {Icon && (
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[var(--fsurf2)] text-[var(--olive-700)]">
                  <Icon className="h-[18px] w-[18px]" strokeWidth={1.6} />
                </span>
              )}
              <span className="flex flex-1 flex-col gap-0.5">
                <span className="font-sans text-[15px] font-medium leading-tight text-[var(--ftext)]">
                  {opt.label}
                </span>
                {opt.description && (
                  <span className="font-sans text-[13.5px] leading-snug text-[var(--ftext-m)]">
                    {opt.description}
                  </span>
                )}
              </span>
              <span
                aria-hidden
                className={`grid h-[22px] w-[22px] shrink-0 place-items-center rounded-full border-[1.5px] transition-colors ${
                  isSelected
                    ? "border-[var(--olive-500)] bg-[var(--olive-500)]"
                    : "border-[var(--fborder-s)] bg-transparent"
                }`}
              >
                {isSelected && (
                  <span className="h-2 w-2 rounded-full bg-[var(--cream-50)]" />
                )}
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
