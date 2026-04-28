# Recording script — 2-3 minute Loom

The brief asks for a screen recording covering the end-to-end flow.
Target length: **2:30**. Speak the bracketed callouts; let the screen
do the rest.

## Setup before recording

```sh
pnpm supabase start
pnpm seed:examples       # gives the dashboard data to show
pnpm dev                 # runs on :3000
```

Open three tabs in advance so you don't have to type URLs on camera:

1. `http://localhost:3000/studio` (empty Studio for the live generation)
2. `http://localhost:3000/dashboard/00000000-0000-4000-8000-0000000e2001` (lead-gen dashboard, has the donut)
3. `http://localhost:3000/webview-test` (harness, will fill the URL during the demo)

## Beats (target 2:30 total)

### 0:00 — 0:25 · Type a prompt, watch generation [25s]

- **Tab 1**, the empty Studio.
- "I'll type a description and let the LLM generate a real funnel."
- Type: **`a 4-question quiz that recommends a meal plan, with email capture`**.
- Hit generate.
- "The placeholder phone frames snap in as Claude streams the spec —
  this is real-time generation, not a fade." (per `design/DECISIONS.md`
  #15)

### 0:25 — 0:55 · Edit a question inline [30s]

- The Studio lands on the workbench.
- Click on the first question's heading text in the spec tree (or the
  preview).
- Inline-edit it: change a word.
- "Edits debounce-save; the badge top-right tracks save state."
- Click an option in the ChoiceList, change its label.
- "Edits are inline, not a JSON modal — this is the spec-tree mode."

### 0:55 — 1:25 · Refine via chat [30s]

- Open the chat bar.
- Type: **`add an option for vegetarian`**.
- "Claude proposes a patch — the diff card shows a 3-line summary, not
  the JSON." (per `design/DECISIONS.md` #5)
- Click Apply.
- "The new option lands in the preview live."

### 1:25 — 1:50 · Publish, take the funnel [25s]

- Click Publish.
- Modal pops with the share URL + per-source UTM URLs + QR.
- Copy the share URL.
- Click "Continue editing", then open a new tab with that URL.
- "This is the public funnel — what an end user sees."
- Click through the questions. Hit the final CTA.

### 1:50 — 2:30 · Dashboard + harness [40s]

- Switch to **Tab 2** (the lead-gen dashboard with seeded data).
- "This is the dashboard for one of the seeded examples. Variant tabs
  up top. Stat cards: started, completed, CTA Intent, Top Result."
- Scroll past source breakdown → drop-off chart → result donut.
- "The donut groups completers by their first ChoiceList answer — the
  segmentation field. Click a slice to filter the responses table."
- Click a slice. Briefly show the table filter.
- Switch to **Tab 3** (webview harness).
- Paste the funnel URL you published in beat 4. Hit Load.
- "The harness mounts the funnel inside an iframe in a phone shell.
  postMessage events stream into the console on the right — every
  screen render, every answer, every CTA click."
- Walk through one screen so an event lands. Pause briefly on the
  console.
- Wrap: "Same catalog renders in three places — Studio preview, public
  funnel, and webview harness. That's the architecture."

## Backup beats if you finish early

- Show the comparison table in the All-variants tab (variant A is
  marked "Winning").
- Show the empty-state dashboard (`/dashboard/<some-funnel-with-no-responses>`).
- Show the catalog page (`/catalog`) for visual scope.

## What NOT to demo

- The seed scripts. They're plumbing.
- The full DECISIONS.md. Mention it exists; don't read it.
- Cost numbers. They're in DECISIONS.md and the README.
- The webview harness's "Send to funnel" panel — postMessage receive is
  the demo, send is QA-internal.
