# DECISIONS.md — Engineering decisions

This is the **engineering** log. The companion `design/DECISIONS.md`
captures product/visual decisions from the design handoff bundle (Linear-
style flat catalog, no auto-injected paywalls, etc.); this doc covers
the implementation choices that surround those decisions.

---

## 1. Quiz spec schema and rationale

The funnel spec is **a flat array of 31 typed primitives**, not a
quiz-shaped schema. Every node has the same outer shape — `{ kind:
string, props: object }` — and Zod schemas in `lib/catalog/schemas.ts`
constrain the props per `kind`. The full inventory: layout (`Screen`,
`Stack`, `Group`, `Spacer`, `Divider`), typography (`Heading`, `Body`,
`Eyebrow`, `Caption`), answer primitives (`ChoiceList`, `MultiChoice`,
`ImageChoiceGrid`, `ScalePicker`, `ShortText`, `LongText`, `EmailInput`,
`NumberInput`, `ToggleRow`), navigation (`PrimaryCTA`, `SecondaryCTA`,
`ProgressBar`, `BackButton`), result framing (`ResultBadge`,
`ResultHero`), commerce (`PriceCard`, `EmailGate`, `SocialProof`,
`Disclosure`), and decorative (`Avatar`, `IconBadge`, `PoweredFooter`).

We chose Generative UI over a fixed quiz schema because the surface
isn't *a quiz tool* — it's a generative funnel surface that happens to
be commonly used for quizzes. This is the **Superwall replacement
story**: the same catalog, the same renderer, and the same Studio chrome
mount a 5-question segmentation quiz, a single-screen paywall, an email-
capture lead-gen flow, or anything else the catalog can compose. A
fixed `Quiz { questions: [...], result: {...} }` schema would foreclose
on the paywall use case the moment we shipped it.

The flat-catalog choice (no `quiz` / `paywall` / `result` buckets) is
covered in `design/DECISIONS.md` #1 — composition is enforced by the
schema (which children which Screens accept), not by primitive
category, which keeps the LLM prompt simple ("here are 31 primitives,
pick what fits").

## 2. LLM choice and why

**Anthropic Claude.** Configurable via `OLIVE_LLM_MODEL` in
`.env.local`; default is `claude-opus-4-7`. The model id flows through
`lib/llm/client.ts` so the rest of the codebase stays model-agnostic —
swapping the env var is a one-line change for cost-sensitive
deployments.

We default to Opus for first-generation quality. Across the 9-prompt
regression suite (5 baseline + 4 Round-7 edge cases), Opus produces
**$0.252/quiz on average** with 100% structural validity, while Sonnet
4.6 produces **$0.046/quiz on average** with the same 100% validity.
Opus is **5.5× more expensive** for a margin in spec quality that's
hard to quantify in this take-home but which is most pronounced in the
"very-long" edge case — Opus produced a 9-screen spec that fully
covered the prompt's 7 explicit requirements; Sonnet matched that
breadth but tended to repeat the same option phrasing across questions.

For a creator surface where first-shot quality is the conversion
event (a low-effort UX promises "type a description, see a real
funnel"), Opus is the right default. The env-var override is the
cost lever for high-volume deployments. Both numbers above are
captured by the regression script's `pnpm test:gen` and reproducible.

## 3. Question type vocabulary — supported and excluded

**Supported question primitives:** `ChoiceList` (single-select),
`MultiChoice` (multi-select with min/max), `ImageChoiceGrid` (visual
single-select, 2 or 3 columns), `ScalePicker` (1–5 / 1–7 numeric scale),
`ShortText` (single-line), `LongText` (multi-line), `NumberInput`,
`ToggleRow` (yes/no), and `EmailInput`. Plus the gate-side `EmailGate`
which combines an email field with a CTA in one screen.

**Deliberately excluded:**
- **NPS (0–10 scale)** — `ScalePicker` already covers numeric scales
  with explicit min/max props; reintroducing NPS-as-its-own-primitive
  would just be a 0–10 ScalePicker with a different label. Better to
  let creators describe "0 to 10 NPS scale" in the prompt and have the
  LLM pick a `ScalePicker` with `min:0 max:10`.
- **Multi-step branching logic encoded in the spec** — there's no
  `Screen.next` field that conditionally points to different downstream
  screens. Reason: branching as data is hard to author and harder to
  audit; we prefer routing-as-variants (one funnel with N variants
  picked by `?utm_source=` or dwell-time) over inline conditional
  graphs. If a creator needs "TikTok users see this branch, IG users
  see that one," they author two variants, not a forking spec.
- **File uploads** — out of scope for the assessment surface; would
  require object storage, virus scanning, and per-funnel quotas.
- **Signature inputs** — niche enough that the LLM can fall back to a
  `LongText` with a name field, and shipping a real signature primitive
  would mean canvas + serialization + accessibility scope creep.

## 4. Scoring and results logic

**There is no scoring engine.** We don't compute a numeric score per
session and bucket users into result tiers. Instead, we let the LLM
**author the result screen(s) directly** — the spec contains the
result content the creator wants, and at runtime every completer
lands on whichever result screen the spec ends with.

For the dashboard's result-distribution donut, we use a heuristic:
the **first ChoiceList/MultiChoice/ImageChoiceGrid field** in the
variant's spec is the segmentation field, and we group completers by
their answer to it (see `app/api/funnels/[id]/analytics/route.ts`'s
`findSegmentationField`). This works because the kinds of quizzes
creators describe ("what kind of eater are you", "what's your fitness
goal") almost always carry the result signal in the first segmentation
question.

Why no scoring engine: weighted-sum scoring (each answer contributes
points across N dimensions, the highest dimension determines the
result) is the dominant pattern in commercial quiz tools, and it's
**incompatible with creator-authored content authority**. A scoring
engine forces creators to think in points rather than meaning, and the
LLM would have to invent the weighting schema for every prompt — a step
that adds cognitive load to the prompt and a source of unintended
divergence between what the creator asked for and what the engine
produces. Letting the LLM compose the result screen directly handles
persona-style results, score-band results ("you're at level 3 of 5"),
and recommendation results uniformly: the LLM picks the framing the
creator's prompt implies, and the runtime is content-agnostic.

The trade-off: we can't do "if score > 80, show result A; else show
result B" without variants. That's by design — see #3 above.

## 5. Edit loop approach

**Two edit modalities run side-by-side: inline form fields AND chat
refinement.** Per `design/DECISIONS.md` #6: "creators think
structurally (spec tree) and visually (preview), and forcing them to
pick one mode for editing slows them down."

Inline editing (`app/studio/[funnelId]/PrimitiveEditor.tsx`) renders
a Zod-derived form for the selected primitive — text fields for
`Heading.text`, an array editor for `ChoiceList.options`, a select
for `Screen.kind`. Edits apply optimistically to the local spec and
debounce-save via `lib/studio/saver.ts`.

Chat refinement (`app/studio/[funnelId]/ChatBar.tsx` + `lib/llm/refine.ts`)
takes a natural-language instruction ("rename the first question",
"add an option for vegetarian") and asks Claude to emit a JSON Patch
against the current spec. The diff card shows a 3-line human summary
(per `design/DECISIONS.md` #5 — "summary first, not full-spec"), not
the raw RFC 6902 patch.

The two paths share one source of truth (the local `spec` state) and
one persistence layer (`saver.ts`'s `schedule(variantId, patch)`),
so a creator can flip between modalities mid-edit without losing
work.

## 6. Prompt reliability — validation, retries, fallbacks

Three layers, in order of when they run:

1. **Schema validation.** Every generated spec is fed through
   `SpecSchema.safeParse` from `lib/api/specSchema.ts`. The schema
   recursively validates each node's `kind` against the catalog
   registry and the props against the corresponding Zod schema. A
   single unknown `kind` (e.g. the LLM hallucinating `ProgressDots`)
   surfaces as a structured `SpecIssue { path, message }`.

2. **One-shot retry with errors fed back.** `lib/llm/generate.ts`
   wraps the call in attempt 1 → retry. On validation failure, it
   builds a retry message containing the previous attempt's text **plus
   the issue list**, so attempt 2 sees what went wrong and corrects.
   The retry message construction lives in
   `lib/llm/prompts.ts:buildRetryMessage`.

3. **Persistence gate.** `app/api/generate/route.ts:45` is the gate —
   `if (!result.ok)` returns the structured error to the client and
   never persists the invalid spec. The Studio handles this gracefully
   (the streaming filmstrip shows a retry-in-progress badge, then a
   "couldn't generate — try a different prompt" message if both
   attempts fail). No partially-valid specs ever land in Supabase.

Empirically, on the 9-prompt regression baseline, **all 9 prompts
produce valid specs on the first attempt** (Opus 4.7) — see the
"PASS 1 SUMMARY" output of `pnpm test:gen`. The retry path is exercised
by a deterministic test (`OLIVE_TEST_FORCE_INVALID_FIRST=1`) which
forces attempt 1 to return a synthetic invalid spec; the test asserts
that (a) a `validation_error` event is emitted with detailed issues,
(b) attempt 2 hits the LLM with those issues fed back, (c) attempt 2
recovers with a valid spec, and (d) the stream emits a clean structured
final event with no crash. The retry-path test is in
`scripts/test-generation.ts:runRetryPathTest()` and asserts six
properties; all six pass on the current baseline.

## 7. Data model for responses

Four tables in Supabase, FK-linked top-down:

```
funnels
  id, title, description, status (draft | published), created_at, updated_at

variants
  id, funnel_id → funnels, name, spec (JSONB), routing_rules (JSONB),
  created_at, updated_at

sessions
  id, funnel_id → funnels, variant_id → variants,
  source (utm_source, nullable), started_at, completed_at,
  abandoned_at, total_dwell_ms, cta_clicked

responses
  id, session_id → sessions, screen_id, screen_index,
  answer (JSONB), dwell_ms, submitted_at
```

Three things to call out:

**Variants as routing targets.** A funnel has N variants (1–4); each
variant carries its own `spec` and `routing_rules`. At request time the
resolver in `lib/api/routing.ts:resolveVariant` picks one based on
`?utm_source=` and an optional dwell threshold. This makes variants
**siblings, not children** of a "primary" funnel — see
`design/DECISIONS.md` #4 for why the Studio surfaces them as tabs, not
a sidebar.

**JSONB for spec/answer/routing_rules.** All three are open-ended
and read-mostly. Storing them as JSONB lets us evolve the catalog
without migrations and lets the LLM's output land in the row
unchanged. Trade-off: we can't index across answer fields, but the
analytics endpoint groups in-memory, and `responses` are queried by
`session_id` (which IS indexed). Once response volume grows, the
right move is a materialized view that flattens hot fields, not a
column-per-question schema.

**Sessions, not "completions".** We persist a session row at *start*,
not on completion — that's how we count abandonment and drop-off. The
public funnel page POSTs to `/api/sessions` on first iframe mount and
stamps `completed_at` (or `abandoned_at`) on the appropriate
event. The dashboard's drop-off chart reads `responses` to figure out
how far each session got.

## 8. Cost per generation

Real numbers from `pnpm test:gen` against the 9-prompt regression
suite (5 baseline + 4 edge cases), measured 2026-04-28 with the
Round-7 system prompt that includes the terminal-screen rule + the
personality-quiz few-shot example:

| Prompt                  | Opus 4.7 cost | Sonnet 4.6 cost | Output tokens (Opus) |
|-------------------------|---------------|-----------------|----------------------|
| eater-quiz              | $0.3428       | ~$0.062         | 2,650                |
| lead-gen                | $0.3333       | ~$0.060         | 2,540                |
| paywall                 | $0.2066       | ~$0.038         | ~880                 |
| onboarding              | $0.3207       | ~$0.058         | 2,229                |
| feedback                | $0.2208       | ~$0.040         | 898                  |
| very-short              | $0.2789       | ~$0.051         | 1,672                |
| very-long               | $0.4069       | ~$0.074         | 3,343                |
| paywall-only-no-quiz    | $0.2224       | ~$0.041         | 911                  |
| quiz-no-paywall         | $0.3131       | ~$0.057         | 2,119                |
| **Total (9 prompts)**   | **$2.6455**   | **~$0.481**     |                      |
| **Per-quiz average**    | **$0.294**    | **~$0.053**     |                      |

Input tokens are roughly constant (~10,300 per call now — the new
prompt added the terminal-screen rule + a fourth few-shot example
covering the personality-quiz pattern, taking the system message from
~7,500 to ~10,300 tokens). Output tokens scale with spec size; quizzes
that previously ended on a question now include a result screen, so
output averages are slightly higher.

The increase from $0.252/quiz (pre-Round-7-fix) to $0.294/quiz is
$0.042/quiz — the cost of generating a working funnel rather than a
broken one. Sonnet's average rose proportionally (~$0.046 → ~$0.053).
The retry path adds one extra LLM round-trip when it fires; baseline
first-attempt success rate remains 9/9 across both models.

## 9. What I'd do differently with more time

- **Real auth and per-creator scoping.** Right now any visitor can
  read or edit any funnel. Adding Supabase Auth (anon → magic-link
  email) and RLS policies (`creator_id` column on `funnels`,
  `auth.uid() = creator_id` policy) is the obvious next step. This
  was deferred because the assessment doesn't ship a multi-tenant
  hosting story, but it's the first thing I'd add for a real
  deployment.

- **Better dwell-time analytics.** Today the dashboard reports
  median dwell per screen and a single threshold-based dwell helper
  trigger. With more time, I'd add mean + p50 + p90 per screen, plus
  a session-replay-lite that overlays each session's dwell pattern
  against the median (creators want to see *why* people are slow on
  question 3, not just that they are).

- **A/B testing framework.** The dashboard's "Winning" tag in the
  comparison table is a naive max-rate selector. A real implementation
  would use Bayesian probability of being best, or sequential testing
  with confidence intervals — and explicitly surface "not enough data
  yet" rather than silently picking the first variant when both have
  6 starts each. I sized this out in my head and decided it was the
  weakest part of the dashboard for the time available.

- **React Native shell.** `@json-render/react-native` is in our
  dependency tree's neighbor packages — the catalog primitives could
  in theory render natively. We didn't build a native shell because
  the assessment's scope is the web + webview-harness story. Shipping
  a real RN shell would replace the iframe-based webview test
  (`design/DECISIONS.md` #11) with the actual native bridge.

- **Playwright tests for the Studio.** Type-checking and the LLM
  regression suite cover the layers I can test cheaply. The Studio's
  state transitions (empty → generating → all-screens → published) are
  end-to-end paths that would benefit from screenshot-based regression
  tests. I left this out because the harness wasn't on the rubric, but
  it's where I'd invest first if I was inheriting this repo.

- **Smarter spec diffing for chat refinement.** The current diff card
  shows a human summary, but the underlying patch is computed by Claude.
  When the LLM emits a patch that doesn't quite match the user's
  intent, the creator's only recovery is "Undo and try again." A real
  refinement loop would diff the new spec against the old one
  programmatically (myers/structural diff over the catalog tree), so
  the human summary is grounded in a real diff and the apply step is
  deterministic.

- **Per-primitive runtime tests.** During final QA I discovered
  EmailGate's button wasn't wired to `runtime.onCTA` — the visual
  catalog tests in Round 2 only mounted each primitive in Studio
  (no runtime context) and confirmed it rendered, never that its CTA
  fired or its field setter updated state. Four other primitives had
  the same gap: `ImageChoiceGrid`, `ToggleRow`, `NumberInput`, and
  `LongText` all rendered fine but never bound their values to
  `useFunnelField`, so end-user answers vanished. Each was a one-line
  fix once spotted, but the entire class of bug would have been caught
  by tests that mount each primitive inside `<FunnelRuntimeProvider>`
  and assert that (a) interacting with it calls `setField` with the
  expected key/value, and (b) any embedded buttons call `runtime.onCTA`.
  With more time, I'd write that suite — one `expect(setField).toHaveBeenCalledWith(...)`
  per interactive primitive — before any other UI work.

- **System-prompt evolution.** I initially assumed the LLM would intuit
  terminal reveal screens from the catalog descriptions and the
  presence of `kind: "result"` on `Screen`. It did for some prompts
  (the recommendation-style "lead-gen quiz" produced a result every
  time) but not consistently — the eater-quiz prompt produced 6
  question screens with a "See my eater type" CTA pointing at nothing.
  The fix was three things together: an explicit "quizzes that promise
  a result MUST end with a result Screen" rule, a per-quiz-type
  taxonomy (personality / score-based / recommendation / lead-gen /
  survey), and a few-shot example showing the segmentation-question →
  reveal-screen pattern. The lesson: catalog descriptions tell the LLM
  what each primitive *does*; they don't tell it what *combinations*
  are mandatory. Composition rules — especially negative ones ("never
  end on a question whose CTA implies a reveal") — need their own
  section in the prompt, with a few-shot per case.

---

## Appendix: smaller engineering notes

### A.1 CheckoutOverlay — visual chrome, not a handoff

The translucent overlay that appears when a final-screen
`action="external"` CTA is tapped is intentionally a UI affordance only.
By the time it mounts, `FunnelPlayer.onCTA` has already:

  1. emitted `cta:clicked` and `funnel:completed` postMessage events,
  2. POSTed the `cta_clicked` server event, and
  3. scheduled `window.location.assign(href)` on a ~900ms timer.

We don't put the navigation inside the overlay component because the
real handoff in production is the iOS/Android native handler reading
`cta:clicked` from the webview bridge — the overlay is just the
"something happened" feedback users see for the brief window between the
click landing and the new context (StoreKit, browser, etc.) taking
over. Coupling navigation to the overlay would make it harder to swap
in the real handler without touching presentation code.

The overlay also mirrors the event trail (`cta:clicked ✓`,
`funnel:completed ✓`, `checkout → href …`) deliberately. It's a debugging
affordance: a QA running the funnel inside the webview harness can
visually correlate what they're seeing on the screen with what's
landing in the postMessage console on the right.

Per `design/DECISIONS.md` #2 we never inject a thank-you screen the
creator didn't author, and per `design/PUBLIC_FUNNEL.md` "Completion
behavior" the CTA stays tappable on the final spec-defined screen — so
the overlay must be transient, not a destination.

### A.2 FunnelRoot bridge — why a one-element json-render spec

`lib/catalog/funnelRenderer.tsx` defines a single-element
`@json-render/react` spec whose root is `FunnelRoot`, a thin adapter
that delegates to our recursive `renderNode`. We could have authored
the catalog as a true json-render spec (one element per node, children
referenced by key), but the LLM-facing format in `design/CATALOG.md` is
a **nested children-in-props** structure (`Screen.body[]`,
`Group.children[]`), not a flat `elements{}` map.

The bridge keeps both halves happy: the LLM emits the nested format it
finds easiest to author and audit (no element-id bookkeeping), and we
still get to mount the spec inside `@json-render/react`'s `Renderer` so
all the future affordances of the json-render runtime (state binding,
validation contexts, RepeatChildren) are available when we want them
without rewriting the catalog. The cost is one component (`FunnelRoot`)
that recursively walks the nested format itself rather than handing
each level back to json-render — a small price for prompt clarity.
