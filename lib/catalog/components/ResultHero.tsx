"use client";

import { z } from "zod";
import type { CatalogNode } from "../types";

export const ResultHeroSchema = z.object({
  resultName: z.string(),
  emphasis: z.string().optional(),
  tagline: z.string(),
});

export const ResultHeroDescription =
  "Big result name + tagline. Wraps a Heading + Body for the main result reveal.";

type ResultHeroProps = z.infer<typeof ResultHeroSchema>;

function withEmphasis(text: string, emphasis?: string) {
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

export function ResultHero({ node }: { node: CatalogNode }) {
  const props = (node.props ?? {}) as Partial<ResultHeroProps>;
  return (
    <div className="flex flex-col gap-3">
      <h1 className="font-display text-[32px] italic font-normal leading-[1.1] tracking-[-0.005em] text-[var(--ftext)]">
        {withEmphasis(props.resultName ?? "", props.emphasis)}
      </h1>
      <p className="font-sans text-[15px] leading-[1.55] text-[var(--ftext-m)]">
        {props.tagline ?? ""}
      </p>
    </div>
  );
}
