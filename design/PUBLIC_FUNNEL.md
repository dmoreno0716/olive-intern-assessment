# PUBLIC_FUNNEL.md — Public funnel page

Route: `app/f/[funnelId]/page.tsx` at `olive-funnels.app/f/:funnelId`. Reference: `designs/05_Public_Harness.html`.

## Layout

- **Mobile (< 768px)**: full-bleed. Status bar (real device chrome on iOS/Android Safari, simulated when in-app webview). 480px max content column with 16/24px h-padding.
- **Desktop (≥ 768px)**: page bg = radial cream wash (top: olive 5% mix, bottom: terracotta 4% mix). Content frames as a 480×780 card centered on the page, --r-xl, --sh-3, 1px cream-300 border. Above the card: tiny lock-icon URL chip showing the funnel URL.

The Funnel mode CSS class (`.funnel`) is applied at the route layout so all role tokens flip.

## States

### Live (rendering a screen)
- Default. Renders one Screen at a time (see SHARED_CHROME.md).
- Inter-screen transitions per SHARED_CHROME §2.

### Loading
- Pulse-ring olive "o" mark (48px, conic gradient).
- 5 shimmer skeleton bars below (linear-gradient sweep, 1.4s linear infinite).
- Mono caption "LOADING FUNNEL".
- Triggered while spec fetches from `/api/funnels/:id/spec`.

### Error — Not found (404)
- Search-style icon (olive-700 stroke) in cream icon-wrap.
- Italic Display: "This funnel *doesn't exist*."
- Body: "It may have been moved, the link mistyped, or never published."
- Mono err-id chip: `funnel_id · slow-bur`.
- Secondary button: "Go to Olive →".

### Error — Unpublished (403 status=draft)
- Lock icon in warning-tinted wrap.
- Italic: "This funnel is *not live yet*."
- Body explains the creator hasn't published.
- Err-id chip: `status · draft`.
- Secondary button: "Open in Studio" (only shown if user is auth'd as the funnel owner — auth gate in route handler).

### Error — Network (ECONNRESET / offline)
- Signal-loss icon in error-red wrap.
- Italic: "Couldn't reach Olive."
- Body: "Check your connection. Your progress so far is saved on this device."
- Err-id chip with request id.
- Two buttons: "Retry" (primary) + "Continue offline (cached)" (secondary, only shown if a cached spec exists in localStorage).

## Completion behavior

**The system never auto-injects a thank-you screen.**

When the user advances past the final spec-defined screen:
- We stay on that screen with the PrimaryCTA still tappable.
- Tap fires `cta:clicked` (with the screen's CTA payload) AND `funnel:completed` (with the answer set).
- Tap also triggers the checkout overlay (next section).

If the creator authored a thank-you screen, theirs renders normally as the last screen; the same logic applies (CTA tap = conversion event).

## Checkout transition overlay

When a CTA with `action="external"` is tapped:
- 320ms blur+darken overlay slides up over the current Screen.
- Background: 92% mix of olive-900, backdrop-blur 8px.
- Center: 54px ring spinner, "Opening checkout…" italic display, mono `cta:clicked → handoff` caption.
- Below: event trail (cta:clicked ✓, funnel:completed ✓, checkout handler invoked …) — three rows in a translucent dark card.
- After 600–1200ms (or upon native handler ack), overlay fades and route changes to the CTA href.

## PoweredFooter
Renders by default. Funnel spec can set `hidePoweredFooter: true` (paid creator tier) to suppress it. Visual: 6/14px padding, conic olive swirl mark, mono caption "POWERED BY OLIVE".

## Spec fetch

```
GET /api/funnels/:funnelId/spec?variant=A
→ 200 { spec: ScreenSpec[], funnelId, variant, hidePoweredFooter? }
→ 403 { error: "draft" }
→ 404 { error: "not_found" }
→ 5xx → network error state
```

Server-rendered: spec fetched in `page.tsx` server component, error states branch on the response. Client-side hydration handles transitions, answers, postMessage emission.
