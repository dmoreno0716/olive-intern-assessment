# TOKENS.md — Olive Quiz Funnel Studio

The token system is **one palette, two modes**. Studio mode (creator tools)
and Funnel mode (end-user surfaces) pick different stops + fonts from the
same source-of-truth tokens.

---

## 1. Color

All colors are stored as `oklch()` for perceptual uniformity, with hex
fallbacks for tooling that needs them. Paste the `:root` block in §6 directly
into `app/globals.css` for Tailwind v4.

### 1.1 Olive (brand)

| Token        | oklch                  | Hex approx | Use |
|--------------|------------------------|-----------|-----|
| `--olive-50`  | `oklch(0.96 0.018 125)` | `#eef2e3` | Funnel-mode bg tint |
| `--olive-100` | `oklch(0.88 0.035 128)` | `#d4dcb8` | Funnel hover wash |
| `--olive-300` | `oklch(0.66 0.055 130)` | `#8e9d6a` | Decorative, sparkles |
| `--olive-500` | `oklch(0.46 0.058 132)` | `#5d6b3e` | Funnel-mode primary CTA |
| `--olive-700` | `oklch(0.32 0.045 134)` | `#3e4a2a` | Studio-mode accent, headlines |
| `--olive-900` | `oklch(0.20 0.030 135)` | `#252e1c` | Funnel-mode body text |

### 1.2 Cream (warm neutrals — Funnel mode only)

| Token         | oklch                  | Hex approx | Use |
|---------------|------------------------|-----------|-----|
| `--cream-50`  | `oklch(0.985 0.006 85)` | `#fbfaf6` | Surface (cards) |
| `--cream-100` | `oklch(0.965 0.012 84)` | `#f5f2e9` | Page bg |
| `--cream-200` | `oklch(0.940 0.018 82)` | `#ece7d5` | Surface-2 |
| `--cream-300` | `oklch(0.905 0.022 80)` | `#dfd7c0` | Border |
| `--cream-400` | `oklch(0.860 0.024 78)` | `#cec3a7` | Border strong |

### 1.3 Neutral (cool grays — Studio mode only)

| Token       | oklch                    | Hex approx |
|-------------|--------------------------|-----------|
| `--n-0`     | `#ffffff`                 | white |
| `--n-50`    | `oklch(0.985 0.002 250)`  | `#fafafb` |
| `--n-100`   | `oklch(0.965 0.004 250)`  | `#f4f5f6` |
| `--n-150`   | `oklch(0.945 0.005 250)`  | `#eeeff1` |
| `--n-200`   | `oklch(0.925 0.006 250)`  | `#e7e8eb` |
| `--n-300`   | `oklch(0.870 0.008 250)`  | `#d6d8dc` |
| `--n-400`   | `oklch(0.720 0.010 250)`  | `#a4a7ad` |
| `--n-500`   | `oklch(0.560 0.012 250)`  | `#787c83` |
| `--n-600`   | `oklch(0.440 0.014 250)`  | `#5b5e64` |
| `--n-700`   | `oklch(0.320 0.014 250)`  | `#3f4248` |
| `--n-800`   | `oklch(0.220 0.012 250)`  | `#2a2c30` |
| `--n-900`   | `oklch(0.140 0.010 250)`  | `#16181b` |

### 1.4 Result accents (donut/segment colors, NOT semantic)

These are the 5 colors used for result distribution charts and segment-result
chips. They are deliberately distinct from olive so charts read clearly.

| Token   | oklch                  | Hex approx | Hue |
|---------|------------------------|-----------|-----|
| `--r1`  | `oklch(0.62 0.13 45)`  | `#c97a4a` | terracotta |
| `--r2`  | `oklch(0.62 0.13 95)`  | `#a59045` | mustard |
| `--r3`  | `oklch(0.58 0.12 150)` | `#5a8a5e` | sage (overlaps olive — use only when r1/r2/r4/r5 already used) |
| `--r4`  | `oklch(0.62 0.13 245)` | `#5b86c0` | dusty blue |
| `--r5`  | `oklch(0.58 0.13 320)` | `#a064a6` | mauve |

### 1.5 Semantic

| Token       | oklch                  | Hex approx | Use |
|-------------|------------------------|-----------|-----|
| `--success` | `oklch(0.58 0.12 150)` | `#5a8a5e` | "Live" pill, ack indicators |
| `--warning` | `oklch(0.74 0.13 75)`  | `#d4a64a` | "Draft", unpublished |
| `--error`   | `oklch(0.58 0.18 28)`  | `#c14a3a` | Network errors, abandoned |

### 1.6 Per-mode role tokens

```css
/* Studio mode root selector: .studio (or apply to <body> in Studio routes) */
.studio {
  --bg: var(--n-50);
  --surface: var(--n-0);
  --surface-2: var(--n-100);
  --surface-3: var(--n-150);
  --border: var(--n-200);
  --border-strong: var(--n-300);
  --text: var(--n-900);
  --text-mute: var(--n-600);
  --text-faint: var(--n-500);
  --accent: var(--olive-700);
  --accent-soft: color-mix(in oklch, var(--olive-500) 12%, var(--n-0));
  --accent-fg: var(--cream-50);
}

/* Funnel mode root selector: .funnel (apply to public funnel route + webview iframe) */
.funnel {
  --fbg: var(--cream-100);
  --fsurf: var(--cream-50);
  --fsurf2: var(--cream-200);
  --fborder: var(--cream-300);
  --fborder-s: var(--cream-400);
  --ftext: var(--olive-900);
  --ftext-m: color-mix(in oklch, var(--olive-900) 50%, var(--cream-100));
  --ftext-f: color-mix(in oklch, var(--olive-900) 30%, var(--cream-100));
  --faccent: var(--olive-500);
  --faccent-d: var(--olive-700);
  --faccent-fg: var(--cream-50);
}
```

---

## 2. Typography

Three families. Pick by mode + role:

| Var       | Family                                    | Used for |
|-----------|-------------------------------------------|----------|
| `--font-d` | Instrument Serif (italic-leaning display) | Funnel headlines, section titles, board headers |
| `--font-s` | Geist                                     | Body, UI labels, all sans usage |
| `--font-m` | Geist Mono                                | Eyebrow/caption labels, data, kbd, terminal |

```html
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Geist:wght@300;400;500;600;700&family=Geist+Mono:wght@400;500;600&display=swap" rel="stylesheet" />
```

In Next.js 16, prefer `next/font/google` to self-host:

```ts
import { Instrument_Serif, Geist, Geist_Mono } from "next/font/google";
export const fontDisplay = Instrument_Serif({ subsets:["latin"], weight:["400"], style:["normal","italic"], variable:"--font-d" });
export const fontSans    = Geist({ subsets:["latin"], weight:["300","400","500","600","700"], variable:"--font-s" });
export const fontMono    = Geist_Mono({ subsets:["latin"], weight:["400","500","600"], variable:"--font-m" });
```

### 2.1 Type scale (clamp values for fluid display sizing)

| Role               | Family       | Size         | Weight | Line-height | Letter-spacing | Notes |
|--------------------|--------------|--------------|--------|-------------|----------------|-------|
| Display 3XL        | `--font-d`   | 56px / 3.5rem| 400 italic | 1.05    | -0.01em | Hero on funnel intro screens |
| Display 2XL        | `--font-d`   | 44px         | 400 italic | 1.08    | -0.005em | Funnel question H1 |
| Display XL         | `--font-d`   | 32px         | 400 italic | 1.1     | -0.005em | Public funnel mobile H1 |
| Display L          | `--font-d`   | 26px         | 400 italic | 1.15    | -0.005em | Studio panel titles, board headers |
| Display M          | `--font-d`   | 22px         | 400 italic | 1.2     | -0.005em | Sub-panel titles |
| Display S          | `--font-d`   | 18px         | 400 italic | 1.25    | 0       | Card titles |
| Body L             | `--font-s`   | 17px         | 400    | 1.55        | 0       | Funnel body copy |
| Body M             | `--font-s`   | 15px         | 400    | 1.55        | 0       | Default body |
| Body S             | `--font-s`   | 13.5px       | 400    | 1.5         | 0       | Secondary, table cells |
| Label              | `--font-s`   | 12px         | 500    | 1.4         | 0       | Form labels |
| Eyebrow            | `--font-m`   | 11px         | 500    | 1.3         | 0.08em uppercase | Section eyebrows |
| Caption            | `--font-m`   | 10.5px       | 500    | 1.3         | 0.06em uppercase | Tags, status pills |
| Mono S             | `--font-m`   | 11.5px       | 400    | 1.5         | 0       | Data, JSON, kbd |

Apply `font-feature-settings: "ss01"` on Geist body for the rounded-a stylistic set.

---

## 3. Spacing

8px base. Use Tailwind's default scale (which is 4px/0.25rem-based) and stick
to even multiples — every measurement in the prototypes lands on a multiple
of 4px. Avoid 5/7/9-px values.

| Token  | px | Used for |
|--------|----|----------|
| `--s-1` | 4   | Tight icon gaps |
| `--s-2` | 8   | Default flex gap |
| `--s-3` | 12  | List item gap |
| `--s-4` | 16  | Card padding-y |
| `--s-5` | 20  | Card padding-x |
| `--s-6` | 24  | Section padding |
| `--s-8` | 32  | Major section gap |
| `--s-10`| 40  | Hero block padding |
| `--s-12`| 48  | Top-of-page hero padding |
| `--s-16`| 64  | Between major boards |

---

## 4. Radius, shadow, motion

### 4.1 Radius

| Token       | Value | Use |
|-------------|-------|-----|
| `--r-sm`    | 6px   | Inputs, small chips |
| `--r-md`    | 10px  | Studio cards, secondary buttons |
| `--r-lg`    | 16px  | Studio panels, dashboard cards |
| `--r-xl`    | 22px  | Funnel desktop frame |
| `--r-full`  | 999px | Pills, status indicators |

Funnel-mode CTAs use **18px** literal (not a token) — a deliberate
between-`lg`-and-`xl` to feel friendly-rounded without being capsule.

### 4.2 Shadow

```css
--sh-1: 0 1px 2px rgba(38,44,30,.05), 0 1px 1px rgba(38,44,30,.04);
--sh-2: 0 2px 4px rgba(38,44,30,.06), 0 4px 12px rgba(38,44,30,.05);
--sh-3: 0 4px 8px rgba(38,44,30,.06), 0 12px 28px rgba(38,44,30,.08);
```

Shadows use a warm-tinted RGB (38,44,30) instead of pure black so they read
as "olive-tinted shadow" on cream backgrounds — keeps the palette coherent.

### 4.3 Motion

| Token     | Value | Use |
|-----------|-------|-----|
| `--m-fast` | 120ms | Hover, tap feedback |
| `--m-mid`  | 200ms | Toggle, expand/collapse |
| `--m-med`  | 320ms | Inter-screen transitions |

Easings:
- `--ease: cubic-bezier(0.2, 0, 0, 1)` — default UI ease
- `--ease-em: cubic-bezier(0.3, 0, 0, 1)` — emphasized (CTA presses, screen advance)

Inter-screen funnel transition: outgoing slides left + fades, incoming slides
in from right + fades. Duration `--m-med`, easing `--ease-em`. See
SHARED_CHROME.md.

---

## 5. Tailwind v4 config

Tailwind v4 reads tokens directly from CSS. Add this to `app/globals.css`
**after** the `:root` block from §6:

```css
@theme inline {
  --color-olive-50: var(--olive-50);
  --color-olive-100: var(--olive-100);
  --color-olive-300: var(--olive-300);
  --color-olive-500: var(--olive-500);
  --color-olive-700: var(--olive-700);
  --color-olive-900: var(--olive-900);

  --color-cream-50: var(--cream-50);
  --color-cream-100: var(--cream-100);
  --color-cream-200: var(--cream-200);
  --color-cream-300: var(--cream-300);
  --color-cream-400: var(--cream-400);

  --color-r1: var(--r1);
  --color-r2: var(--r2);
  --color-r3: var(--r3);
  --color-r4: var(--r4);
  --color-r5: var(--r5);

  --font-display: var(--font-d);
  --font-sans: var(--font-s);
  --font-mono: var(--font-m);

  --radius-sm: var(--r-sm);
  --radius-md: var(--r-md);
  --radius-lg: var(--r-lg);
  --radius-xl: var(--r-xl);

  --shadow-1: var(--sh-1);
  --shadow-2: var(--sh-2);
  --shadow-3: var(--sh-3);
}
```

Then `text-olive-700`, `bg-cream-100`, `font-display`, `rounded-xl`,
`shadow-2` all work as Tailwind utilities.

For shadcn/ui, override these tokens in your `components.json`-installed
defaults so `--background`, `--foreground`, `--primary`, etc. map onto the
mode-aware role tokens above. Specifically:

```css
.studio {
  --background: var(--bg);
  --foreground: var(--text);
  --card: var(--surface);
  --card-foreground: var(--text);
  --primary: var(--accent);
  --primary-foreground: var(--accent-fg);
  --muted: var(--surface-2);
  --muted-foreground: var(--text-mute);
  --border: var(--border);
  --input: var(--border);
  --ring: var(--accent);
}
.funnel {
  --background: var(--fbg);
  --foreground: var(--ftext);
  --card: var(--fsurf);
  --card-foreground: var(--ftext);
  --primary: var(--faccent);
  --primary-foreground: var(--faccent-fg);
  --muted: var(--fsurf2);
  --muted-foreground: var(--ftext-m);
  --border: var(--fborder);
  --input: var(--fborder);
  --ring: var(--faccent);
}
```

---

## 6. The complete `:root` block

Paste this into `app/globals.css` at the top:

```css
:root {
  /* Olive */
  --olive-50:  oklch(0.96 0.018 125);
  --olive-100: oklch(0.88 0.035 128);
  --olive-300: oklch(0.66 0.055 130);
  --olive-500: oklch(0.46 0.058 132);
  --olive-700: oklch(0.32 0.045 134);
  --olive-900: oklch(0.20 0.030 135);

  /* Cream */
  --cream-50:  oklch(0.985 0.006 85);
  --cream-100: oklch(0.965 0.012 84);
  --cream-200: oklch(0.940 0.018 82);
  --cream-300: oklch(0.905 0.022 80);
  --cream-400: oklch(0.860 0.024 78);

  /* Result accents */
  --r1: oklch(0.62 0.13 45);
  --r2: oklch(0.62 0.13 95);
  --r3: oklch(0.58 0.12 150);
  --r4: oklch(0.62 0.13 245);
  --r5: oklch(0.58 0.13 320);

  /* Cool neutrals */
  --n-0:   #fff;
  --n-50:  oklch(0.985 0.002 250);
  --n-100: oklch(0.965 0.004 250);
  --n-150: oklch(0.945 0.005 250);
  --n-200: oklch(0.925 0.006 250);
  --n-300: oklch(0.870 0.008 250);
  --n-400: oklch(0.720 0.010 250);
  --n-500: oklch(0.560 0.012 250);
  --n-600: oklch(0.440 0.014 250);
  --n-700: oklch(0.320 0.014 250);
  --n-800: oklch(0.220 0.012 250);
  --n-900: oklch(0.140 0.010 250);

  /* Semantic */
  --success: oklch(0.58 0.12 150);
  --warning: oklch(0.74 0.13 75);
  --error:   oklch(0.58 0.18 28);

  /* Type */
  --font-d: "Instrument Serif", Iowan Old Style, Georgia, serif;
  --font-s: "Geist", ui-sans-serif, system-ui, sans-serif;
  --font-m: "Geist Mono", ui-monospace, "SF Mono", monospace;

  /* Radius */
  --r-sm: 6px;
  --r-md: 10px;
  --r-lg: 16px;
  --r-xl: 22px;
  --r-full: 999px;

  /* Shadow */
  --sh-1: 0 1px 2px rgba(38,44,30,.05), 0 1px 1px rgba(38,44,30,.04);
  --sh-2: 0 2px 4px rgba(38,44,30,.06), 0 4px 12px rgba(38,44,30,.05);
  --sh-3: 0 4px 8px rgba(38,44,30,.06), 0 12px 28px rgba(38,44,30,.08);

  /* Motion */
  --m-fast: 120ms;
  --m-mid:  200ms;
  --m-med:  320ms;
  --ease:    cubic-bezier(0.2, 0, 0, 1);
  --ease-em: cubic-bezier(0.3, 0, 0, 1);
}
```

The mode role-token blocks from §1.6 go directly below this.
