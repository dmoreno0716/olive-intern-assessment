# DECISIONS.md — Design rationale

Non-obvious tradeoffs documented so they don't get re-litigated.

## 1. Flat catalog, not categorized
The catalog is one flat list of 31 primitives, not split into "quiz" / "paywall" / "result" buckets. Reason: creators describe outcomes ("I want a 3-question intake then a paywall"), and the LLM picks primitives — categorization adds a layer the LLM doesn't need and makes composition rules harder to express. Composition is enforced by which Screens primitives can live inside, not by primitive category.

## 2. The system never auto-appends a paywall or thank-you
When the LLM generates a funnel, we don't inject anything the creator didn't ask for. If a creator says "build a quiz that segments my audience", they get a quiz that ends on the result screen — no paywall, no thank-you. If they want a paywall, they say so and the LLM emits a `kind="gate"` Screen. Reason: auto-injection is paternalistic and conflicts with the creator's content authority. The CTA tap on the final screen is the conversion event regardless.

## 3. Two visual modes, one token base
Studio (creator tools) uses cool neutrals + dense type; Funnel (end-user) uses warm cream + Instrument Serif italic. Both pull from the same root tokens — they just pick different stops and different fonts. Reason: a creator tool that visually matches the funnel it produces undermines the "this is a real product I'm building" feeling. Studio should feel like an editor (Linear, Figma); funnel should feel like a polished consumer surface.

## 4. Variant management is tabs, not sidebar
Variants A/B/C/D live in top-bar tabs, not a left-rail variant list. Reason: variants are siblings (same intent, different copy/structure), not a parent-child hierarchy. Tabs make switching a 1-click action and visually reinforce that you're toggling between equals. A sidebar would imply variants are documents/files, which they aren't.

## 5. Chat refinement diff is summary-first, not full-spec
When Claude proposes a spec change in the right pane, the diff card shows a 3-line human summary ("Renamed X", "Added option Y", "Removed Z") with affected screen-id tags — not a JSON diff. Reason: creators don't read JSON. The full spec patch is still applied on Apply; we just present the meaning, not the mechanics.

## 6. Inline edits live in BOTH the spec tree and the preview iframe
Clicking text in either pane opens the same inline editor. Reason: creators think about content in two ways — structurally (spec tree) and visually (preview). Forcing them to pick one mode for editing slows them down.

## 7. Funnel mode CTAs use 18px radius, a literal not a token
18px is between `--r-lg` (16) and `--r-xl` (22) — deliberately non-token. Reason: the friendly-rounded CTA shape is a recognition cue specific to the conversion button. Promoting it to a token would let it leak into other surfaces and dilute the affordance. Keeping it inline signals "this size is sacred here, nowhere else."

## 8. Public funnel desktop = letterboxed mobile, not responsive layout
On desktop, we frame the same 480px mobile column as a card on a radial wash, not redesign the page wider. Reason: funnels are mobile-native content. A "responsive desktop" version would inherit web design tropes (sidebars, hero bands, multi-column) that fight the linear question-answer rhythm. Letterboxing keeps the design integrity.

## 9. PoweredFooter is auto-rendered, not a spec node
The "Powered by Olive" mark renders automatically as the last child of every Screen. It's NOT a catalog component creators include in spec. Reason: it's a platform tracker, not creator content; creators can suppress it via funnel-level config (`hidePoweredFooter`) but can't position it. Treating it as a spec node would imply they own it.

## 10. Dwell-time-slow shows helper content vs. switching variants
On screens with high median dwell (creator-defined threshold or auto-detected), the system shows an inline helper hint ("Tip: pick the option that fits most days") rather than swapping to a different variant of the question. Reason: variant-switching mid-session is jarring and breaks the answer-capture contract; an in-place hint preserves continuity. (This is funnel-mode runtime behavior, not a Studio feature.)

## 11. Webview test harness is iframe-based, not Expo or simulator
QA loads the funnel into a real iframe inside a phone-shell DIV instead of running a real iOS simulator or Expo Go. Reason: the harness is for verifying postMessage protocol behavior + visual rendering, not native APIs. Iframe gives sub-second iteration; a real simulator would be 30-60s per cycle. The native simulators panel covers the native-handler-side mocking.

## 12. Result distribution donut is conditional
The donut only renders if the funnel has a result Screen. Reason: not every funnel is a quiz — some are pure paywalls or signup flows. A "no results to distribute" empty state would be noise. Conditional rendering keeps the dashboard's semantics tight.

## 13. Per-source URLs use UTM, not separate funnel IDs
TikTok / IG / FB / Direct links all point at the same funnel id with `?utm_source=` query params. Reason: separate funnel ids would fork analytics into 4 buckets and break the "one funnel, multiple channels" mental model. UTM is industry-standard and trivially parsed server-side for the source breakdown chart.

## 14. Studio top bar uses italic Instrument Serif for the funnel name
Even in Studio mode (which is otherwise sans-only), the funnel name is italic serif. Reason: it's the creator's content title — italicizing it visually separates "the funnel I'm working on" from "the tool chrome around it". Tool chrome stays neutral; creator content gets the brand font.

## 15. Generating state shows a streaming filmstrip, not a spinner
While Claude streams the spec, we render placeholder phone frames horizontally and snap each into the real screen as its sub-spec arrives. Reason: a generic spinner makes a 6–10s wait feel longer; showing the funnel materializing in real time turns the wait into an "ooh look at it building" moment.
