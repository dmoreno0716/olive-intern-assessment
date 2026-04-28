# 01 — Eater Quiz

A 5-question personality quiz that segments users by eating style and
ends on a `kind="result"` Screen revealing their archetype. Spec shape:
`intro → 5× question → result`. Final question's CTA ("See my eater
type") points at the actual reveal screen — not a no-op.

This example demonstrates:

1. The personality-quiz pattern: an `intro` Screen sets expectations,
   the questions build a segmentation profile, and the `result` Screen
   uses `ResultBadge` + `ResultHero` to reveal the archetype with
   instrument-serif italic emphasis (per `design/DECISIONS.md` #14 +
   the funnel-mode font story).
2. The dashboard's result-distribution donut: the segmentation field
   (the first `ChoiceList`) determines which slice each completer
   lands in, color-coded with `--r1` through `--r5`. Click a slice to
   filter the responses table.
3. The system prompt's terminal-screen rule. An earlier version of
   this example ended on a question with CTA "See my eater type"
   pointing at nothing — the LLM was making the right copy choice but
   not generating the screen the copy promised. The current
   `prompts/system.md` has explicit instruction + a few-shot example
   for personality quizzes; see Round 7's `DECISIONS.md` "system-prompt
   evolution" note.
