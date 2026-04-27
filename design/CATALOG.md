# CATALOG.md — The 31 funnel primitives

This is the most important spec doc. The catalog defined here becomes the
JSON-render catalog registered with `defineCatalog` from
`@json-render/core`. The LLM (Claude) generates funnel specs against this
schema; renderers consume specs to produce real funnel screens.

## Conventions

- All components live in `lib/catalog/components/<Name>.tsx`.
- Each export is a React component PLUS a Zod props schema.
- Catalog registered in `lib/catalog/index.ts` via `defineCatalog`.
- Names are PascalCase, stable, and become the catalog `kind` keys —
  do NOT rename without bumping the catalog version.
- All components must respect the `.funnel` mode tokens (no Studio chrome
  ever appears inside a primitive).
- Required vs optional indicated by Zod `.optional()`; defaults come from the
  component, not the spec.

```ts
// lib/catalog/index.ts
import { defineCatalog } from "@json-render/core";
import { Screen, ScreenSchema } from "./components/Screen";
// ... etc
export const catalog = defineCatalog({
  Screen:        { component: Screen,        props: ScreenSchema,        description: "..." },
  // ...
});
```

---

## 1. Layout & structural

### 1. Screen

Top-level container for one funnel step. Owns progress indicator, back
button, body slot, and footer slot. Every funnel spec is a list of `Screen`
nodes.

```ts
ScreenSchema = z.object({
  id: z.string(),
  kind: z.enum(["intro","question","gate","result","custom"]).default("question"),
  showProgress: z.boolean().default(true),
  showBack: z.boolean().default(true),
  body: z.array(z.any()),       // children — any catalog node
  footer: z.array(z.any()).optional(),
});
```
- States: default. (Loading/error are handled at the funnel-shell level, not per-screen.)
- Composition: must be a top-level child of the funnel spec. Cannot nest.
- Constraints: exactly one Screen renders at a time; navigation between Screens uses the inter-screen transition (SHARED_CHROME §3).

### 2. Stack

Vertical flex column. Most common layout primitive.

```ts
StackSchema = z.object({
  gap: z.enum(["xs","sm","md","lg","xl"]).default("md"),  // 4/8/16/24/32
  align: z.enum(["start","center","stretch"]).default("stretch"),
  children: z.array(z.any()),
});
```
- States: default.
- Composition: any catalog node as children.

### 3. Group

Horizontal flex row.

```ts
GroupSchema = z.object({
  gap: z.enum(["xs","sm","md","lg"]).default("sm"),
  align: z.enum(["start","center","baseline"]).default("center"),
  justify: z.enum(["start","between","center","end"]).default("start"),
  wrap: z.boolean().default(false),
  children: z.array(z.any()),
});
```

### 4. Spacer

Flex-1 vertical filler. Used inside Screen body to push footer down on short content.
```ts
SpacerSchema = z.object({});
```

### 5. Divider

Horizontal hairline.
```ts
DividerSchema = z.object({ tone: z.enum(["soft","strong"]).default("soft") });
```

---

## 2. Typography

### 6. Heading

Funnel headline. Renders Instrument Serif italic.

```ts
HeadingSchema = z.object({
  text: z.string(),
  emphasis: z.string().optional(),     // substring within `text` rendered in --olive-700
  size: z.enum(["sm","md","lg","xl","2xl","3xl"]).default("xl"),
  align: z.enum(["start","center"]).default("start"),
});
```
- The `emphasis` substring is wrapped in an `<em>` styled with olive-700 — used to draw the eye to the key word ("most stuck", "Slow Burn", etc.).
- Sizes map to type ramp Display S–3XL.

### 7. Body

Paragraph copy.
```ts
BodySchema = z.object({
  text: z.string(),
  size: z.enum(["sm","md","lg"]).default("md"),
  tone: z.enum(["default","muted"]).default("default"),
});
```

### 8. Eyebrow

Small mono uppercase label above a Heading. Often used for "STEP 3 OF 6".

```ts
EyebrowSchema = z.object({
  text: z.string(),
  tone: z.enum(["default","accent"]).default("default"),
});
```

### 9. Caption

Small body copy used below CTAs ("No card needed", "We never sell your data").

```ts
CaptionSchema = z.object({ text: z.string() });
```

---

## 3. Answer primitives (interactive)

All answer primitives **bind to a `field` key** that becomes part of the
captured answer set. They do NOT navigate themselves — the screen's
PrimaryCTA validates and advances.

### 10. ChoiceList

Single-select stack of full-width option cards. The primary answer pattern.

```ts
ChoiceListSchema = z.object({
  field: z.string(),
  options: z.array(z.object({
    value: z.string(),
    label: z.string(),
    description: z.string().optional(),  // 2nd-line subtext
    icon: z.string().optional(),         // lucide icon name
  })),
  required: z.boolean().default(true),
});
```
- States required: `default`, `hover`, `selected`, `focused (kbd)`, `error (after submit attempt with required missing)`.
- Visual: 1.5px border, --r-lg radius, 15px padding-y. Selected = olive-500 border + 6%-mix wash + filled marker.

### 11. MultiChoice

Same shape as ChoiceList but multi-select with checkbox markers.

```ts
MultiChoiceSchema = ChoiceListSchema.extend({
  min: z.number().int().nonnegative().default(0),
  max: z.number().int().positive().optional(),
});
```

### 12. ImageChoiceGrid

Grid of image-led options (2-col on mobile, 3-col on tablet+).

```ts
ImageChoiceGridSchema = z.object({
  field: z.string(),
  options: z.array(z.object({
    value: z.string(),
    label: z.string(),
    image: z.string().url(),
  })),
  cols: z.enum(["2","3"]).default("2"),
});
```
- **Constraint**: if options.length > 6, render in a horizontally scrollable container (snap-x mandatory) instead of grid wrapping. The catalog component handles this internally.

### 13. ScalePicker

Likert / NPS / 1-5 / 1-10 segmented scale.

```ts
ScalePickerSchema = z.object({
  field: z.string(),
  min: z.number().int(),
  max: z.number().int(),
  minLabel: z.string().optional(),
  maxLabel: z.string().optional(),
});
```
- States: default, hover, selected, focused.

### 14. ShortText

Single-line text input.
```ts
ShortTextSchema = z.object({
  field: z.string(),
  placeholder: z.string().optional(),
  maxLength: z.number().int().positive().optional(),
  required: z.boolean().default(true),
  autocomplete: z.string().optional(),
});
```

### 15. LongText

Multi-line textarea. Same props as ShortText plus `rows: number`.

### 16. EmailInput

Specialized ShortText with email validation.
```ts
EmailInputSchema = z.object({
  field: z.string().default("email"),
  placeholder: z.string().default("you@example.com"),
  required: z.boolean().default(true),
});
```
- States: default, focused, valid (subtle olive border), error (red border + mono err caption below).

### 17. NumberInput

```ts
NumberInputSchema = z.object({
  field: z.string(),
  min: z.number().optional(),
  max: z.number().optional(),
  step: z.number().default(1),
  unit: z.string().optional(),  // suffix label
});
```

### 18. ToggleRow

Single labeled switch.
```ts
ToggleRowSchema = z.object({
  field: z.string(),
  label: z.string(),
  description: z.string().optional(),
  default: z.boolean().default(false),
});
```

---

## 4. CTA & navigation

### 19. PrimaryCTA

The funnel-mode primary button. Lives in `Screen.footer`. Validates the
screen's bound fields, persists the answer, and advances.

```ts
PrimaryCTASchema = z.object({
  label: z.string(),
  action: z.enum(["next","submit","external"]).default("next"),
  href: z.string().optional(),         // only when action="external"
  ariaLabel: z.string().optional(),
});
```
- States: default, hover, pressed, disabled (form invalid), loading (during submit).
- Visual: olive-500 bg, cream-50 fg, **18px radius literal** (not a token), --sh-2 shadow, 16px padding-y.
- Behavior: tap emits `screen:completed` postMessage, then advances. If on the final screen, also emits `funnel:completed`. If `action="external"`, emits `cta:clicked` and triggers checkout overlay (PUBLIC_FUNNEL §3).

### 20. SecondaryCTA

Subdued link-style action ("Maybe later", "Skip this question").

```ts
SecondaryCTASchema = z.object({
  label: z.string(),
  action: z.enum(["skip","back","external"]).default("skip"),
  href: z.string().optional(),
});
```

### 21. ProgressBar

Renders inside Screen header. Computes from current screen index automatically; spec props are optional overrides.

```ts
ProgressBarSchema = z.object({
  override: z.number().min(0).max(1).optional(),
});
```

### 22. BackButton

Renders inside Screen header. Disabled on the first screen.
```ts
BackButtonSchema = z.object({});
```

---

## 5. Result, conversion, gate

### 23. ResultBadge

Shown at the top of a result Screen. Pill with status dot + label.
```ts
ResultBadgeSchema = z.object({ label: z.string() });   // e.g. "Your match"
```

### 24. ResultHero

Big result name + tagline. Wraps a Heading + Body.
```ts
ResultHeroSchema = z.object({
  resultName: z.string(),
  emphasis: z.string().optional(),
  tagline: z.string(),
});
```

### 25. PriceCard

The conversion/offer block. Shown on result screens or standalone paywall.

```ts
PriceCardSchema = z.object({
  title: z.string(),                          // "14 days · $24"
  subtitle: z.string().optional(),            // "$1.71/day"
  bullets: z.array(z.string()).default([]),
  variant: z.enum(["default","emphasis"]).default("default"),
});
```
- States: default, emphasis (olive border + tinted bg).
- Visual: cream-50 bg, 1.5px cream-300 border, --r-lg, 14px/16px padding. Bullets use checkmark icon in olive-500.

### 26. EmailGate

Hard gate before showing result. Email input + PrimaryCTA combined.
```ts
EmailGateSchema = z.object({
  field: z.string().default("email"),
  cta: z.string().default("Show my result"),
  privacyNote: z.string().optional(),
});
```

### 27. SocialProof

Three-stat row or testimonial card.
```ts
SocialProofSchema = z.object({
  variant: z.enum(["stats","testimonial"]),
  stats: z.array(z.object({ value: z.string(), label: z.string() })).optional(),
  testimonial: z.object({ quote: z.string(), author: z.string() }).optional(),
});
```

### 28. Disclosure

Expandable "What does this mean?" disclosure.
```ts
DisclosureSchema = z.object({
  summary: z.string(),
  details: z.string(),
});
```

---

## 6. Decorative / atmospheric

### 29. Avatar

Decorative result/intro avatar.
```ts
AvatarSchema = z.object({
  src: z.string().url(),
  size: z.enum(["sm","md","lg","xl"]).default("md"),
  fallback: z.string().optional(),
});
```

### 30. IconBadge

Round icon-on-tinted-bg used for feature lists.
```ts
IconBadgeSchema = z.object({
  icon: z.string(),                              // lucide name
  tone: z.enum(["olive","cream","accent"]).default("olive"),
});
```

### 31. PoweredFooter

The "Powered by Olive" mark. Renders automatically at the bottom of every
Screen unless funnel spec sets `hidePoweredFooter: true`.
```ts
PoweredFooterSchema = z.object({});
```

---

## Composition rules summary

- **Top level**: array of `Screen`.
- **Screen.body**: any catalog node EXCEPT another Screen.
- **Screen.footer**: only `PrimaryCTA`, `SecondaryCTA`, `Caption`, or a `Stack` of those.
- **Stack/Group**: contain any non-Screen node.
- **Result components** (ResultBadge, ResultHero, PriceCard, EmailGate): only inside `kind="result"` or `kind="gate"` Screens (LLM advisory; not enforced at runtime).
- **PoweredFooter**: rendered automatically; do not include in spec.

---

## Example spec trees

### Example 1 — Quiz question screen

```json
{
  "kind": "Screen",
  "props": {
    "id": "stuck-when",
    "kind": "question",
    "body": [
      { "kind": "Eyebrow", "props": { "text": "3 of 6" } },
      { "kind": "Heading", "props": { "text": "When do you feel most stuck?", "emphasis": "most stuck", "size": "2xl" } },
      { "kind": "Body", "props": { "text": "Pick the moment when your energy dips the hardest. We'll tune the protocol around it." } },
      { "kind": "ChoiceList", "props": {
          "field": "stuckWhen",
          "options": [
            { "value": "morning", "label": "First thing in the morning" },
            { "value": "afternoon", "label": "Mid-afternoon slump" },
            { "value": "night", "label": "Right before bed" },
            { "value": "varies", "label": "It varies day to day" }
          ]
      }}
    ],
    "footer": [
      { "kind": "PrimaryCTA", "props": { "label": "Continue" } }
    ]
  }
}
```

### Example 2 — Quiz result screen

```json
{
  "kind": "Screen",
  "props": {
    "id": "result",
    "kind": "result",
    "showBack": false,
    "body": [
      { "kind": "ResultBadge", "props": { "label": "Your match" } },
      { "kind": "ResultHero", "props": {
          "resultName": "The Slow Burn protocol fits you best.",
          "emphasis": "Slow Burn",
          "tagline": "Built for people whose afternoons fall apart. 14 days, 8 minutes a day, no caffeine reset."
      }},
      { "kind": "PriceCard", "props": {
          "title": "14 days · $24",
          "subtitle": "$1.71/day",
          "bullets": [
            "8-minute morning practice",
            "Afternoon micro-resets",
            "Cancel any time"
          ]
      }}
    ],
    "footer": [
      { "kind": "PrimaryCTA", "props": { "label": "Start my 14 days", "action": "external", "href": "/checkout?p=slow-burn" } },
      { "kind": "SecondaryCTA", "props": { "label": "Maybe later" } }
    ]
  }
}
```

### Example 3 — Standalone paywall

```json
{
  "kind": "Screen",
  "props": {
    "id": "paywall",
    "kind": "gate",
    "showProgress": false,
    "showBack": false,
    "body": [
      { "kind": "Eyebrow", "props": { "text": "Limited offer" } },
      { "kind": "Heading", "props": { "text": "Unlock your full plan.", "emphasis": "full plan", "size": "2xl", "align": "center" } },
      { "kind": "PriceCard", "props": {
          "title": "$49 / month",
          "subtitle": "First 7 days free",
          "bullets": ["All protocols", "Live coach calls", "Cancel any time"],
          "variant": "emphasis"
      }},
      { "kind": "SocialProof", "props": {
          "variant": "stats",
          "stats": [
            { "value": "12,000", "label": "active members" },
            { "value": "4.8★", "label": "App Store" },
            { "value": "92%", "label": "stick with it" }
          ]
      }}
    ],
    "footer": [
      { "kind": "PrimaryCTA", "props": { "label": "Start free trial", "action": "external" } },
      { "kind": "Caption", "props": { "text": "Cancel any time. We'll remind you 2 days before billing." } }
    ]
  }
}
```

### Example 4 — Thank-you screen (creator-authored)

```json
{
  "kind": "Screen",
  "props": {
    "id": "thanks",
    "kind": "intro",
    "showProgress": false,
    "showBack": false,
    "body": [
      { "kind": "IconBadge", "props": { "icon": "check", "tone": "olive" } },
      { "kind": "Heading", "props": { "text": "You're all set.", "emphasis": "all set", "size": "xl", "align": "center" } },
      { "kind": "Body", "props": { "text": "We sent your first session to qa@olive.app. Check your inbox in the next few minutes." } }
    ],
    "footer": [
      { "kind": "PrimaryCTA", "props": { "label": "Open inbox", "action": "external", "href": "mailto:" } }
    ]
  }
}
```

Note: thank-you screens are NEVER auto-injected by the system. If a creator
wants one, they author it. If they don't, the funnel ends on the result/CTA
screen and the CTA tap IS the conversion. See DECISIONS.md.
