"use client";

import { useState } from "react";
import { z } from "zod";
import { Check } from "lucide-react";
import type { CatalogNode } from "../types";
import { ChoiceListSchema } from "./ChoiceList";
import { useFunnelField } from "@/lib/funnel/runtime";

export const MultiChoiceSchema = ChoiceListSchema.extend({
  min: z.number().int().nonnegative().default(0),
  max: z.number().int().positive().optional(),
});

export const MultiChoiceDescription =
  "Multi-select stack of full-width option cards with checkbox markers. Same shape as ChoiceList plus optional min/max counts.";

type MultiChoiceProps = z.infer<typeof MultiChoiceSchema>;

export function MultiChoice({ node }: { node: CatalogNode }) {
  const props = (node.props ?? {}) as Partial<MultiChoiceProps>;
  const options = props.options ?? [];
  const max = props.max;
  const [localSelected, setLocalSelected] = useState<string[]>([]);
  const field = useFunnelField<string[]>(props.field, []);
  const selected = field.bound ? field.value : localSelected;

  function toggle(value: string) {
    const has = selected.includes(value);
    let next: string[];
    if (has) {
      next = selected.filter((v) => v !== value);
    } else {
      if (max && selected.length >= max) return;
      next = [...selected, value];
    }
    if (field.bound) field.setValue(next);
    else setLocalSelected(next);
  }

  return (
    <ul className="flex flex-col gap-2">
      {options.map((opt) => {
        const isSelected = selected.includes(opt.value);
        return (
          <li key={opt.value}>
            <button
              type="button"
              role="checkbox"
              aria-checked={isSelected}
              onClick={() => toggle(opt.value)}
              className={`flex w-full min-h-[60px] items-center gap-3 rounded-[var(--r-lg)] border-[1.5px] px-4 py-[15px] text-left transition-colors duration-[var(--m-fast)] ease-[var(--ease)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--faccent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--fbg)] ${
                isSelected
                  ? "border-[var(--olive-500)] bg-[color-mix(in_oklch,var(--olive-500)_6%,var(--fsurf))]"
                  : "border-[var(--fborder)] bg-[var(--fsurf)] hover:border-[var(--fborder-s)]"
              }`}
            >
              <span
                aria-hidden
                className={`grid h-[22px] w-[22px] shrink-0 place-items-center rounded-md border-[1.5px] transition-colors ${
                  isSelected
                    ? "border-[var(--olive-500)] bg-[var(--olive-500)] text-[var(--cream-50)]"
                    : "border-[var(--fborder-s)] bg-transparent"
                }`}
              >
                {isSelected && <Check className="h-3.5 w-3.5" strokeWidth={2.4} />}
              </span>
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
            </button>
          </li>
        );
      })}
    </ul>
  );
}
