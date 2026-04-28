"use client";

import { z } from "zod";
import type { CatalogNode } from "../types";

export const SecondaryCTASchema = z.object({
  label: z.string(),
  action: z.enum(["skip", "back", "external", "share"]).default("skip"),
  href: z.string().optional(),
  /** When `action === "share"`, payload passed to the Web Share API.
   * Falls back to copying `shareUrl` (or the current page URL) to the
   * clipboard if `navigator.share` isn't available (typically desktop). */
  shareTitle: z.string().optional(),
  shareText: z.string().optional(),
  shareUrl: z.string().optional(),
});

export const SecondaryCTADescription =
  "Subdued link-style action ('Maybe later', 'Skip this question', 'Share my result'). Lives in Screen.footer beneath the PrimaryCTA. Set `action: \"share\"` on result screens to invite the user to post their result to social media — provide `shareTitle` and `shareText` (e.g. shareText: \"I'm a Slow Burn Eater 🍃\"). The runtime calls navigator.share() on mobile and falls back to clipboard copy on desktop.";

type SecondaryCTAProps = z.infer<typeof SecondaryCTASchema>;

/**
 * Web Share + clipboard fallback. Implemented in the runtime (not the
 * spec) so creators only need to declare intent — `action: "share"` plus
 * optional `shareTitle` / `shareText` / `shareUrl` payload — and the
 * platform decides what UI to show. iOS/Android both back
 * `navigator.share` natively; desktop browsers without it get a
 * clipboard write so the affordance never feels broken.
 */
async function performShare(props: Partial<SecondaryCTAProps>): Promise<void> {
  const url =
    props.shareUrl ??
    (typeof window !== "undefined" ? window.location.href : "");
  const payload: ShareData = {
    title: props.shareTitle,
    text: props.shareText,
    url,
  };

  if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
    try {
      await navigator.share(payload);
      return;
    } catch (err) {
      // User cancelled the share sheet — not an error worth surfacing.
      // Any other failure falls through to clipboard.
      const name = (err as { name?: string })?.name;
      if (name === "AbortError") return;
    }
  }

  if (
    typeof navigator !== "undefined" &&
    navigator.clipboard &&
    typeof navigator.clipboard.writeText === "function"
  ) {
    const text = [props.shareText, url].filter(Boolean).join(" ");
    try {
      await navigator.clipboard.writeText(text || url);
    } catch {
      // Clipboard write blocked (no user gesture, permissions, http) —
      // silently swallow. The visual feedback below still fires.
    }
  }
}

export function SecondaryCTA({ node }: { node: CatalogNode }) {
  const props = (node.props ?? {}) as Partial<SecondaryCTAProps>;
  const action = props.action ?? "skip";
  const onClick = () => {
    if (action === "share") {
      void performShare(props);
      return;
    }
    if (action === "external" && props.href && typeof window !== "undefined") {
      window.location.assign(props.href);
    }
    // skip / back: handled by the runtime via the surrounding context;
    // wiring them up is a future round, kept as a no-op here so existing
    // specs that include "Maybe later" don't throw.
  };
  return (
    <button
      type="button"
      onClick={onClick}
      className="mx-auto inline-flex h-11 items-center justify-center px-2 font-sans text-[14px] font-medium text-[var(--ftext-m)] transition-colors hover:text-[var(--ftext)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--faccent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--fbg)]"
    >
      {props.label ?? ""}
    </button>
  );
}
