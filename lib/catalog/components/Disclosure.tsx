"use client";

import { useState } from "react";
import { z } from "zod";
import { ChevronDown } from "lucide-react";
import type { CatalogNode } from "../types";

export const DisclosureSchema = z.object({
  summary: z.string(),
  details: z.string(),
});

export const DisclosureDescription =
  "Expandable 'What does this mean?' disclosure. Summary is the always-visible row; details show on toggle.";

type DisclosureProps = z.infer<typeof DisclosureSchema>;

export function Disclosure({ node }: { node: CatalogNode }) {
  const props = (node.props ?? {}) as Partial<DisclosureProps>;
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-[var(--r-md)] border-[1.5px] border-[var(--fborder)] bg-[var(--fsurf)]">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left font-sans text-[14px] font-medium text-[var(--ftext)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--faccent)]"
      >
        <span>{props.summary ?? ""}</span>
        <ChevronDown
          className={`h-4 w-4 text-[var(--ftext-m)] transition-transform duration-[var(--m-mid)] ${open ? "rotate-180" : "rotate-0"}`}
          strokeWidth={1.6}
        />
      </button>
      {open && (
        <div className="border-t border-[var(--fborder)] px-4 py-3 font-sans text-[13.5px] leading-[1.5] text-[var(--ftext-m)]">
          {props.details ?? ""}
        </div>
      )}
    </div>
  );
}
