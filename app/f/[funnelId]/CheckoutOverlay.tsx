"use client";

import { Check } from "lucide-react";

/**
 * Visual chrome shown for ~900ms after a final-screen `action="external"`
 * CTA fires, before the page navigates to the CTA's `href`.
 *
 * Spec: design/PUBLIC_FUNNEL.md §"Checkout transition overlay". The
 * overlay does NOT perform the handoff itself — `FunnelPlayer.onCTA` has
 * already emitted `cta:clicked` and `funnel:completed`, posted the
 * `cta_clicked` server event, and scheduled `window.location.assign(href)`
 * by the time we mount. We exist solely to:
 *
 *   1. Confirm the click landed (the spinner + "Opening checkout…" copy).
 *   2. Mirror the postMessage event trail so a webview QA in the harness
 *      can visually correlate what's on the wire with what the user sees.
 *   3. Cover the brief gap between client-side state changes and the
 *      browser navigation actually starting — without it the page looks
 *      frozen for the duration of the navigation.
 *
 * Why we don't auto-thank: per design/DECISIONS.md #2, we never inject a
 * thank-you screen the creator didn't author. The CTA stays tappable on
 * the final spec-defined screen and the conversion event is the click
 * itself. This overlay is a transient affordance, not a destination.
 *
 * If `href` is missing (creator authored an `action="external"` CTA but
 * forgot the href), the events row shows `checkout → —` and FunnelPlayer
 * will skip the navigation. The user stays on the result screen with the
 * CTA still tappable, which is the documented "stay put" fallback.
 */
export function CheckoutOverlay({ href }: { href?: string }) {
  return (
    <div
      role="dialog"
      aria-label="Opening checkout"
      className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-5 px-8 py-10 text-[var(--cream-50)]"
      style={{
        background: "color-mix(in oklch, var(--olive-900) 92%, transparent)",
        backdropFilter: "blur(8px)",
        animation: "checkout-fade var(--m-med) var(--ease-em)",
      }}
    >
      <span
        aria-hidden
        className="h-[54px] w-[54px] animate-spin rounded-full border-[3px]"
        style={{
          borderColor: "color-mix(in oklch, var(--cream-50) 22%, transparent)",
          borderTopColor: "var(--cream-50)",
        }}
      />
      <h2 className="m-0 text-center font-serif text-[24px] italic tracking-tight">
        Opening checkout…
      </h2>
      <p className="m-0 text-center font-mono text-[11px] uppercase tracking-[0.08em]" style={{ color: "color-mix(in oklch, var(--cream-50) 65%, transparent)" }}>
        cta:clicked → handoff
      </p>
      <div
        className="flex flex-col items-start gap-1 rounded-[8px] border px-3.5 py-2.5 font-mono text-[11px]"
        style={{
          background: "rgba(255,255,255,0.06)",
          borderColor: "rgba(255,255,255,0.08)",
          color: "color-mix(in oklch, var(--cream-50) 80%, transparent)",
        }}
      >
        <EventLine label="cta:clicked" done />
        <EventLine label="funnel:completed" done />
        <EventLine label={`checkout → ${href ?? "—"}`} pending />
      </div>
      <style>{`@keyframes checkout-fade{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}`}</style>
    </div>
  );
}

function EventLine({ label, done, pending }: { label: string; done?: boolean; pending?: boolean }) {
  return (
    <div className="flex items-center gap-2" style={{ opacity: pending ? 0.65 : 1 }}>
      <Check
        className="h-3 w-3"
        strokeWidth={2.4}
        style={{
          color: done
            ? "var(--olive-300)"
            : "color-mix(in oklch, var(--cream-50) 30%, transparent)",
        }}
      />
      <span>{label}</span>
    </div>
  );
}
