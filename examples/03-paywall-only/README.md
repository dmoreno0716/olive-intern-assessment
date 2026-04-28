# 03 — Paywall Only

A single-screen funnel: no questions, no result. Just the headline,
three plan tiers (PriceCard primitives), and a primary CTA. The prompt
explicitly forbade quiz screens, and the LLM honored it — this is the
test for `design/DECISIONS.md` #2 ("the system never auto-injects a
quiz the creator didn't ask for") in the wild.

This example demonstrates:

1. Generative UI is not just for quizzes. The same catalog primitives
   that build a multi-screen segmentation flow build a one-screen
   paywall — that's the Superwall-replacement story from
   `design/DECISIONS.md` #1 (one flat catalog, picked compositionally
   by the LLM). The renderer doesn't know or care what kind of "page"
   this is.
2. The dashboard adapts. With no result screen, the result donut
   hides. With one screen, the drop-off chart is just `Started → CTA`.
   The Top Result stat card is gone. No empty placeholders, no "no
   data" noise — the surface tightens around what the funnel actually
   contains.
