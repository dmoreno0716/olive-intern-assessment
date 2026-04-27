"use client";

import { z } from "zod";
import type { CatalogNode } from "../types";

export const AvatarSchema = z.object({
  src: z.string().url(),
  size: z.enum(["sm", "md", "lg", "xl"]).default("md"),
  fallback: z.string().optional(),
});

export const AvatarDescription =
  "Decorative result/intro avatar. Size sm/md/lg/xl maps to 32/40/56/72px.";

type AvatarProps = z.infer<typeof AvatarSchema>;

const sizeMap: Record<NonNullable<AvatarProps["size"]>, string> = {
  sm: "h-8 w-8 text-[12px]",
  md: "h-10 w-10 text-[14px]",
  lg: "h-14 w-14 text-[18px]",
  xl: "h-[72px] w-[72px] text-[22px]",
};

export function Avatar({ node }: { node: CatalogNode }) {
  const props = (node.props ?? {}) as Partial<AvatarProps>;
  const size = props.size ?? "md";
  return (
    <span
      className={`inline-grid place-items-center overflow-hidden rounded-full bg-[var(--fsurf2)] font-mono uppercase text-[var(--ftext-m)] ${sizeMap[size]}`}
    >
      {props.src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={props.src} alt="" className="h-full w-full object-cover" />
      ) : (
        <span>{props.fallback ?? ""}</span>
      )}
    </span>
  );
}
