"use client";

import { useState } from "react";
import { z } from "zod";
import type { CatalogNode } from "../types";

export const ImageChoiceGridSchema = z.object({
  field: z.string(),
  options: z.array(
    z.object({
      value: z.string(),
      label: z.string(),
      image: z.string().url(),
    })
  ),
  cols: z.enum(["2", "3"]).default("2"),
});

export const ImageChoiceGridDescription =
  "Grid of image-led options (2-col on mobile, 3-col on tablet+). If options.length > 6 the component switches to a horizontally-snap-scrolling carousel.";

type ImageChoiceGridProps = z.infer<typeof ImageChoiceGridSchema>;

export function ImageChoiceGrid({ node }: { node: CatalogNode }) {
  const props = (node.props ?? {}) as Partial<ImageChoiceGridProps>;
  const options = props.options ?? [];
  const cols = props.cols ?? "2";
  const [selected, setSelected] = useState<string | null>(null);
  const overflow = options.length > 6;

  const Tile = ({
    opt,
  }: {
    opt: { value: string; label: string; image: string };
  }) => {
    const isSelected = selected === opt.value;
    return (
      <button
        type="button"
        role="radio"
        aria-checked={isSelected}
        onClick={() => setSelected(opt.value)}
        className={`group relative flex flex-col gap-2 overflow-hidden rounded-[var(--r-lg)] border-[1.5px] bg-[var(--fsurf)] p-2 text-left transition-colors duration-[var(--m-fast)] ease-[var(--ease)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--faccent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--fbg)] ${
          isSelected
            ? "border-[var(--olive-500)] bg-[color-mix(in_oklch,var(--olive-500)_6%,var(--fsurf))]"
            : "border-[var(--fborder)] hover:border-[var(--fborder-s)]"
        } ${overflow ? "w-[160px] shrink-0 snap-start" : ""}`}
      >
        <div className="aspect-[4/3] w-full overflow-hidden rounded-[var(--r-md)] bg-[var(--fsurf2)]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={opt.image}
            alt=""
            className="h-full w-full object-cover"
          />
        </div>
        <span className="font-sans text-[14px] font-medium leading-tight text-[var(--ftext)]">
          {opt.label}
        </span>
        <span
          aria-hidden
          className={`absolute right-3 top-3 grid h-[22px] w-[22px] place-items-center rounded-full border-[1.5px] transition-colors ${
            isSelected
              ? "border-[var(--olive-500)] bg-[var(--olive-500)]"
              : "border-[var(--fborder-s)] bg-[var(--fsurf)]"
          }`}
        >
          {isSelected && (
            <span className="h-2 w-2 rounded-full bg-[var(--cream-50)]" />
          )}
        </span>
      </button>
    );
  };

  if (overflow) {
    return (
      <div
        className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2"
        role="radiogroup"
      >
        {options.map((opt) => (
          <Tile key={opt.value} opt={opt} />
        ))}
      </div>
    );
  }

  return (
    <div
      role="radiogroup"
      className={`grid gap-3 ${cols === "3" ? "grid-cols-3 sm:grid-cols-3" : "grid-cols-2"}`}
    >
      {options.map((opt) => (
        <Tile key={opt.value} opt={opt} />
      ))}
    </div>
  );
}
