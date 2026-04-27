# STUDIO.md — Creator surface

The Studio is the creator's workspace at `/studio/[funnelId]`. Three-pane
resizable layout: left = spec tree, center = live preview, right = chat.
Top bar holds funnel name + variant tabs + publish button.

Reference: `designs/03_Studio.html`.

## States

The Studio has 4 mutually-exclusive states based on funnel lifecycle:

### State 1 — First run (empty)
- Path: `/studio/new`
- Layout: full-bleed centered prompt card on Studio neutral bg.
- Contents:
  - Italic Instrument Serif H1: "What funnel do you want to build?"
  - Body: "Describe your audience, the question you want to answer, and what you're selling. Claude will draft a funnel you can edit."
  - Large textarea (~4 rows, --r-lg, --sh-1) with placeholder of an example prompt.
  - Submit button: olive-700 bg, "Generate funnel" + arrow icon.
  - Below: 4 "Try one of these" example chips (small Caption labels) — clicking fills the textarea.
  - Bottom-center: "Powered by Claude" chip (mono caption + conic swirl mark).

### State 2 — Generating
- Triggered when user submits prompt.
- Layout: full-bleed Studio bg with a centered streaming filmstrip.
- Contents:
  - Top: "Drafting your funnel…" italic display + mono progress caption ("Screen 3 of 6 · adding ChoiceList").
  - Center: horizontal scroll-reveal of placeholder phone frames as each Screen streams in. Each frame fills with skeleton bars during stream, then "snaps" into the real Screen render when its sub-spec arrives (use opacity 0→1 + scale 0.96→1, 280ms `--ease-em`).
  - Bottom: "Cancel" secondary button.

### State 3 — Main working state
- Triggered after generation OR when reopening an existing funnel.
- Three-pane layout:
  - **Top bar (56px)**: olive-700 italic "Olive" wordmark, funnel name (inline-editable display L), `·` separator, variant tabs (see §2), `Save status` mono caption ("Saved 2s ago" / "Saving…"), Publish button (olive-700, "Publish →"), avatar.
  - **Left pane (320px, resizable 240–400)**: Spec tree. Each Screen as a collapsible card with its `id`, kind icon, and child node count. Drag-to-reorder. Active screen has olive-700 left border + cream-50 bg.
  - **Center pane (flex)**: Phone preview at 390×744 centered on a Studio neutral bg with grid backdrop. Screen index dots below. Phone is a real iframe pointing at the funnel preview URL with the live-edit spec injected.
  - **Right pane (380px, resizable 320–480)**: Chat refinement panel. See §3.

### State 4 — Published modal
- Triggered when user clicks Publish in State 3.
- Center modal (cream-50 bg, --r-xl, --sh-3, max-width 540px, --m-med fade-in).
- Contents:
  - Italic Instrument Serif: "Your funnel is *live*."
  - Body: "Share these URLs to start collecting responses."
  - URL block: full URL with copy button.
  - Per-source URL list: 4 rows (TikTok, IG, FB, Direct) each showing the URL + utm params + a copy button. Source rows have a tiny channel icon.
  - Footer buttons: secondary "Open public page →" + primary "Done".

### Tablet variant
- ≤ 1024px viewport collapses right pane into a slide-up sheet from bottom (handle visible 12px high).
- Left pane collapses into a top icon-rail that opens as an overlay drawer.
- Center pane fills.

## 2. Variant tabs (top bar)

Each funnel can have up to 4 variants (A/B/C/D) for split testing.

- Tab visual: pill, mono caption "A" / "B" + funnel-name suffix. Active tab = cream-50 bg + --sh-1; inactive = neutral hover wash.
- Beside the last tab: `+ Add variant` ghost button. Clicking duplicates the active variant (preserves spec, adds suffix " · v2") and switches to it.
- Right-click / kebab on a tab opens menu: Rename, Duplicate, Delete (disabled if only one variant exists).
- Switching tabs hot-swaps the spec in left + center panes; chat history is per-variant.

## 3. Chat refinement panel (right pane)

- Top: panel title "Refine with Claude" italic + variant chip showing which variant the chat applies to.
- Body: scrollable message thread.
  - User messages: cream-50 wash, --r-md, right-aligned, max-width 80%.
  - Claude messages: no background, left-aligned, full-width.
  - Diff treatment when Claude returns a spec change:
    - Inline "diff card" (--r-md, cream-50 bg, --sh-1) showing affected screen ids as small tags.
    - Below the tags: a 3-line summary ("Renamed 'When?' → 'When do you feel stuck?'", "Added option: 'It varies day to day'", "Removed 'CTA emphasis on price'").
    - Two buttons at the bottom of the diff: "Apply" (olive-700) + "Dismiss" (ghost).
    - On Apply: spec patches in, preview iframe re-renders, save status shows "Saving…".
- Footer: chat input — multi-line textarea, --r-md, with "Refine" button (olive-700) and a smaller "Suggest" ghost button that asks Claude for ideas without sending.

## 4. Inline edit affordances (in left + center panes)

- **Hover** any text node in the spec tree shows a subtle olive-300 dotted underline.
- **Click** opens an inline editor (contentEditable) with the source string. Saves on blur or Cmd+Enter; Esc cancels.
- Tree-level edits (renaming a screen id, deleting a screen, reordering): performed in the left pane via context menu or drag.
- Field-level edits in the center preview iframe are also clickable — clicking text in the preview opens the same inline editor as the tree, scoped to that node.

## 5. Auto-save behavior

- Spec changes debounce 500ms then PATCH `/api/funnels/:id/variants/:variantId`.
- During the network call: top bar caption shows "Saving…" with a 12px ring spinner.
- On success: "Saved 2s ago" (relative timestamp, updates every 10s).
- On failure: "Couldn't save — retry" in --error red, click to retry.

## 6. Publish flow

1. User clicks "Publish →" in top bar.
2. Optimistically: button shows ring spinner, label changes to "Publishing…".
3. Server marks variant as published, generates per-source URLs (UTM-tagged), returns them.
4. State 4 modal opens with URLs.
5. After dismiss, top bar gains a green "● Live" pill next to the funnel name.

## 7. Components used

| Surface element        | shadcn primitive (or custom) |
|------------------------|------------------------------|
| Top bar                | Custom — flex row, sticky |
| Variant tabs           | shadcn `Tabs` (re-skinned) |
| Save status            | Plain span + `Loader` icon |
| Publish button         | shadcn `Button` (size=sm, accent variant) |
| Spec tree (left)       | Custom — `Collapsible` per screen, `dnd-kit` for reorder |
| Phone preview          | Custom iframe wrapper |
| Chat thread            | Custom — `ScrollArea` + message components |
| Chat input             | shadcn `Textarea` + `Button` |
| Diff card              | Custom — Card-like with two action buttons |
| Modal (State 4)        | shadcn `Dialog` |
| Per-source URL row     | Custom — flex row + `Button` icon-only for copy |
| Empty state textarea   | shadcn `Textarea` (large variant) |
| Generating filmstrip   | Custom — horizontal scroll with snap-x |
| Inline editor          | Custom contentEditable wrapper |
