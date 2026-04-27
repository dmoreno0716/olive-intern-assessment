"use client";

import { useId } from "react";
import { z } from "zod";
import type { CatalogNode } from "../types";
import { ShortTextSchema } from "./ShortText";

export const LongTextSchema = ShortTextSchema.extend({
  rows: z.number().int().positive().default(4),
});

export const LongTextDescription =
  "Multi-line textarea. Same props as ShortText plus a `rows` count.";

type LongTextProps = z.infer<typeof LongTextSchema>;

export function LongText({ node }: { node: CatalogNode }) {
  const props = (node.props ?? {}) as Partial<LongTextProps>;
  const id = useId();
  return (
    <textarea
      id={id}
      name={props.field}
      rows={props.rows ?? 4}
      placeholder={props.placeholder}
      maxLength={props.maxLength}
      required={props.required ?? true}
      className="w-full resize-none rounded-[var(--r-md)] border-[1.5px] border-[var(--fborder)] bg-[var(--fsurf)] px-4 py-3 font-sans text-[15px] leading-[1.5] text-[var(--ftext)] placeholder:text-[var(--ftext-f)] transition-colors focus:border-[var(--faccent)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--faccent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--fbg)]"
    />
  );
}
