# DASHBOARD.md — Analytics surface

The Dashboard is the creator's analytics view at `/studio/[funnelId]/dashboard`. Reference: `designs/04_Dashboard.html`.

## Sections (top to bottom)

### 1. Header
- Status pill (green dot + "Live" / amber + "Draft").
- Inline-editable funnel name (Display L italic).
- URL chip with copy button.
- Right-aligned quick stats: Started · Completed · CTA rate (3 mono captions + values).

### 2. Variant tabs + range picker (sticky)
- Tabs: All · A · B · C (mirrors Studio variants). All-tab shows the comparison view; per-variant tabs show single-variant view.
- Range picker right-aligned: Today / 7d / 30d / 90d / Custom — shadcn `Select` or `Tabs`.

### 3. Stat cards (per-variant view only)
4-up grid on desktop, 2-up on mobile:
- **Started** — value + 30-day sparkline (SVG, olive-500 stroke).
- **Completed** — value + completion-rate ring (SVG, olive-700 stroke on cream-300 track).
- **CTA Intent rate** — value + ring.
- **Top Result** — result name + share-of-completers %.

### 4. Comparison table (All-tab only)
Replaces stat cards. Rows = variants, columns = Started / Completed / CTA / Top Result. Each rate cell renders a thin bar inside the cell (olive-500 fill on cream-200 track, % label right-aligned). Highest-rate row gets a "Winning" tag (olive-700 pill).

### 5. Source breakdown
Two-column layout (stacks on mobile):
- Left: stacked bar chart — one row per source (TikTok / IG / FB / Direct), bar split into Started (olive-300) + Completed (olive-700).
- Right: mini table — source / sessions / completion rate.

### 6. Drop-off chart
9-step horizontal funnel chart. Each step is a vertical bar (height = sessions remaining). On hover, tooltip shows screen thumbnail (mini render) + dwell median + drop-off %.

### 7. Result distribution donut (conditional)
**Only renders if the funnel has at least one `kind="result"` Screen.** SVG donut, 5 segments using `--r1` through `--r5`. Center: total completers. Right: legend with click-to-filter — clicking a segment filters the responses table (§8) to that result.

### 8. Responses table
- Filterable (by source, variant, result, date) + sortable (timestamp, dwell).
- Columns: Timestamp · Variant · Source · Result · Dwell · CTA.
- Rows expand on click — expanded row shows: full answer set, per-screen dwell breakdown, session metadata (ip-region, device, locale).
- Pagination at bottom (50/page default).

## Empty state
When `responseCount === 0`:
- Pulse-ring icon (olive-500) at top.
- "Waiting for your first response" italic Display L hero.
- Single card with Copy share URL primary button + per-source URLs stacked.
- Test-harness link below ("Or test it via the webview harness").
- Below: dimmed skeleton previews of stat cards / table ("No data yet" placeholders).

## Mobile responsive (≤ 640px)
- Stat cards stack 2-up.
- Source bars compress (smaller labels, no inline rate text — show on tap).
- Donut + legend stack vertically.
- Responses table converts to a card list (no horizontal scroll). Each card: timestamp + variant pill + source + screens/dwell + result + CTA pill.

## Charts implementation
Use **Recharts** for sparklines, completion rings, source bars, and drop-off bars. Donut is hand-rolled SVG (Recharts `PieChart` works but the segment hover-to-filter is easier as inline SVG paths). All charts use the role tokens — never library defaults.

## Components

| Element | shadcn primitive |
|---------|------------------|
| Variant tabs | `Tabs` |
| Range picker | `Select` |
| Stat cards | `Card` |
| Comparison table | `Table` |
| Responses table | `Table` + `Collapsible` rows |
| Filter selects | `Select` |
| Copy URL button | `Button` icon-only |
| Status pill | Custom |
