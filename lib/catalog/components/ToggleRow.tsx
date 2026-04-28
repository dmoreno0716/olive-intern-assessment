"use client";

import { useState } from "react";
import { z } from "zod";
import type { CatalogNode } from "../types";
import { useFunnelField } from "@/lib/funnel/runtime";

export const ToggleRowSchema = z.object({
  field: z.string(),
  label: z.string(),
  description: z.string().optional(),
  default: z.boolean().default(false),
});

export const ToggleRowDescription =
  "Single labeled switch row. Use for opt-ins, preference toggles, consent.";

type ToggleRowProps = z.infer<typeof ToggleRowSchema>;

export function ToggleRow({ node }: { node: CatalogNode }) {
  const props = (node.props ?? {}) as Partial<ToggleRowProps>;
  const initial = props.default ?? false;
  const [localOn, setLocalOn] = useState<boolean>(initial);
  const field = useFunnelField<boolean>(props.field, initial);
  const on = field.bound ? field.value : localOn;
  const toggle = () => {
    const next = !on;
    if (field.bound) field.setValue(next);
    else setLocalOn(next);
  };

  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      onClick={toggle}
      className="flex w-full min-h-[60px] items-center justify-between gap-3 rounded-[var(--r-lg)] border-[1.5px] border-[var(--fborder)] bg-[var(--fsurf)] px-4 py-3 text-left transition-colors hover:border-[var(--fborder-s)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--faccent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--fbg)]"
    >
      <span className="flex flex-col gap-0.5">
        <span className="font-sans text-[15px] font-medium leading-tight text-[var(--ftext)]">
          {props.label ?? ""}
        </span>
        {props.description && (
          <span className="font-sans text-[13.5px] leading-snug text-[var(--ftext-m)]">
            {props.description}
          </span>
        )}
      </span>
      <span
        aria-hidden
        className={`relative inline-flex h-6 w-10 shrink-0 items-center rounded-full transition-colors duration-[var(--m-mid)] ${
          on ? "bg-[var(--olive-500)]" : "bg-[var(--fborder-s)]"
        }`}
      >
        <span
          className={`inline-block h-[18px] w-[18px] rounded-full bg-[var(--cream-50)] shadow-1 transition-transform duration-[var(--m-mid)] ${
            on ? "translate-x-[19px]" : "translate-x-[3px]"
          }`}
        />
      </span>
    </button>
  );
}
