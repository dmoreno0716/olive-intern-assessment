"use client";

import { z } from "zod";
import type { CatalogNode } from "../types";
import { useFunnelRuntime } from "@/lib/funnel/runtime";

export const PrimaryCTASchema = z.object({
  label: z.string(),
  action: z.enum(["next", "submit", "external"]).default("next"),
  href: z.string().optional(),
  ariaLabel: z.string().optional(),
});

export const PrimaryCTADescription =
  "The funnel-mode primary button. Lives in Screen.footer. Validates the screen's bound fields, persists the answer, and advances. Olive bg, cream fg, 18px radius (literal).";

type PrimaryCTAProps = z.infer<typeof PrimaryCTASchema>;

export function PrimaryCTA({ node }: { node: CatalogNode }) {
  const props = (node.props ?? {}) as Partial<PrimaryCTAProps>;
  const action = props.action ?? "next";
  const label = props.label ?? "Continue";
  const runtime = useFunnelRuntime();
  const loading = false;

  const onClick = () => {
    if (!runtime) return;
    runtime.onCTA({
      screenId: runtime.currentScreenId,
      label,
      action,
      href: props.href,
    });
  };

  return (
    <button
      type="button"
      aria-label={props.ariaLabel ?? label}
      disabled={loading}
      onClick={onClick}
      className="group relative flex w-full items-center justify-center gap-2 bg-[var(--olive-500)] px-6 py-4 font-sans text-[16px] font-medium text-[var(--cream-50)] shadow-2 transition-transform duration-[var(--m-fast)] ease-[var(--ease-em)] hover:[@media(hover:hover)]:-translate-y-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--olive-700)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--fbg)] active:translate-y-0 disabled:opacity-50 disabled:shadow-none"
      style={{ borderRadius: 18 }}
    >
      {loading ? (
        <span
          aria-hidden
          className="h-3.5 w-3.5 animate-spin rounded-full border-[1.5px] border-[var(--cream-50)] border-t-transparent"
        />
      ) : (
        <span>{label}</span>
      )}
    </button>
  );
}
