import type { ReactNode } from "react";

import { UrlChip } from "./UrlChip";

/**
 * Outer chrome for the public funnel page. Mobile = full-bleed cream
 * column. Desktop ≥ md = radial cream wash + 480×780 card with the
 * lock-icon URL chip floating above. Spec: design/PUBLIC_FUNNEL.md.
 *
 * Children render directly into the card (a vertical flex column). Both
 * the live-funnel renderer and the error/draft surfaces use this shell so
 * state transitions don't reflow the page.
 */
export function FunnelPageFrame({
  funnelId,
  children,
}: {
  funnelId: string;
  children: ReactNode;
}) {
  return (
    <div
      className="funnel relative min-h-dvh w-full"
      style={{
        background: "var(--cream-100)",
      }}
    >
      <div
        className="hidden min-h-dvh items-center justify-center md:flex"
        style={{
          background:
            "radial-gradient(ellipse 70% 60% at 50% 0%, color-mix(in oklch, var(--olive-500) 5%, transparent), transparent 60%), radial-gradient(ellipse 70% 60% at 50% 100%, color-mix(in oklch, var(--r1) 4%, transparent), transparent 60%), var(--cream-100)",
          padding: 32,
        }}
      >
        <UrlChip funnelId={funnelId} />
        <div
          className="relative flex h-[780px] w-full max-w-[480px] flex-col overflow-hidden rounded-[var(--r-xl)] border border-[var(--cream-300)] bg-[var(--cream-100)]"
          style={{
            boxShadow:
              "0 4px 12px rgba(38,44,30,.06),0 24px 64px rgba(38,44,30,.10),0 1px 0 rgba(255,255,255,0.5) inset",
          }}
        >
          {children}
        </div>
      </div>
      <div className="flex min-h-dvh flex-col md:hidden">{children}</div>
    </div>
  );
}
