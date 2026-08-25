---
name: Agiliza Imóveis
description: A restrained neutral-zinc CRM with one navy identity accent, realigned to match the public Agiliza Imóveis site's design system (Able Development).
colors:
  bg-page: "#ffffff"
  bg-panel: "#fafafa"
  bg-panel-raised: "#ffffff"
  bg-inset: "#f1f1f3"
  ink: "#18181b"
  ink-secondary: "#71717a"
  ink-tertiary: "#a1a1aa"
  rule: "#e4e4e7"
  rule-strong: "#d4d4d8"
  accent: "#13315c"
  accent-hover: "#0d2440"
  status-neutral: "= ink-secondary"
  status-active: "= accent"
  status-success: "#15803d"
  status-danger: "#b91c1c"
  status-warning: "#a15c07"
  status-advancing: "#0f766e"
  whatsapp-brand: "#25d366"
  whatsapp-brand-hover: "#1ebe57"
  whatsapp-icon-ink: "#0e0c0a"
  dark-bg-page: "#0a0a0b"
  dark-bg-panel: "#161618"
  dark-bg-panel-raised: "#1f1f22"
  dark-bg-inset: "#0a0a0b"
  dark-ink: "#f4f4f5"
  dark-ink-secondary: "#a1a1aa"
  dark-ink-tertiary: "#71717a"
  dark-rule: "#303033"
  dark-rule-strong: "#3f3f42"
  dark-accent: "#6f9bd6"
  dark-accent-hover: "#8fb3e3"
typography:
  fontFamily: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
  scale:
    agenda-week-hour-label: "0.52rem"
    photo-origin-tag: "0.7rem"
    price-label: "0.7rem"
    meta-micro: "0.72rem"
    kanban-meta: "0.74rem"
    badge-code: "0.76rem"
    stat-label: "0.78rem"
    form-label: "0.8rem"
    label: "0.82rem"
    form-text: "0.85rem"
    button-tab: "0.86rem"
    body: "0.9rem"
    team-name: "1rem"
    kanban-title: "0.92rem"
    price-value: "1.05rem"
    card-title: "1.08rem"
    masthead: "1.15rem"
    modal-title: "1.2rem"
    mobile-header: "1.3rem"
    dashboard-queue-value: "1.4rem"
    login-title: "1.5rem"
    header-title: "1.55rem"
    stat-value: "2.1rem"
  numeric:
    fontVariantNumeric: "tabular-nums"
    note: "No separate mono face. Tabular/aligned figures (prices, codes, dates, phone) use Inter with font-variant-numeric: tabular-nums instead of a monospace font."
rounded:
  sm: "10px"
  md: "12px"
  full: "9999px"
spacing:
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "32px"
components:
  button-primary:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.bg-panel-raised}"
    rounded: "{rounded.sm}"
    padding: "9px 18px"
  button-primary-hover:
    backgroundColor: "{colors.accent-hover}"
  status-badge:
    rounded: "{rounded.sm}"
    padding: "3px 10px"
  nav-item-active:
    backgroundColor: "{colors.accent}-soft"
    textColor: "{colors.accent}"
  card:
    backgroundColor: "{colors.bg-panel}"
    rounded: "{rounded.md}"
    border: "1px solid {colors.rule}"
    padding: "24px"
---

# Design System: Agiliza Imóveis

## Overview

**Realigned 2026-08-25 to the Able Development system** — the design-principles doc for the public-facing Agiliza Imóveis site (a real-estate-auction listing portal, built by the user's own company). This is a full identity replacement of the CRM's previous "Seção de Editais" system (newsprint palette, carimbo-roxo accent, Bitter/Barlow/Barlow Condensed/JetBrains Mono four-font stack, hairline "ruled sheet" grids, border-style-as-status, rotated hand-stamped badges and a carimbo notary-stamp motif). None of that survives this pass; it is anti-reference only.

The brief was **pinned**, not open for ideation: exact palette, font, and principles came from `principios-de-design.html` (Able Development), confirmed by the user as their own company's real brand. Three scope decisions the user made explicitly: keep the dark-mode toggle (adapted, navy accent stays a real color in both themes rather than going monochrome), drop the carimbo motif with no replacement decoration, redesign every view.

**Key Characteristics:**
- Neutral zinc/white base so content (property photos, lote/lead/task data) is the protagonist; **navy (`#13315C`)** is the one identity accent — buttons, active nav/tabs, focus rings, links, "doing"/active status.
- Inter everywhere, no separate display/label/mono faces. Tabular numeric data uses `font-variant-numeric: tabular-nums` on Inter, not a monospace font.
- Generous 10–12px corner radius on cards, buttons, inputs, badges — a genuine departure from both the old sharp 3–4px "editais" radius and a pill-shaped default. `radius-full` (true circle) is reserved for avatars and the WhatsApp round icon button only.
- Lotes/Equipe/Kanban are **individual bordered, shadowed, rounded cards with a grid gap** — not a single hairline-divided "ruled sheet" container (the previous system's signature structure). This mirrors the Able doc's own layout evidence (its color-swatch grid uses individual bordered boxes).
- Status is carried by **color + label only** — no border-style-as-mark (solid/dashed/double), no `-2deg` rotation. Both were specific to the retired hand-stamped world.
- Dark mode is a **real, conventional dark theme** (dark page + progressively lighter panel tiers), not the previous system's "black void + white floating panels" inversion. The navy accent lightens to `#6F9BD6` for contrast against dark surfaces rather than collapsing to monochrome — this brief's identity color is core in any theme, unlike the retired system's "no color at all" dark mode.

## Colors

### Primary
- **Accent / Navy** (`#13315c`, hover `#0d2440`, soft fill `rgba(19,49,92,0.08)`): the one identity accent. Buttons, active nav/toggle/tab state, focus rings, "doing"/active status, the logo (already navy — `public/logo-agiliza-ink.png` needed no swap for this pass, unlike the previous redesign). Dark mode lightens this to `#6f9bd6` (soft `rgba(111,155,214,0.14)`) so it stays legible and identity-bearing against a dark ground.

### Neutral (zinc scale)
- **Bg Page** (`#ffffff`): app background.
- **Bg Panel** (`#fafafa`): sidebar, header, cards, table backgrounds.
- **Bg Panel Raised** (`#ffffff`): modals, login card, "on-accent" text/icon color (works in both themes — see Named Rules).
- **Bg Inset** (`#f1f1f3`): recessed fills, kanban columns, hover backgrounds, scrollbar track.
- **Ink** (`#18181b`) / **Ink Secondary** (`#71717a`) / **Ink Tertiary** (`#a1a1aa`): primary/secondary/muted text.
- **Rule** (`#e4e4e7`) / **Rule Strong** (`#d4d4d8`): hairline dividers and input/button borders.

### Semantic / Status (separate from the accent)
- **Success** `#15803d`, **Danger** `#b91c1c`, **Warning** `#a15c07`, **Advancing** `#0f766e`, **Neutral** `= ink-secondary`, **Active** `= accent`. Each ships a `soft` background variant for badge fills, paired with the solid hue for text — this pairing is what makes `--accent` safe to reuse as text-on-soft-fill in both themes without a separate contrast token.

### Third-Party Brand Exception
`.whatsapp-btn` keeps WhatsApp's own green (`#25d366`/`#1ebe57`) and near-black icon ink (`#0e0c0a`) in both themes — unchanged from the previous system, still deliberately outside the palette.

### Dark Mode
Real dark theme (not an inversion): `--bg-page: #0a0a0b`, `--bg-panel: #161618`, `--bg-panel-raised: #1f1f22` — progressively lighter tiers, same relationship as light mode, just dark. Text/rule tokens follow the same pattern lightened for contrast. The accent becomes `#6f9bd6` (a lighter navy tint) rather than desaturating to gray — status hues also stay real, brighter colors rather than collapsing to monochrome.

### Named Rules
**The On-Accent Text Rule.** Anywhere text/an icon sits directly on a solid `--accent` fill (buttons, `.toggle-btn.active`), use `var(--bg-panel-raised)` as the foreground, never a literal white. In light mode that's white-on-navy (high contrast); in dark mode `--bg-panel-raised` is dark (`#1f1f22`), which reads correctly as dark-on-light-blue against the lightened dark-mode accent. A literal `#ffffff` breaks in dark mode — this bit the first draft of this pass (`.nav-item.active`/`.toggle-btn.active`) and was caught before shipping.

**The Soft-Accent Rule for smaller marks.** Where a solid accent fill would risk contrast trouble (e.g. `.nav-item.active`, which is a small persistent nav row, not a large CTA), use the `accent-soft` background + `accent` text/icon pairing instead of a solid fill — the same pairing the status-badge system already relies on, proven safe in both themes.

## Typography

Inter only, weights 400–800. No separate display/label/mono face — the previous system's four-font stack (Bitter/Barlow/Barlow Condensed/JetBrains Mono) is fully retired; `--font-display`, `--font-body`, `--font-label`, and `--font-mono` all resolve to Inter now (kept as four CSS variables only so existing component rules didn't need touching, not because the faces differ).

**Tabular data:** every rule that previously relied on JetBrains Mono for figure alignment (prices, lote codes, dates, phone numbers, stat values) now pairs `font-family: var(--font-mono)` with `font-variant-numeric: tabular-nums` — Inter supports tabular figures, so aligned numeric columns still line up without a monospace face.

**Tracking:** uppercase label tracking was pulled in from the old system's 0.08–0.12em (tuned for condensed Barlow Condensed) down to ~0.05em, which reads better on regular-width Inter at small sizes.

### Named Rules
No masthead/nameplate distinction anymore — the Dashboard's date line (`.masthead-date`) lost its newspaper "Edição de Hoje" framing and italic serif treatment; it is now a plain date heading in Inter, non-italic, with a simple 1px rule underneath instead of a 2px ink rule.

## Shapes

Corners are generous, not sharp or pill-shaped: `--radius-sm` (10px) for buttons, inputs, badges, icon buttons, nav items, kanban cards; `--radius-md` (12px) for cards, panels, modals. `--radius-full` (true circle) stays reserved for avatars and the WhatsApp button — this is unchanged in spirit from the previous system's rule, just at a much larger base radius.

## Elevation & Layout

**Individual Cards, Not Ruled Sheets (changed this pass).** Lotes and Equipe are now `display: grid; gap: 16px` of independent `.lote-card`/`.team-card` elements, each with its own `border` + `border-radius` + `--shadow-sm`; hover strengthens the border to `--accent` and raises the shadow to `--shadow-md`. Kanban cards followed the same change (individual bordered/rounded cards with a `margin-bottom` gap, hover border-to-accent) instead of flush hairline-divided rows. This reverses the previous system's "Ruled-Sheet Rule" deliberately — the Able doc's own layout (its color-swatch grid) uses individually bordered boxes, and this is now the CRM's convention too.

Two shadow tokens: `--shadow-sm` (`0 1px 2px rgba(24,24,27,0.06)`) at rest, `--shadow-md` (`0 12px 28px -8px rgba(24,24,27,0.18)`) for modals and card hover.

## Components

### Buttons
Solid navy fill (primary), 10px radius, `--bg-panel-raised` text (see On-Accent Text Rule). Secondary stays a bordered ghost button. No pill shape.

### Status Badges
Small rounded-rect tag (`--radius-sm`), 1px border (mostly transparent — color comes from the soft background + solid-hue text), no border-style-as-state and no rotation. State reads purely from hue + label text.

### Cards / Grids
Lotes, Equipe, Kanban: individual cards per item (see Elevation & Layout above). Property-card photos still fill their frame edge-to-edge with a placeholder for missing photos (unchanged, matches the Able doc's own photo principle). The "Origem: Leilão" fact (every lote originates from judicial-auction inventory) is now a plain bottom-left tag on the photo (`.photo-origin-tag`, translucent navy fill, white text) — replacing the carimbo stamp that used to mark this.

### Navigation
Active nav item: `accent-soft` background + `accent` text/icon (see Named Rules). Active view-toggle/tab buttons: solid `accent` fill + `bg-panel-raised` text.

## Do's and Don'ts

### Do:
- **Do** use the navy accent (`#13315C`) for actionable/active states — primary buttons, active nav/tabs, focus rings — and reach for `accent-soft` + `accent` text when a solid fill would risk contrast (small persistent UI, not large CTAs).
- **Do** give any new grid/list surface individual bordered/rounded cards with a `gap`, not a single-container hairline sheet.
- **Do** add `font-variant-numeric: tabular-nums` to any new rule that displays tabular/numeric data in Inter.
- **Do** keep dark mode a real dark theme (progressively lighter panel tiers) with the accent staying a real, lightened color — not a monochrome/inverted-panel treatment.

### Don't:
- **Don't** reintroduce the carimbo motif, border-style-as-status, or badge rotation — all retired by explicit user decision on this pass.
- **Don't** use a literal `#ffffff` for text/icons on a solid accent fill; use `var(--bg-panel-raised)`, which is theme-correct in both directions (see Named Rules).
- **Don't** revert Lotes/Equipe/Kanban to hairline-divided single-container sheets — individual cards are the current, deliberate convention.
- **Don't** reintroduce Bitter/Barlow/Barlow Condensed/JetBrains Mono; Inter is the whole system now, matching the public site.
