/**
 * postMessage protocol shared by the public funnel iframe and the webview
 * test harness. Source spec: design/WEBVIEW_HARNESS.md.
 *
 * Imported by:
 *   - app/f/[funnelId]/FunnelPlayer.tsx (iframe → host emitter)
 *   - app/webview-test/page.tsx          (host receiver + sender)
 */

export type CTAAction = "next" | "submit" | "external";

/* ────────────────────────── iframe → host ────────────────────────── */

export type IframeToHostEvent =
  | {
      type: "funnel:loaded";
      payload: {
        funnelId: string;
        specVersion: number;
        screenCount: number;
        locale: string;
      };
    }
  | {
      type: "screen:shown";
      payload: { index: number; screenId: string; kind: string };
    }
  | {
      type: "screen:completed";
      payload: { index: number; screenId: string; dwellMs: number };
    }
  | {
      type: "answer:submitted";
      payload: {
        screenId: string;
        answer: { value: unknown; label?: string };
      };
    }
  | {
      type: "cta:clicked";
      payload: {
        screenId: string;
        label: string;
        action: CTAAction;
        href?: string;
      };
    }
  | {
      type: "funnel:completed";
      payload: {
        funnelId: string;
        variant: string;
        answers: Record<string, unknown>;
        completedAt: string;
      };
    }
  | {
      type: "funnel:abandoned";
      payload: {
        funnelId: string;
        variant: string;
        lastScreenId: string;
        partialAnswers: Record<string, unknown>;
        durationMs: number;
      };
    };

export type IframeToHostType = IframeToHostEvent["type"];

export const IFRAME_TO_HOST_EVENT_TYPES: IframeToHostType[] = [
  "funnel:loaded",
  "screen:shown",
  "screen:completed",
  "answer:submitted",
  "cta:clicked",
  "funnel:completed",
  "funnel:abandoned",
];

/* ────────────────────────── host → iframe ────────────────────────── */

export type HostToIframeEvent =
  | {
      type: "user:auth";
      payload: { userId: string; token: string; email?: string; tier?: string };
    }
  | {
      type: "user:info";
      payload: { name?: string; locale?: string; segment?: string };
    }
  | { type: "locale:set"; payload: { locale: string } }
  | { type: "theme:set"; payload: { mode: "light" | "dark" } }
  | { type: "navigation:back"; payload: Record<string, never> };

/* ────────── Studio-only preview control protocol ──────────
 * Distinct from the public host→iframe events above. Only honored when
 * the funnel page is mounted with `?preview=1` (Studio preview iframe).
 * Public webview hosts never send these — we don't ship them in
 * HOST_TO_IFRAME_EVENT_TYPES so the webview test harness ignores them. */
export type PreviewControlEvent =
  | { type: "preview:goto"; payload: { index: number } }
  | { type: "preview:restart"; payload: Record<string, never> };

export type PreviewControlType = PreviewControlEvent["type"];

export type HostToIframeType = HostToIframeEvent["type"];

export const HOST_TO_IFRAME_EVENT_TYPES: HostToIframeType[] = [
  "user:auth",
  "user:info",
  "locale:set",
  "theme:set",
  "navigation:back",
];

/** Default JSON payload skeletons for the harness's "Send to funnel" panel. */
export const HOST_TO_IFRAME_SAMPLE_PAYLOADS: Record<HostToIframeType, unknown> =
  {
    "user:auth": {
      userId: "u_abc123",
      token: "stub-token",
      email: "demo@olive.app",
      tier: "free",
    },
    "user:info": { name: "Demo", locale: "en-US", segment: "tiktok" },
    "locale:set": { locale: "en-US" },
    "theme:set": { mode: "light" },
    "navigation:back": {},
  };

/** Tiny helper used by both ends to post a typed message. */
export function postIframeEvent<T extends IframeToHostEvent>(
  target: Window,
  event: T,
): void {
  target.postMessage(event, "*");
}
