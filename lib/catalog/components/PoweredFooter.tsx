"use client";

import { z } from "zod";

export const PoweredFooterSchema = z.object({});

export const PoweredFooterDescription =
  "The 'Powered by Olive' mark. Auto-rendered as the last child of every Screen unless funnel-level config sets `hidePoweredFooter: true`. Do NOT include in spec — registered for catalog completeness only.";

export function PoweredFooter() {
  return (
    <div className="flex items-center justify-center gap-1.5 px-3.5 py-1.5 font-mono text-[10.5px] uppercase tracking-[0.06em] text-[var(--ftext-f)]">
      <span
        aria-hidden
        className="inline-block h-2.5 w-2.5 rounded-full"
        style={{
          background:
            "conic-gradient(from 0deg, var(--olive-300), var(--olive-500), var(--olive-700), var(--olive-300))",
        }}
      />
      <span>Powered by Olive</span>
    </div>
  );
}
