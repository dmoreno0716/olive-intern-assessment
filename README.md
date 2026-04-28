# Olive Quiz Funnel Studio

Generative quiz funnel builder for Olive. Non-technical creators type a
description, an LLM generates a multi-screen funnel as Generative UI,
the creator previews/edits/deploys it, and end users take it on the web
or via webview in the Olive mobile app.

The architecture is documented in `AGENTS.md`. The product/visual
decisions are in `design/DECISIONS.md`. The engineering decisions are in
`DECISIONS.md` (root). Three example funnels with prompts, specs, and
URLs are under `examples/`.

---

## Stack

- **Next.js 16** (App Router) + **TypeScript** + **Tailwind v4**
- **shadcn/ui** + **lucide-react** + **Recharts** (themed via tokens, not defaults)
- **`@json-render/core` / `react` / `shadcn`** for the Generative UI runtime
- **Zod** for catalog props validation
- **Supabase** (local) for funnels / variants / sessions / responses
- **`@anthropic-ai/sdk`** with **Claude Opus 4.7** by default — overridable

---

## Prerequisites

- **Node 20+**
- **pnpm** (`corepack enable`)
- **Docker** (Supabase local dev)
- **Supabase CLI** — `brew install supabase/tap/supabase` on macOS

---

## Setup

```bash
# 1. Install deps
pnpm install

# 2. Configure env — at minimum set ANTHROPIC_API_KEY
cp .env.example .env.local
# Edit .env.local:
#   ANTHROPIC_API_KEY=sk-ant-...           (required)
#   OLIVE_LLM_MODEL=claude-opus-4-7        (optional, defaults to Opus)
#   NEXT_PUBLIC_APP_URL=http://localhost:3000

# 3. Start Supabase
pnpm supabase start
# Paste the printed anon key + service-role key into .env.local

# 4. Seed a baseline demo funnel + the 3 example funnels
pnpm seed                  # one "Slow Burn" demo funnel with stable id
pnpm seed:examples         # 3 examples + ~10 fake sessions each

# 5. Run the app
pnpm dev
```

Open http://localhost:3000. Supabase Studio is at http://127.0.0.1:54323.

---

## Surfaces

| URL                                    | What's there                                                  |
|----------------------------------------|---------------------------------------------------------------|
| `/studio`                              | Empty Studio — type a prompt, watch generation, get a funnel  |
| `/studio/<funnelId>`                   | Studio workbench — preview iframe + spec tree + chat refine   |
| `/dashboard/<funnelId>`                | Analytics dashboard — variants, source breakdown, drop-off, donut, responses |
| `/f/<funnelId>`                        | Public funnel — what end users see                            |
| `/f/<funnelId>?utm_source=tiktok`      | Same funnel, sourced — variant resolver picks based on source |
| `/webview-test?url=<funnel-url>`       | Webview test harness — postMessage console + device shells    |
| `/catalog`                             | Visual catalog of all 31 primitives (engineer-facing)         |

---

## Common tasks

```bash
# Generate the 3 example funnels (data for the Loom and dashboard screenshots)
pnpm seed:examples

# Regression-test the LLM (9 prompts + retry path, ~$2.30 on Opus / $0.42 on Sonnet)
pnpm test:gen

# Same on Sonnet for cost comparison
OLIVE_LLM_MODEL=claude-sonnet-4-6 pnpm test:gen

# Force the retry path with a synthetic invalid first attempt
OLIVE_TEST_FORCE_INVALID_FIRST=1 pnpm test:gen --skip-happy

# Type-check (fast, no build)
pnpm exec tsc --noEmit

# Production build
pnpm build

# Seed fake responses against an existing funnel
pnpm tsx scripts/seed-example-responses.ts <funnel_id> [count]
```

---

## Webview harness

The webview test harness at `/webview-test` mounts any funnel URL inside
an iframe wrapped in a phone-shell DIV and shows the full postMessage
protocol both ways. A successful play-through fires:

```
funnel:loaded → screen:shown → screen:completed + answer:submitted
              → … → cta:clicked → funnel:completed
```

`funnel:abandoned` only fires on browser pagehide — to capture one,
load a funnel, advance a screen or two, and reload the iframe.

The Studio's published-modal "Open in webview test harness" deep-link
pre-fills the URL and auto-loads.

---

## Database

Four tables: `funnels → variants → sessions → responses`. Spec, answer,
and routing-rule columns are JSONB so the LLM's nested catalog format
lands unchanged. Migrations are auto-generated from the declarative
schemas in `supabase/schemas/`.

```bash
# Reset local DB to declarative schema state
pnpm supabase db reset

# Generate a migration from a schema change
pnpm supabase db diff -f <name>
```

---

## Project layout

```
app/
├── api/funnels/[id]/{analytics,export,publish,resolve}/  # Funnel APIs
├── api/sessions/                                          # Session lifecycle
├── api/generate/, api/variants/[id]/refine/              # LLM endpoints
├── dashboard/[funnelId]/                                  # Analytics dashboard
├── f/[funnelId]/                                          # Public funnel page
├── studio/[funnelId]/                                     # Studio workbench
└── webview-test/                                          # QA harness

lib/
├── catalog/        # 31 primitives + Zod schemas + registry + renderer
├── llm/            # Claude client, prompts, generate + refine, validation
├── api/            # SpecSchema, routing resolver, JSON helpers
├── studio/         # Spec ops, debounced saver, SSE stream parser
└── funnel/         # Runtime context, postMessage protocol, dwell helper

prompts/            # System / user-template / refine-system (committed)
design/             # Bundle from product team — read-only reference
examples/           # 3 example funnels with prompts + specs + URLs
scripts/            # seed, seed:examples, test-generation
supabase/           # Declarative schemas + auto-generated migrations
```

---

## Documentation

- **`AGENTS.md`** — codebase overview and engineering conventions
- **`DECISIONS.md`** — engineering decisions (LLM choice, schema, scoring, retries, cost)
- **`design/DECISIONS.md`** — product/visual decisions (handoff bundle)
- **`design/CATALOG.md`** — catalog primitives spec
- **`examples/README.md`** — example funnels + how to capture screenshots
- **`prompts/`** — system/user/refine prompts the LLM sees
