# 01 — Eater Quiz

A pure segmentation quiz: an intro screen plus 5 single-choice questions
that ask about cooking habits, taste preferences, and meal patterns. No
email gate, no paywall, no result screen — the LLM honored the prompt
and didn't auto-inject anything.

This example demonstrates two things:

1. The minimum viable funnel — questions only, end on the last question.
   The dashboard handles this gracefully: the result donut and Top
   Result stat card hide themselves (per `design/DECISIONS.md` #12)
   because the spec has no `kind="result"` Screen.
2. The LLM's restraint. The prompt didn't ask for a result screen, so
   the spec doesn't have one — even though many quiz authors would
   default to "5 questions → recommendation" (per
   `design/DECISIONS.md` #2, the system never auto-appends).
