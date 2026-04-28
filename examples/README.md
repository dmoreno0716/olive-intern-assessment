# Examples

Three example funnels covering the three archetypes the system is meant
to handle: a pure quiz, a lead-gen quiz with email + result, and a
non-quiz paywall. Each subdirectory contains:

```
<n>-<name>/
├── prompt.txt        Natural-language input the creator typed
├── spec.json         Generated spec (extracted from a real Opus run)
├── live-url.txt      Public funnel + Studio + Dashboard URLs
├── dashboard.png     Screenshot of the dashboard with seeded responses
└── README.md         What this funnel demonstrates
```

## Reproducing locally

```sh
pnpm install
pnpm supabase start
pnpm dev
pnpm seed:examples       # creates the 3 funnels + ~10 fake sessions each
```

Funnel IDs are stable across reseeds (see `scripts/seed-examples.ts`),
so the URLs in `live-url.txt` always resolve to the same data.

## Capturing the dashboard screenshots

The repo doesn't ship a headless-browser tool, so `dashboard.png` is
captured manually after seeding:

1. Run `pnpm seed:examples` to populate the 3 funnels.
2. Open each `dashboard.png` URL listed in the example's `live-url.txt`.
3. Take a full-page screenshot (Cmd-Shift-4 then Space, or DevTools
   "Capture full size screenshot").
4. Save as `examples/<n>-<name>/dashboard.png`.

The seed script picks varied sources, completion rates, and answers so
the dashboard renders the source-breakdown bars, drop-off chart, and
result donut (where applicable) with non-trivial data.

## Why these three

| #  | Funnel               | Demonstrates                                                              |
|----|----------------------|---------------------------------------------------------------------------|
| 01 | Eater quiz           | Pure segmentation — no email, no paywall, no result. Dashboard hides the donut. |
| 02 | Lead-gen quiz        | Full pattern — quiz → email gate → result. Result donut + Top Result card. |
| 03 | Paywall only         | Non-quiz funnel. Same catalog, one screen. Drop-off chart collapses to `Started → CTA`. |

See `prompt.txt` in each subdirectory for the exact input the LLM saw.
