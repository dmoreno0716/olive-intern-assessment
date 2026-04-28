"use client";

import { useId } from "react";
import { z } from "zod";
import type { CatalogNode } from "../types";
import { useFunnelField } from "@/lib/funnel/runtime";

export const NumberInputSchema = z.object({
  field: z.string(),
  min: z.number().optional(),
  max: z.number().optional(),
  step: z.number().default(1),
  unit: z.string().optional(),
});

export const NumberInputDescription =
  "Numeric input with optional unit suffix. Use for ages, counts, durations.";

type NumberInputProps = z.infer<typeof NumberInputSchema>;

export function NumberInput({ node }: { node: CatalogNode }) {
  const props = (node.props ?? {}) as Partial<NumberInputProps>;
  const id = useId();
  const field = useFunnelField<string>(props.field, "");
  const value = field.bound ? field.value : "";
  return (
    <div className="flex h-12 w-full items-stretch overflow-hidden rounded-[var(--r-md)] border-[1.5px] border-[var(--fborder)] bg-[var(--fsurf)] focus-within:border-[var(--faccent)]">
      <input
        id={id}
        name={props.field}
        type="number"
        inputMode="numeric"
        min={props.min}
        max={props.max}
        step={props.step ?? 1}
        value={value}
        onChange={(e) => field.bound && field.setValue(e.target.value)}
        className="flex-1 bg-transparent px-4 font-mono text-[15px] tabular-nums text-[var(--ftext)] placeholder:text-[var(--ftext-f)] focus:outline-none"
      />
      {props.unit && (
        <span className="grid place-items-center border-l-[1.5px] border-[var(--fborder)] bg-[var(--fsurf2)] px-4 font-mono text-[12px] uppercase tracking-[0.06em] text-[var(--ftext-m)]">
          {props.unit}
        </span>
      )}
    </div>
  );
}
