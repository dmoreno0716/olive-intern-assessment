"use client";

import { z } from "zod";
import { ChevronLeft } from "lucide-react";
import type { CatalogNode } from "../types";
import { Children } from "../render";

export const ScreenSchema = z.object({
  id: z.string(),
  kind: z.enum(["intro", "question", "gate", "result", "custom"]).default("question"),
  showProgress: z.boolean().default(true),
  showBack: z.boolean().default(true),
  body: z.array(z.any()),
  footer: z.array(z.any()).optional(),
});

export const ScreenDescription =
  "Top-level container for one funnel step. Owns progress indicator, back button, body, and footer slots. Every funnel spec is a list of Screen nodes.";

type ScreenProps = z.infer<typeof ScreenSchema>;

export function Screen({ node }: { node: CatalogNode }) {
  const props = (node.props ?? {}) as Partial<ScreenProps>;
  const showProgress = props.showProgress ?? true;
  const showBack = props.showBack ?? true;
  const body = (props.body ?? []) as CatalogNode[];
  const footer = (props.footer ?? []) as CatalogNode[];
  const progress = 0.4;

  return (
    <div className="funnel relative mx-auto flex h-[760px] w-full max-w-[480px] flex-col overflow-hidden rounded-[22px] bg-[var(--fbg)] text-[var(--ftext)] shadow-2 ring-1 ring-[var(--fborder)]">
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
            className="grid h-11 w-11 place-items-center rounded-full text-[var(--olive-900)] transition hover:bg-[var(--fsurf2)]"
          >
            <ChevronLeft className="h-[22px] w-[22px]" strokeWidth={1.6} />
          </button>
        </div>
      )}

      <div className="flex flex-1 flex-col gap-6 overflow-y-auto px-4 pt-2 pb-4">
        <Children nodes={body} prefix={`${props.id ?? "screen"}-body`} />
      </div>

      {footer.length > 0 && (
        <div className="flex flex-col gap-3 px-6 pt-[14px] pb-[18px]">
          <Children nodes={footer} prefix={`${props.id ?? "screen"}-footer`} />
        </div>
      )}

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
    </div>
  );
}
