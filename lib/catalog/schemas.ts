/**
 * Catalog Zod schemas, all in one non-"use client" module.
 *
 * Why: server-side modules (the SpecSchema validator, the LLM prompt
 * builder, API route handlers) import these. When schemas live in
 * "use client" component files, importing them from a server context
 * gives back a Client Reference proxy instead of the actual ZodSchema —
 * `schema.safeParse` is then `undefined`. Centralising them here keeps
 * the Zod side server-safe; the components in `./components/*.tsx`
 * re-export from this file so callers (e.g. `lib/catalog/index.ts`,
 * `<Component> typeof` inference) keep working unchanged.
 *
 * Source of truth: design/CATALOG.md.
 */

import { z } from "zod";

/* ============== Layout & structural ============== */

export const ScreenSchema = z.object({
  id: z.string(),
  kind: z
    .enum(["intro", "question", "gate", "result", "custom"])
    .default("question"),
  showProgress: z.boolean().default(true),
  showBack: z.boolean().default(true),
  body: z.array(z.any()),
  footer: z.array(z.any()).optional(),
  /** Optional helper string surfaced after a long dwell on this screen
   * (see lib/funnel/constants.ts DWELL_HELPER_THRESHOLD_MS). Funnel-mode
   * runtime only — Studio preview never shows it. */
  dwellHelper: z.string().optional(),
});

export const StackSchema = z.object({
  gap: z.enum(["xs", "sm", "md", "lg", "xl"]).default("md"),
  align: z.enum(["start", "center", "stretch"]).default("stretch"),
  children: z.array(z.any()),
});

export const GroupSchema = z.object({
  gap: z.enum(["xs", "sm", "md", "lg"]).default("sm"),
  align: z.enum(["start", "center", "baseline"]).default("center"),
  justify: z.enum(["start", "between", "center", "end"]).default("start"),
  wrap: z.boolean().default(false),
  children: z.array(z.any()),
});

export const SpacerSchema = z.object({});

export const DividerSchema = z.object({
  tone: z.enum(["soft", "strong"]).default("soft"),
});

/* ============== Typography ============== */

export const HeadingSchema = z.object({
  text: z.string(),
  emphasis: z.string().optional(),
  size: z.enum(["sm", "md", "lg", "xl", "2xl", "3xl"]).default("xl"),
  align: z.enum(["start", "center"]).default("start"),
});

export const BodySchema = z.object({
  text: z.string(),
  size: z.enum(["sm", "md", "lg"]).default("md"),
  tone: z.enum(["default", "muted"]).default("default"),
});

export const EyebrowSchema = z.object({
  text: z.string(),
  tone: z.enum(["default", "accent"]).default("default"),
});

export const CaptionSchema = z.object({ text: z.string() });

/* ============== Answer primitives ============== */

export const ChoiceListSchema = z.object({
  field: z.string(),
  options: z.array(
    z.object({
      value: z.string(),
      label: z.string(),
      description: z.string().optional(),
      icon: z.string().optional(),
    }),
  ),
  required: z.boolean().default(true),
});

export const MultiChoiceSchema = ChoiceListSchema.extend({
  min: z.number().int().nonnegative().default(0),
  max: z.number().int().positive().optional(),
});

export const ImageChoiceGridSchema = z.object({
  field: z.string(),
  options: z.array(
    z.object({
      value: z.string(),
      label: z.string(),
      image: z.string().url(),
    }),
  ),
  cols: z.enum(["2", "3"]).default("2"),
});

export const ScalePickerSchema = z.object({
  field: z.string(),
  min: z.number().int(),
  max: z.number().int(),
  minLabel: z.string().optional(),
  maxLabel: z.string().optional(),
});

export const ShortTextSchema = z.object({
  field: z.string(),
  placeholder: z.string().optional(),
  maxLength: z.number().int().positive().optional(),
  required: z.boolean().default(true),
  autocomplete: z.string().optional(),
});

export const LongTextSchema = ShortTextSchema.extend({
  rows: z.number().int().positive().default(4),
});

export const EmailInputSchema = z.object({
  field: z.string().default("email"),
  placeholder: z.string().default("you@example.com"),
  required: z.boolean().default(true),
});

export const NumberInputSchema = z.object({
  field: z.string(),
  min: z.number().optional(),
  max: z.number().optional(),
  step: z.number().default(1),
  unit: z.string().optional(),
});

export const ToggleRowSchema = z.object({
  field: z.string(),
  label: z.string(),
  description: z.string().optional(),
  default: z.boolean().default(false),
});

/* ============== CTA & navigation ============== */

export const PrimaryCTASchema = z.object({
  label: z.string(),
  action: z.enum(["next", "submit", "external"]).default("next"),
  href: z.string().optional(),
  ariaLabel: z.string().optional(),
});

export const SecondaryCTASchema = z.object({
  label: z.string(),
  action: z.enum(["skip", "back", "external", "share"]).default("skip"),
  href: z.string().optional(),
  /** When `action === "share"`, payload passed to the Web Share API.
   * Falls back to copying `shareUrl` (or the current page URL) to the
   * clipboard if `navigator.share` isn't available (typically desktop). */
  shareTitle: z.string().optional(),
  shareText: z.string().optional(),
  shareUrl: z.string().optional(),
});

export const ProgressBarSchema = z.object({
  override: z.number().min(0).max(1).optional(),
});

export const BackButtonSchema = z.object({});

/* ============== Result, conversion, gate ============== */

export const ResultBadgeSchema = z.object({ label: z.string() });

export const ResultHeroSchema = z.object({
  resultName: z.string(),
  emphasis: z.string().optional(),
  tagline: z.string(),
});

export const PriceCardSchema = z.object({
  title: z.string(),
  subtitle: z.string().optional(),
  bullets: z.array(z.string()).default([]),
  variant: z.enum(["default", "emphasis"]).default("default"),
});

export const EmailGateSchema = z.object({
  field: z.string().default("email"),
  cta: z.string().default("Show my result"),
  privacyNote: z.string().optional(),
});

export const SocialProofSchema = z.object({
  variant: z.enum(["stats", "testimonial"]),
  stats: z
    .array(z.object({ value: z.string(), label: z.string() }))
    .optional(),
  testimonial: z
    .object({ quote: z.string(), author: z.string() })
    .optional(),
});

export const DisclosureSchema = z.object({
  summary: z.string(),
  details: z.string(),
});

/* ============== Decorative ============== */

export const AvatarSchema = z.object({
  src: z.string().url(),
  size: z.enum(["sm", "md", "lg", "xl"]).default("md"),
  fallback: z.string().optional(),
});

export const IconBadgeSchema = z.object({
  icon: z.string(),
  tone: z.enum(["olive", "cream", "accent"]).default("olive"),
});

export const PoweredFooterSchema = z.object({});

/* ============== descriptions ============== */

export const ScreenDescription =
  "Top-level container for one funnel step. Owns progress indicator, back button, body, and footer slots. Every funnel spec is a list of Screen nodes. Optional `dwellHelper` (string) surfaces in-place when the user lingers >8s on this screen.";
export const StackDescription =
  "Vertical flex column. Use to group items with consistent spacing. `gap` controls vertical rhythm; `align` controls cross-axis alignment.";
export const GroupDescription =
  "Horizontal flex row. Use for inline pairs (icon + label, two short pieces of text). `wrap` enables multi-line wrapping on narrow screens.";
export const SpacerDescription =
  "Flex-1 vertical filler. Used inside Screen body to push the footer down on short content.";
export const DividerDescription =
  "Horizontal hairline. Use to separate body sections.";
export const HeadingDescription =
  "Display-style headline. `emphasis` italicises a substring (Olive's signature treatment). Sizes step from sm (18px) to 3xl (44px).";
export const BodyDescription =
  "Paragraph copy. Use after a Heading for sub-headers, or between sections for explanatory text.";
export const EyebrowDescription =
  "Small uppercase mono caption above a heading (e.g. '3 of 6', 'Find your protocol').";
export const CaptionDescription =
  "Small body copy used below CTAs ('No card needed', 'We never sell your data').";
export const ChoiceListDescription =
  "Single-select stack of full-width option cards. The primary answer pattern. Binds to a `field` key.";
export const MultiChoiceDescription =
  "Multi-select stack of full-width option cards with checkbox markers. Same shape as ChoiceList plus optional min/max counts.";
export const ImageChoiceGridDescription =
  "Picture-led answer grid. Use when the choice is best evoked visually rather than verbally.";
export const ScalePickerDescription =
  "Likert / NPS / 1-5 / 1-10 segmented numeric scale. Use for satisfaction, intensity, or frequency questions.";
export const ShortTextDescription =
  "Single-line text input bound to a field key. Used for names, short open answers, etc.";
export const LongTextDescription =
  "Multi-line textarea, same field-binding contract as ShortText. `rows` controls visible height.";
export const EmailInputDescription =
  "Specialized ShortText with email validation. States: default, focused, valid (subtle olive border), error (red border + mono err caption).";
export const NumberInputDescription =
  "Numeric input with optional min/max/step and a trailing unit chip.";
export const ToggleRowDescription =
  "Inline toggle row with label and optional description. Use for boolean questions or opt-ins.";
export const PrimaryCTADescription =
  "The funnel-mode primary button. Lives in Screen.footer. Validates the screen's bound fields, persists the answer, and advances. Olive bg, cream fg, 18px radius (literal).";
export const SecondaryCTADescription =
  "Subtle text-link beneath the PrimaryCTA. 'Maybe later', 'Skip for now', 'Back to choices'. Set `action: \"share\"` on a result screen to invite social sharing — provide `shareTitle` and `shareText` (e.g. shareText: \"I'm a Slow Burn Eater 🍃\"). The runtime invokes navigator.share() on mobile and falls back to clipboard copy on desktop; the action is implemented in the SecondaryCTA component, not by the spec.";
export const ProgressBarDescription =
  "Auto-rendered by Screen — do not include in spec. Optional `override` (0..1) lets a result screen show 100% even if it isn't the last.";
export const BackButtonDescription =
  "Renders inside Screen header. Disabled on the first screen. Auto-rendered by Screen — do not include in spec.";
export const ResultBadgeDescription =
  "Pill with status dot + label, shown at the top of a result Screen (e.g. 'Your match').";
export const ResultHeroDescription =
  "Big italic 'You are <name>' moment. `emphasis` is the substring of `resultName` that gets the Olive italic treatment.";
export const PriceCardDescription =
  "Conversion offer card. `bullets` are short value-prop lines. `variant: emphasis` adds an olive ring.";
export const EmailGateDescription =
  "Email capture before showing a result. Encapsulates EmailInput + PrimaryCTA + privacy caption.";
export const SocialProofDescription =
  "Either a stats row (`stats`) or a testimonial card (`testimonial`). Pick one via the `variant` discriminator.";
export const DisclosureDescription =
  "Expandable 'What does this mean?' disclosure. Summary is the always-visible row; details show on toggle.";
export const AvatarDescription =
  "Decorative result/intro avatar. Size sm/md/lg/xl maps to 32/40/56/72px.";
export const IconBadgeDescription =
  "Tinted circular badge holding a single Lucide icon. Use for result-screen visual anchors.";
export const PoweredFooterDescription =
  "The 'Powered by Olive' mark. Auto-rendered as the last child of every Screen unless funnel-level config sets `hidePoweredFooter: true`. Do NOT include in spec — registered for catalog completeness only.";
