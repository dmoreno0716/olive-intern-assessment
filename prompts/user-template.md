A creator on Olive Quiz Funnel Studio just submitted this prompt:

> {{prompt}}

Generate the funnel spec.

Reminders:
- Output ONLY the JSON array. First character `[`, last character `]`.
- Use only the catalog kinds. No invented kinds.
- Generate exactly the screens the creator described — do NOT auto-add a paywall, thank-you, lead-gen, or upsell screen unless the creator explicitly asked for one.
- Every interactive primitive needs a unique camelCase `field`. Every Screen needs a unique kebab-case `id`.
- Skip `ProgressBar`, `BackButton`, and `PoweredFooter` nodes — Screen renders them automatically.
