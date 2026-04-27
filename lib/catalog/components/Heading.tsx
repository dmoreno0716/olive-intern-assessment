"use client";

import { z } from "zod";
import type { CatalogNode } from "../types";

export const HeadingSchema = z.object({
  text: z.string(),
  emphasis: z.string().optional(),
  size: z.enum(["sm", "md", "lg", "xl", "2xl", "3xl"]).default("xl"),
  align: z.enum(["start", "center"]).default("start"),
});

export const HeadingDescription =
  "Funnel headline. Renders Instrument Serif italic. The optional `emphasis` substring is wrapped in <em> styled with olive-700 to draw the eye to a key word.";

type HeadingProps = z.infer<typeof HeadingSchema>;

const sizeMap: Record<NonNullable<HeadingProps["size"]>, string> = {
  sm: "text-[18px] leading-[1.25]",
  md: "text-[22px] leading-[1.2]",
  lg: "text-[26px] leading-[1.15]",
  xl: "text-[32px] leading-[1.1]",
  "2xl": "text-[44px] leading-[1.08]",
  "3xl": "text-[56px] leading-[1.05]",
};

function renderWithEmphasis(text: string, emphasis?: string) {
  if (!emphasis) return text;
  const idx = text.indexOf(emphasis);
  if (idx === -1) return text;
  return (
    <>
      {text.slice(0, idx)}
      <em className="not-italic text-[var(--olive-700)]">{emphasis}</em>
      {text.slice(idx + emphasis.length)}
    </>
  );
}

export function Heading({ node }: { node: CatalogNode }) {
  const props = (node.props ?? {}) as Partial<HeadingProps>;
  const size = props.size ?? "xl";
  const align = props.align ?? "start";
  return (
    <h1
      className={`font-display italic font-normal tracking-[-0.005em] text-[var(--ftext)] ${sizeMap[size]} ${
        align === "center" ? "text-center" : "text-start"
      }`}
    >
      {renderWithEmphasis(props.text ?? "", props.emphasis)}
    </h1>
  );
}
