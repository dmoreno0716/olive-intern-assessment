"use client";

import { z } from "zod";
import { ChevronLeft } from "lucide-react";

export const BackButtonSchema = z.object({});

export const BackButtonDescription =
  "Renders inside Screen header. Disabled on the first screen. Auto-rendered by Screen — do not include in spec.";

export function BackButton() {
  return (
    <button
      type="button"
      aria-label="Go back"
      className="grid h-11 w-11 place-items-center rounded-full text-[var(--olive-900)] transition hover:bg-[var(--fsurf2)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--faccent)]"
    >
      <ChevronLeft className="h-[22px] w-[22px]" strokeWidth={1.6} />
    </button>
  );
}
