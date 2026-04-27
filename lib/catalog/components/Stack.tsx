"use client";

import { z } from "zod";
import type { CatalogNode } from "../types";
import { Children } from "../render";

export const StackSchema = z.object({
  gap: z.enum(["xs", "sm", "md", "lg", "xl"]).default("md"),
  align: z.enum(["start", "center", "stretch"]).default("stretch"),
  children: z.array(z.any()),
});

export const StackDescription =
  "Vertical flex column. Most common layout primitive. gap maps xs/sm/md/lg/xl to 4/8/16/24/32px.";

type StackProps = z.infer<typeof StackSchema>;

const gapMap: Record<NonNullable<StackProps["gap"]>, string> = {
  xs: "gap-1",
  sm: "gap-2",
  md: "gap-4",
  lg: "gap-6",
  xl: "gap-8",
};

const alignMap: Record<NonNullable<StackProps["align"]>, string> = {
  start: "items-start",
  center: "items-center",
  stretch: "items-stretch",
};

export function Stack({ node }: { node: CatalogNode }) {
  const props = (node.props ?? {}) as Partial<StackProps>;
  const gap = props.gap ?? "md";
  const align = props.align ?? "stretch";
  const children = (props.children ?? []) as CatalogNode[];
  return (
    <div className={`flex flex-col ${gapMap[gap]} ${alignMap[align]}`}>
      <Children nodes={children} prefix="stack" />
    </div>
  );
}
