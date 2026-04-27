"use client";

import { z } from "zod";
import type { CatalogNode } from "../types";

export const BodySchema = z.object({
  text: z.string(),
  size: z.enum(["sm", "md", "lg"]).default("md"),
  tone: z.enum(["default", "muted"]).default("default"),
});

export const BodyDescription =
  "Paragraph copy. Use after a Heading for sub-headers, or between sections for explanatory text.";

type BodyProps = z.infer<typeof BodySchema>;

const sizeMap: Record<NonNullable<BodyProps["size"]>, string> = {
  sm: "text-[13.5px] leading-[1.5]",
  md: "text-[15px] leading-[1.55]",
  lg: "text-[17px] leading-[1.55]",
};

export function Body({ node }: { node: CatalogNode }) {
  const props = (node.props ?? {}) as Partial<BodyProps>;
  const size = props.size ?? "md";
  const tone = props.tone ?? "default";
  return (
    <p
      className={`font-sans ${sizeMap[size]} ${
        tone === "muted" ? "text-[var(--ftext-m)]" : "text-[var(--ftext)]"
      }`}
    >
      {props.text ?? ""}
    </p>
  );
}
