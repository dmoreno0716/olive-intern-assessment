# 02 — Lead-gen Quiz

A 4-question quiz that captures email and lands on a personalized plan
recommendation. Spec shape:
`intro → 4× question → email gate → result`. This is the canonical full-
funnel pattern — every Catalog primitive (ChoiceList, EmailInput,
PrimaryCTA, ResultHero) gets exercised.

This example demonstrates:

1. The result-distribution donut on the dashboard: the segmentation
   field (the first ChoiceList) determines which result slice each
   completer lands in, color-coded with `--r1` through `--r5`.
2. The email-gate pattern. The "gate" Screen kind enforces a stop
   between quiz and result — sessions that abandon there show up in the
   drop-off chart between the last question and the result.
3. The CTA Intent rate metric. End users click the result-screen CTA
   ("Get my plan") which fires `cta:clicked` and is the conversion
   event regardless of whether a real Stripe checkout exists (per
   `AGENTS.md` "what we're NOT doing").
