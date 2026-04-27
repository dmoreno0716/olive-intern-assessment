<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Olive Quiz Funnel Studio

## What this is
A take-home assessment building a generative quiz funnel builder for Olive 
(a food/nutrition company). Non-technical creators type a description, an LLM 
generates a multi-screen funnel as Generative UI, the creator previews/edits/
deploys it, and end users take it on the web or via webview in the Olive 
mobile app.

## The architecture in one paragraph
Built on `vercel-labs/json-render`. We define a catalog of typed component 
primitives. The LLM (Claude) generates JSON specs from natural-language prompts, 
constrained by the catalog. Specs are stored in Supabase. The renderer resolves 
specs to React using our registry. Same catalog renders in three contexts: the 
public funnel URL, the Studio preview iframe, and a webview test harness. 
Funnels have N variants; routing picks one based on `?utm_source=` and dwell-
time. The dashboard shows per-variant performance.

## Critical: read these before doing anything
- `design/README.md` — bundle overview and suggested build order
- `design/TOKENS.md` — visual tokens, drop into globals.css
- `design/CATALOG.md` — the 31 primitives with Zod schemas (THE most 
  important spec doc)
- `design/DECISIONS.md` — design rationale, do not re-litigate these choices
- `design/SHARED_CHROME.md`, `STUDIO.md`, `DASHBOARD.md`, `PUBLIC_FUNNEL.md`, 
  `WEBVIEW_HARNESS.md` — surface specs
- `design/designs/*.html` — visual references; recreate these in our stack, 
  don't copy code from them directly

## Stack (locked, don't change)
- Next.js 16 (App Router) + TypeScript + Tailwind v4
- shadcn/ui (already initialized)
- `@json-render/core`, `@json-render/react`, `@json-render/shadcn` — 
  Generative UI architecture
- Zod for catalog props validation
- Supabase (local) for persistence
- `@anthropic-ai/sdk` for LLM calls — use Claude

## Conventions
- Catalog primitives live in `lib/catalog/components/<n>.tsx` with paired 
  Zod schemas
- Catalog registered in `lib/catalog/index.ts` via `defineCatalog`
- Names are PascalCase, stable, become the catalog `kind` keys
- Funnel-mode CSS scope: `.funnel` class on container; Studio mode is the 
  default
- Prompts to the LLM live in `prompts/` directory
- `DECISIONS.md` (at repo root, separate from `design/DECISIONS.md`) tracks 
  engineering decisions

## What we're NOT doing
- No auto-injected paywalls or thank-you screens. The LLM generates exactly 
  what the creator asked for. (See `design/DECISIONS.md` #2.)
- No drag-and-drop visual editor. Editing happens via inline form fields + 
  natural-language chat refinement.
- No real Stripe checkout. CTA clicks log intent, that's the conversion event.
- No mascot, no Olive product photos, no scenic illustrations. Visual grammar 
  only.

## Repo entry points
- Starter scaffold uses Next.js 16 App Router, Tailwind v4, shadcn already 
  initialized, Supabase local stack
- Run: `pnpm dev` for the app, `pnpm supabase start` for local DB
- Studio at http://localhost:3000, Supabase studio at http://127.0.0.1:54323