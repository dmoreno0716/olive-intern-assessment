"use client";

import { z } from "zod";
import { ChevronLeft } from "lucide-react";
import type { CatalogNode } from "../types";
import { Children } from "../render";
import { useScreenChrome } from "@/lib/funnel/runtime";

export const ScreenSchema = z.object({
  id: z.string(),
  kind: z.enum(["intro", "question", "gate", "result", "custom"]).default("question"),
  showProgress: z.boolean().default(true),
  showBack: z.boolean().default(true),
  body: z.array(z.any()),
  footer: z.array(z.any()).optional(),
  /** Optional helper string surfaced after a long dwell on this screen
   * (see lib/funnel/constants.ts DWELL_HELPER_THRESHOLD_MS). Funnel-mode
   * runtime only — Studio preview never shows it. */
  dwellHelper: z.string().optional(),
});

export const ScreenDescription =
  "Top-level container for one funnel step. Owns progress indicator, back button, body, and footer slots. Every funnel spec is a list of Screen nodes. Optional `dwellHelper` (string) surfaces in-place when the user lingers >8s on this screen.";

type ScreenProps = z.infer<typeof ScreenSchema>;

/**
 * Funnel-level toggle for the auto-rendered "Powered by Olive" mark
 * (per `design/DECISIONS.md` #9). Defaults to `true` for the assessment
 * — the platform-attribution chrome doesn't add anything here, and
 * suppressing it gives the result screen back the visual room. The
 * conditional render below stays in place so a real Olive deployment
 * can flip this back to `false` (or read from a per-funnel config row)
 * without touching layout.
 */
const HIDE_POWERED_FOOTER = true;

export function Screen({ node }: { node: CatalogNode }) {
  const props = (node.props ?? {}) as Partial<ScreenProps>;
  const screenKind = props.kind ?? "question";
  // Result screens default to no progress bar — the visitor is "done"
  // and a partial bar reads as broken (see DECISIONS engineering note
  // #1 / round-6 bug-fix). The spec can still opt back in by setting
  // showProgress: true explicitly.
  const showProgress =
    props.showProgress ?? (screenKind === "result" ? false : true);
  const showBackProp = props.showBack ?? true;
  const body = (props.body ?? []) as CatalogNode[];
  const footer = (props.footer ?? []) as CatalogNode[];
  const dwellHelper = props.dwellHelper;

  const chrome = useScreenChrome(node);
  // Live runtime: question-aware progress from FunnelPlayer.
  // Studio preview (no chrome): keep the old fixed 40% bar.
  const progress = chrome ? chrome.progressFraction : 0.4;
  // Hide back on screen 0 of a real run, in addition to the spec's flag.
  const showBack = chrome ? showBackProp && !chrome.isFirst : showBackProp;
  const showHelper = Boolean(chrome?.dwellHelperVisible && dwellHelper);

  // In live funnel mode the page Frame already supplies the card chrome;
  // Screen just fills it. In Studio preview, Screen still renders its own
  // 480×760 mock-card so the catalog page reads as a phone screenshot.
  const liveMode = Boolean(chrome);
  const containerClass = liveMode
    ? "funnel relative flex h-full w-full flex-col bg-[var(--fbg)] text-[var(--ftext)]"
    : "funnel relative mx-auto flex h-[760px] w-full max-w-[480px] flex-col overflow-hidden rounded-[22px] bg-[var(--fbg)] text-[var(--ftext)] shadow-2 ring-1 ring-[var(--fborder)]";

  return (
    <div className={containerClass}>
      {showProgress && (
        <div className="px-[22px] pt-[14px] pb-2">
          <div className="h-[3px] w-full overflow-hidden rounded-full bg-[var(--fborder)]">
            <div
              className="h-full rounded-full bg-[var(--faccent)] transition-[width] duration-[var(--m-med)] ease-[var(--ease-em)]"
              style={{ width: `${Math.round(progress * 100)}%` }}
            />
          </div>
        </div>
      )}

      {showBack && (
        <div className="px-4 pt-2">
          <button
            type="button"
            aria-label="Go back"
            onClick={chrome?.retreat}
            className="grid h-11 w-11 place-items-center rounded-full text-[var(--olive-900)] transition hover:bg-[var(--fsurf2)]"
          >
            <ChevronLeft className="h-[22px] w-[22px]" strokeWidth={1.6} />
          </button>
        </div>
      )}

      <div
        className={`flex flex-1 flex-col gap-6 overflow-y-auto px-4 pt-2 pb-4 ${
          // Result screens have less content than questions by design — a
          // ResultBadge + ResultHero + short tagline lands ~280px tall in
          // a ~640px body container, leaving a tall empty band between
          // the reveal and the footer CTA. Center vertically so the
          // reveal sits in the middle of the screen with breathing room
          // above and below; min-h-fit guards against the (rare) case of
          // a result screen with enough content to need scroll.
          screenKind === "result" ? "min-h-fit justify-center" : ""
        }`}
      >
        <Children nodes={body} prefix={`${props.id ?? "screen"}-body`} />
        {showHelper && (
          <div
            role="status"
            className="mt-2 flex items-start gap-2 rounded-[var(--r-md)] border border-[var(--fborder-s)] bg-[var(--fsurf2)] px-3 py-2.5 font-sans text-[13px] leading-snug text-[var(--ftext-m)]"
          >
            <span className="mt-[3px] inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--olive-500)]" />
            <span>{dwellHelper}</span>
          </div>
        )}
      </div>

      {footer.length > 0 && (
        <div className="flex flex-col gap-3 px-6 pt-[14px] pb-[18px]">
          <Children nodes={footer} prefix={`${props.id ?? "screen"}-footer`} />
        </div>
      )}

      {!HIDE_POWERED_FOOTER && (
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
      )}
    </div>
  );
}
