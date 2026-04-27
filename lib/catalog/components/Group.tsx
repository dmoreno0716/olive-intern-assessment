"use client";

import { z } from "zod";
import type { CatalogNode } from "../types";
import { Children } from "../render";

export const GroupSchema = z.object({
  gap: z.enum(["xs", "sm", "md", "lg"]).default("sm"),
  align: z.enum(["start", "center", "baseline"]).default("center"),
  justify: z.enum(["start", "between", "center", "end"]).default("start"),
  wrap: z.boolean().default(false),
  children: z.array(z.any()),
});

export const GroupDescription =
  "Horizontal flex row. Use for inline groupings of primitives (icon + label, stat clusters, etc.).";

type GroupProps = z.infer<typeof GroupSchema>;

const gapMap: Record<NonNullable<GroupProps["gap"]>, string> = {
  xs: "gap-1",
  sm: "gap-2",
  md: "gap-4",
  lg: "gap-6",
};

const alignMap: Record<NonNullable<GroupProps["align"]>, string> = {
  start: "items-start",
  center: "items-center",
  baseline: "items-baseline",
};

const justifyMap: Record<NonNullable<GroupProps["justify"]>, string> = {
  start: "justify-start",
  between: "justify-between",
  center: "justify-center",
  end: "justify-end",
};

export function Group({ node }: { node: CatalogNode }) {
  const props = (node.props ?? {}) as Partial<GroupProps>;
  const gap = props.gap ?? "sm";
  const align = props.align ?? "center";
  const justify = props.justify ?? "start";
  const wrap = props.wrap ?? false;
  const children = (props.children ?? []) as CatalogNode[];
  return (
    <div
      className={`flex ${gapMap[gap]} ${alignMap[align]} ${justifyMap[justify]} ${
        wrap ? "flex-wrap" : ""
      }`}
    >
      <Children nodes={children} prefix="group" />
    </div>
  );
}
