import type { ReactNode } from "react";
import { Lock } from "lucide-react";

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
  const urlChip = `olive-funnels.app/f/${funnelId.slice(0, 8)}…`;
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
        <div
          className="absolute left-1/2 top-4 inline-flex -translate-x-1/2 items-center gap-1.5 rounded-full border border-[var(--cream-300)] bg-[var(--cream-50)] px-3 py-1.5 font-mono text-[11px] text-[var(--ftext-m)] shadow-1"
        >
          <Lock className="h-[11px] w-[11px] text-[var(--olive-700)]" strokeWidth={2} />
          <span>{urlChip}</span>
        </div>
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
