# DECISIONS.md

A short log of the product and technical decisions you made while building Text-to-Quiz. Keep it honest — tradeoffs and "I'd do this differently with more time" are as valuable as wins.

---

## Quiz spec schema

<!-- What shape does a generated quiz take? Why those fields? What did you deliberately leave out? -->

## LLM choice

<!-- Which provider and model did you use? Why? Cost-per-quiz estimate? -->

## Question type vocabulary

<!-- Which question types does your system support? Which did you skip and why? -->

## Scoring & results logic

<!-- How does scoring work? Weighting? Branching? Multiple result dimensions? What's in vs. out of scope? -->

## Edit loop

<!-- After the first generation, how does a user iterate? Full regeneration, spec patching, or direct editing? Why? -->

## Prompt reliability

<!-- How do you validate LLM output? Retries? Fallbacks? What happens when it returns garbage? -->

## Data model

<!-- How are quizzes and responses stored? What does the quiz-creator dashboard actually show? -->

## Cost

<!-- Approximate $ per generated quiz. Show your math. -->

## CheckoutOverlay — visual chrome, not a handoff

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

## What I'd do differently with more time

<!-- Honest list. -->
