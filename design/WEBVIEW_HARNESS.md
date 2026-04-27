# WEBVIEW_HARNESS.md — Test harness + postMessage protocol

Internal QA tool at `/studio/tools/webview-test`. Reference: `designs/05_Public_Harness.html` (right canvas).

## Layout

Three vertically-stacked sections at 1320px design width:

### 1. Top bar (sticky, 64px)
- Crumb caption: `Studio › Tools › Webview Test Harness`.
- Italic Display L: "Webview Test Harness".
- URL loader: scheme-locked input (`https://` prefix) + "Load" button (olive-700) + reload icon button.
- Right: live-iframe success pill (green dot + "Iframe live") when iframe has loaded successfully.

### 2. Body (2-col grid, 20px gap)

**Left column — phone panel**:
- Header: "Funnel iframe · slow-burn" caption + device toggle (iPhone 14 / Pixel 7) + orientation toggle (Portrait / Landscape).
- Stage: radial+grid neutral bg, centered iPhone shell (375×740, 42px radius, notch). Inside: actual `<iframe src={url}>` rendering the funnel at .funnel mode.
- Bottom pill: "iPhone 14 · 390×844 · Portrait · iOS WKWebView" with a green status sw.

**Right column — stacked panels**:

#### postMessage console
- Header: italic "postMessage console" + count pill ("7 events · 3 screens").
- Filter chips row (cream-50 bg): All + 7 event-type chips, each with count. Active chip = olive-tinted.
- Log: dark terminal (n-900 bg). Rows of `[timestamp] [event-tag] [summary] [▶ expand]`. Expanded rows show JSON payload with syntax highlighting (keys=olive-300, strings=terracotta, numbers=blue, booleans=mauve). Newest row pulse-highlights olive on arrival.

#### Send-to-funnel panel
- Header: italic "Send to funnel" + caption "Simulates native → webview postMessage".
- Body: event-type select + JSON payload textarea (dark, mono).
- Footer: `⌘↵` keyboard hint + "Post to iframe" button (olive-700).

### 3. Native handler simulators (full-width, below body)
- Header: italic "Native handler simulators" + iOS/Android platform toggle (Apple/Android glyphs).
- Grid of 4 cards (auto-fit, min 320px):
  - **`cta:clicked` → StoreKit / Play Billing**
  - **`funnel:completed` → Analytics**
  - **`funnel:abandoned` → UserDefaults / SharedPrefs**
  - **`answer:submitted` → POST /v1/answers**
- Each card: event tag + title + description + "Simulate iOS/Android" button + dark mock-response block.

## postMessage protocol

### Iframe → Host (events emitted by the funnel)

| Event | Payload shape |
|-------|---------------|
| `funnel:loaded` | `{ funnelId: string, specVersion: number, screenCount: number, locale: string }` |
| `screen:shown` | `{ index: number, screenId: string, kind: string }` |
| `screen:completed` | `{ index: number, screenId: string, dwellMs: number }` |
| `answer:submitted` | `{ screenId: string, answer: { value: any, label?: string } }` |
| `cta:clicked` | `{ screenId: string, label: string, action: "next"\|"submit"\|"external", href?: string }` |
| `funnel:completed` | `{ funnelId: string, variant: string, answers: Record<string, any>, completedAt: string }` |
| `funnel:abandoned` | `{ funnelId: string, variant: string, lastScreenId: string, partialAnswers: Record<string, any>, durationMs: number }` |

All events posted via `window.parent.postMessage({ type, payload }, "*")`. Host filters by `event.origin === "https://olive-funnels.app"` in production.

### Host → Iframe (events consumed by the funnel)

| Event | Payload shape | Effect |
|-------|---------------|--------|
| `user:auth` | `{ userId: string, token: string, email?: string, tier?: string }` | Funnel attaches token to subsequent submits, can pre-fill email gate. |
| `user:info` | `{ name?: string, locale?: string, segment?: string }` | Funnel may use for personalization tokens in copy. |
| `locale:set` | `{ locale: string }` | Switches funnel locale (re-fetches localized spec). |
| `theme:set` | `{ mode: "light"\|"dark" }` | Toggles theme override. |
| `navigation:back` | `{}` | Triggers BackButton programmatically. Used by Android hardware back button. |

Funnel listens via `window.addEventListener("message", handler)` and validates `event.origin` matches the host's allowlist.

## Native handler simulators

Each simulator card represents a real handler the iOS/Android app would mount. Clicking the "Simulate" button runs a mock implementation in-page that:
1. Reads the most recent matching event from the console log.
2. Logs a fake "native handler invoked" line.
3. Renders the mock response (StoreKit txn id, BillingClient launch ack, analytics event, etc.) in the card's response block.

This is purely for QA — production native handlers live in the iOS/Android codebases. The simulator's job is to let creators verify the funnel emits the right events with the right payloads before the app team wires up the real handlers.

## Implementation notes

- iframe `src` attribute updates on Load click (not on every keystroke).
- Console log capped at 200 rows (oldest evicted) to keep the DOM cheap.
- Filter chips are URL-state'd (`?filter=cta:clicked`) so a QA can deep-link a filtered view.
- Send-panel JSON is parsed with `JSON.parse` on send; parse errors highlight the textarea border red and show the error in the footer.
- Platform toggle persists in localStorage.
