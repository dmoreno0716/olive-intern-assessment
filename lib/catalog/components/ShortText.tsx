"use client";

import { useId } from "react";
import { z } from "zod";
import type { CatalogNode } from "../types";

export const ShortTextSchema = z.object({
  field: z.string(),
  placeholder: z.string().optional(),
  maxLength: z.number().int().positive().optional(),
  required: z.boolean().default(true),
  autocomplete: z.string().optional(),
});

export const ShortTextDescription =
  "Single-line text input bound to a field key. Used for names, short open answers, etc.";

type ShortTextProps = z.infer<typeof ShortTextSchema>;

export function ShortText({ node }: { node: CatalogNode }) {
  const props = (node.props ?? {}) as Partial<ShortTextProps>;
  const id = useId();
  return (
    <div className="flex flex-col gap-1.5">
      <input
        id={id}
        name={props.field}
        type="text"
        placeholder={props.placeholder}
        maxLength={props.maxLength}
        autoComplete={props.autocomplete}
        required={props.required ?? true}
        className="h-12 w-full rounded-[var(--r-md)] border-[1.5px] border-[var(--fborder)] bg-[var(--fsurf)] px-4 font-sans text-[15px] text-[var(--ftext)] placeholder:text-[var(--ftext-f)] transition-colors focus:border-[var(--faccent)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--faccent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--fbg)]"
      />
    </div>
  );
}
