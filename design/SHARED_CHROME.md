# SHARED_CHROME.md — Screen anatomy, transitions, CTA

## 1. Screen anatomy

Every funnel Screen renders into a fixed slot layout. Mobile-first; tablet/
desktop frame the same vertical column at 480px max-width.

```
┌─────────────────────────────────────┐
│  [status bar — public site only]    │ 36px (mobile fullscreen variant)
├─────────────────────────────────────┤
│  ▰▰▰▰▰▱▱▱▱▱  ProgressBar           │ 3px filled bar, 14px top margin, 22px h-margin
├─────────────────────────────────────┤
│  ←  BackButton                      │ 22×22 olive-900 chevron, 16px padding
├─────────────────────────────────────┤
│                                     │
│  Body slot                          │ 16px h-padding, 24px between body items,
│                                     │ flex-1, scroll if overflow
│                                     │
├─────────────────────────────────────┤
│  Footer slot                        │ 14px/24px padding, push to bottom via Spacer
│  [────── PrimaryCTA ──────]         │
│  Maybe later                        │
├─────────────────────────────────────┤
│  ◐ Powered by Olive                 │ auto-rendered PoweredFooter
└─────────────────────────────────────┘
```

### Slot contracts

- **ProgressBar** — auto-renders unless `Screen.showProgress: false`. Width = `(currentIndex + 1) / totalScreens`. Animates with `--m-med` ease on screen change.
- **BackButton** — auto-renders unless `Screen.showBack: false` OR currentIndex === 0. Tap goes to previous screen with reverse transition.
- **Body** — `flex: 1` flex column. If content overflows the viewport, body scrolls; ProgressBar/BackButton/Footer stay fixed.
- **Footer** — `margin-top: auto` (sticks to bottom of column on short screens). Padding 14px 24px 18px.
- **PoweredFooter** — auto-rendered as the last child of the screen container, NOT inside the spec footer. 6/14px padding, conic olive swirl + caption text.

## 2. Inter-screen transition

When PrimaryCTA advances:

1. Outgoing Screen: `transform: translateX(-24px); opacity: 0; transition: transform var(--m-med) var(--ease-em), opacity var(--m-med) var(--ease-em);`
2. Incoming Screen: starts at `transform: translateX(24px); opacity: 0;` and animates to `translateX(0); opacity: 1;` on the same timing.
3. ProgressBar fill animates from old value → new value with `--m-med` `--ease-em`.

When BackButton retreats: the X-translation reverses (incoming from -24, outgoing to +24) so motion direction reads as backwards.

Implementation: wrap the active Screen in a `motion.div` (Framer Motion) keyed by `screen.id`. Use `AnimatePresence` with `mode="popLayout"`. Or hand-roll with CSS classes on a state machine.

## 3. PrimaryCTA placement & behavior

- **Placement** — always inside `Screen.footer`. Never inline in body. Always full-width within the 480px content column.
- **Width** — fills footer minus 24px h-padding.
- **Disabled state** — opacity 0.5, no shadow, no hover transform. Triggered when required fields in body are unfilled.
- **Loading state** — replaces label with a 14px ring spinner; preserves bg/fg colors. Used during async submit (email gate verifying, network round-trip).
- **Pressed** — `transform: translateY(0)` (cancels the -1px hover lift). No color change.
- **Hover (desktop only)** — `transform: translateY(-1px)`, shadow stays at `--sh-2`. Mobile suppresses hover with `@media (hover: none)`.
- **Accent emphasis** — never use a different color for "primary" CTAs across funnels. There is exactly one PrimaryCTA visual; creators don't get to recolor it.

## 4. Edge cases

- **Empty footer on a screen** — auto-inject a `Continue` PrimaryCTA. The catalog enforces this in the renderer, not at spec-validation time, so the LLM is free to omit.
- **More than one PrimaryCTA in a footer** — render only the first. Log a warning to console in dev.
- **Screen with no fields and no footer** — auto-inject `Continue`. Tap advances.
- **Final screen** — same chrome, but BackButton hides AND advancing emits `funnel:completed` instead of routing forward. The PrimaryCTA stays tappable to fire `cta:clicked`.
