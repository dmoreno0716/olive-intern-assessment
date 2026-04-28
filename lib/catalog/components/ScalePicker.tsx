"use client";

import { useState } from "react";
import { z } from "zod";
import type { CatalogNode } from "../types";
import { useFunnelField } from "@/lib/funnel/runtime";

export const ScalePickerSchema = z.object({
  field: z.string(),
  min: z.number().int(),
  max: z.number().int(),
  minLabel: z.string().optional(),
  maxLabel: z.string().optional(),
});

export const ScalePickerDescription =
  "Likert / NPS / 1-5 / 1-10 segmented numeric scale. Use for satisfaction, intensity, or frequency questions.";

type ScalePickerProps = z.infer<typeof ScalePickerSchema>;

export function ScalePicker({ node }: { node: CatalogNode }) {
  const props = (node.props ?? {}) as Partial<ScalePickerProps>;
  const min = props.min ?? 1;
  const max = props.max ?? 5;
  const [localSelected, setLocalSelected] = useState<number | null>(null);
  const field = useFunnelField<number | null>(props.field, null);
  const selected = field.bound ? field.value : localSelected;
  const setSelected = (n: number) => {
    if (field.bound) field.setValue(n);
    else setLocalSelected(n);
  };
  const stops: number[] = [];
  for (let i = min; i <= max; i++) stops.push(i);

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-stretch gap-1.5" role="radiogroup">
        {stops.map((n) => {
          const isSelected = selected === n;
          return (
            <button
              key={n}
              type="button"
              role="radio"
              aria-checked={isSelected}
              onClick={() => setSelected(n)}
              className={`flex h-11 flex-1 items-center justify-center rounded-[var(--r-md)] border-[1.5px] font-mono text-[15px] tabular-nums transition-colors duration-[var(--m-fast)] ease-[var(--ease)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--faccent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--fbg)] ${
                isSelected
                  ? "border-[var(--olive-500)] bg-[var(--olive-500)] text-[var(--cream-50)]"
                  : "border-[var(--fborder)] bg-[var(--fsurf)] text-[var(--ftext)] hover:border-[var(--fborder-s)]"
              }`}
            >
              {n}
            </button>
          );
        })}
      </div>
      {(props.minLabel || props.maxLabel) && (
        <div className="flex items-center justify-between font-mono text-[10.5px] uppercase tracking-[0.06em] text-[var(--ftext-f)]">
          <span>{props.minLabel ?? ""}</span>
          <span>{props.maxLabel ?? ""}</span>
        </div>
      )}
    </div>
  );
}
