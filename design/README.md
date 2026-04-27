# Handoff: Olive Quiz Funnel Studio

## Overview

The Olive Quiz Funnel Studio is a tool for non-technical creators to generate
quiz/survey-style conversion funnels via natural-language prompts to Claude.
A creator types "make me a 6-screen quiz that segments my audience into three
mindfulness protocols and pitches a 14-day program" — Studio generates a JSON
spec, renders a live preview funnel, lets the creator iterate via chat, and
publishes to a public URL (`olive-funnels.app/f/:funnelId`) plus an embedded
webview surface used inside Olive's mobile app.

The platform has **two visual modes**:

- **Studio mode** — high-density creator tooling. Cool neutral grays, dense
  monospace data, sharp borders, business-app feel. Used for the Studio,
  Dashboard, and Webview Test Harness.
- **Funnel mode** — what end users see. Warm cream + olive greens, generous
  spacing, italic serif display type, friendly-rounded CTAs, mobile-first.
  Used for every funnel screen rendered to a real visitor.

Both modes share the same token base — they just pick different stops from
the palette and different fonts from the same family set.

## About the design files

The HTML files in `designs/` are **design references** — high-fidelity
prototypes built in plain React + JSX showing the intended look, layout,
states, and interactions. They are NOT production code to copy directly.

Your job is to **recreate these designs in the target stack**:

- Next.js 16, App Router, TypeScript, Tailwind v4
- shadcn/ui (already initialized)
- `@json-render/core`, `@json-render/react`, `@json-render/shadcn` for the
  generative-UI catalog architecture
- Zod for catalog prop validation
- Supabase for persistence
- Anthropic SDK for spec generation

The catalog primitives must be registered with `defineCatalog` from
`@json-render/core` — that is the single most important integration in the
build. Everything else is conventional Next.js + shadcn work.

## Fidelity

**High-fidelity.** Every color, type ramp, spacing value, radius, shadow,
and motion timing in the prototypes is final. Recreate pixel-perfectly using
shadcn primitives styled with the tokens defined in `TOKENS.md`. Where shadcn
components don't naturally fit (e.g. the Studio's three-pane resizable
shell, the funnel-mode answer chips with their custom selected ring), build
custom components but match the prototypes exactly.

## What's in this bundle

```
design_handoff_olive_quiz_funnel/
├── README.md                  ← this file
├── TOKENS.md                  ← colors, type, spacing, radius, shadow, motion + globals.css block
├── CATALOG.md                 ← all 31 primitives, prop shapes, composition rules, 4 example specs
├── SHARED_CHROME.md           ← screen anatomy, inter-screen motion, CTA placement
├── STUDIO.md                  ← creator-surface specs (4 states + tablet variant)
├── DASHBOARD.md               ← analytics-surface specs (populated, empty, mobile)
├── PUBLIC_FUNNEL.md           ← public funnel page specs (states, framing, completion)
├── WEBVIEW_HARNESS.md         ← test-harness layout + full postMessage protocol
├── DECISIONS.md               ← rationale notes for non-obvious tradeoffs
└── designs/
    ├── 01_Tokens.html         ← visual system reference
    ├── 02_Catalog.html        ← all primitives w/ states, anatomy, 4 example compositions
    ├── 03_Studio.html         ← creator surface, 4 states + tablet
    ├── 04_Dashboard.html      ← analytics surface, populated + empty + mobile
    └── 05_Public_Harness.html ← public funnel page + webview test harness
```

## Suggested implementation order

1. **Tokens first.** Paste `TOKENS.md`'s globals.css block into
   `app/globals.css`, set up Tailwind v4 config from the same file. Verify
   the two modes render correctly with a smoke test page.
2. **Catalog second.** Build the 31 primitives in `CATALOG.md` as
   thin wrappers around shadcn where applicable, custom React components
   where not. Register with `defineCatalog`. Get the 4 example specs in
   `CATALOG.md` rendering identically to `designs/02_Catalog.html`.
3. **Public funnel page third.** This is the simplest surface and exercises
   the catalog end-to-end. See `PUBLIC_FUNNEL.md`.
4. **Studio fourth.** The biggest surface but mostly conventional shadcn
   composition once the catalog is live. See `STUDIO.md`.
5. **Dashboard fifth.** Charts can be Recharts or hand-rolled SVG — see
   `DASHBOARD.md` for spec.
6. **Webview Test Harness last.** Internal tool, lowest priority. See
   `WEBVIEW_HARNESS.md`.

## Design rationale

`DECISIONS.md` documents non-obvious tradeoffs (e.g. why the catalog is flat
instead of categorized; why Studio never auto-appends a paywall). Read it
before starting — it will save you from re-litigating choices.

## Brand notes

The "Olive" name and visual grammar (warm cream, olive greens, friendly
rounded CTAs, italic serif display) are this product's own — they are
inspired by but do NOT recreate any other company's IP. The token block
in `TOKENS.md` is the source of truth.
