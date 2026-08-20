---
name: Agiliza Imóveis
description: A light-mode editorial CRM that reads like a Brazilian newspaper's classifieds/legal-notices page ("Seção de Editais"), not a generic dark SaaS dashboard.
colors:
  paper-page: "#e4e3dd"
  paper-panel: "#f1f0ea"
  paper-panel-raised: "#faf9f5"
  paper-inset: "#dcdbd2"
  ink: "#1b1912"
  ink-secondary: "#5c564a"
  ink-tertiary: "#615a4c"
  rule: "#c7c2b6"
  rule-strong: "#7a7461"
  accent-carimbo-roxo: "#5a2a6b"
  accent-hover: "#431f52"
  stamp-ink: "rgba(20,18,14,0.42)"
  stamp-ring: "rgba(20,18,14,0.58)"
  status-neutral: "#5c564a"
  status-active: "#5a2a6b"
  status-success: "#3f6b3a"
  status-danger: "#8b3a2b"
  status-warning: "#7a5c1a"
  status-advancing: "#2e6b66"
  whatsapp-brand: "#25d366"
  whatsapp-brand-hover: "#1ebe57"
  whatsapp-icon-ink: "#0e0c0a"
  dark-bg-page: "#000000"
  dark-bg-panel: "#f2f2f2"
  dark-bg-panel-raised: "#ffffff"
  dark-bg-inset: "#e2e2e2"
  dark-ink: "#0a0a0a"
  dark-ink-secondary: "#3d3d3d"
  dark-ink-tertiary: "#5c5c5c"
  dark-rule: "#999999"
  dark-rule-strong: "#737373"
  dark-accent: "#000000"
  dark-accent-hover: "#2b2b2b"
  dark-on-page-text: "#a3a3a3"
  dark-on-page-text-strong: "#ffffff"
typography:
  scale:
    carimbo-text: "0.52rem"
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
  display:
    fontFamily: "Bitter, Georgia, serif"
    fontSize: "1.55rem"
    fontWeight: 600
    lineHeight: 1.3
    letterSpacing: "-0.01em"
  body:
    fontFamily: "Barlow, -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif"
    fontSize: "0.9rem"
    fontWeight: 400
    lineHeight: 1.4
  label:
    fontFamily: "Barlow Condensed, Barlow, sans-serif"
    fontSize: "0.82rem"
    fontWeight: 600
    letterSpacing: "0.08em"
    fontFeature: "uppercase"
  mono:
    fontFamily: "JetBrains Mono, Consolas, monospace"
    fontSize: "0.9rem"
    fontFeature: "tabular-nums"
    letterSpacing: "0.02em"
rounded:
  sm: "3px"
  md: "4px"
  full: "9999px"
spacing:
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "32px"
components:
  button-primary:
    backgroundColor: "{colors.accent-carimbo-roxo}"
    textColor: "{colors.paper-panel-raised}"
    typography: "{typography.label}"
    rounded: "{rounded.sm}"
    padding: "9px 18px"
  button-primary-hover:
    backgroundColor: "{colors.accent-hover}"
  button-secondary:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    rounded: "{rounded.sm}"
    padding: "9px 18px"
  status-badge:
    typography: "{typography.label}"
    rounded: "{rounded.sm}"
    padding: "3px 10px"
  nav-item-active:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.paper-panel-raised}"
    rounded: "{rounded.sm}"
  card:
    backgroundColor: "{colors.paper-panel}"
    rounded: "{rounded.md}"
    padding: "24px"
---

# Design System: Agiliza Imóveis

## Overview

**Creative North Star: "Seção de Editais" (the auction-classifieds page of a Brazilian newspaper)**

Agiliza Imóveis reads as a printed page of legal notices, not a SaaS control panel: a light, slightly warm newsprint ground, near-black ink for text, a single stamp-colored accent, and structure built from ruled hairlines rather than floating boxed cards. Every record — a lote, a lead, a task, a visit — behaves like a published notice: nothing disappears, it gets carimbado (stamped) with a new status. Density is real (a tabular stat row, a numbered task column, ruled sheets of lotes and team members) but never cramped; whitespace comes from rhythm and rule lines, not from padding-heavy cards.

This is a full-identity replacement, not a reskin. The previous system — a near-black "23.4studios" dashboard with a blue accent, pill-shaped buttons, and Archivo/Fragment Mono type — was explicitly disavowed by the user as belonging to a different business and is treated purely as anti-reference. The flip from dark to light is a deliberate scene judgment (newsprint reads as a daylight, paper material) and the move away from pill radii is a deliberate rejection of "rounded SaaS" language. A future session must not "restore dark mode" or reintroduce pill buttons without recognizing both were rejected on purpose.

**Key Characteristics:**
- Light newsprint ground (#E4E3DD) with near-black ink (#1B1912), never dark mode.
- One identity accent — carimbo roxo, ink-stamp violet (#5A2A6B) — kept separate from a distinct five-color semantic/status palette.
- Status is a mark, not only a hue: border-style (solid/dashed/double) carries semantic weight alongside color.
- Grid surfaces (Lotes, Equipe, Kanban) are one ruled sheet with hairline-divided cells, never independent floating shadowed cards.
- Sharp, small corner radii (3-4px) everywhere except true circles (avatars, WhatsApp button); no pill buttons.
- Four-family type system: Bitter (serif display), Barlow (body), Barlow Condensed (uppercase "classified column-head" labels), JetBrains Mono (tabular figures).

## Colors

The palette is restrained: one warm-neutral "paper" scale for structure, one violet accent for identity/interaction, and a separate five-color semantic scale for status — the two systems are never conflated.

### Primary
- **Carimbo Roxo** (`#5a2a6b`, hover `#431f52`, soft fill `rgba(90,42,107,0.1)`): the single identity accent as originally specified. **Correction 2026-08-20:** `--accent` in the shipped light-mode CSS is actually `#1b1912` (= `--ink`), not this violet — it silently regressed to monochrome in commit `379866b` (2026-08-18), and the user explicitly chose to keep that regression rather than restore the violet ("eu quero preto e branco mesmo"). Treat the app as intentionally monochrome in both themes going forward; this violet value is historical, not live. Do not "fix" `--accent` back to violet without asking first.
- **Stamp Ink** (`rgba(20,18,14,0.42)`) / **Stamp Ring** (`rgba(20,18,14,0.58)`): the carimbo (notary-stamp) motif's ink and ring color — translucent by design (a real stamp is never fully opaque). This is the system's one signature visual device, used sparingly: the lote-card "Origem Leilão" mark, the login screen's "Acesso Restrito" mark, and the Agenda calendar's "today" cell. See Components → Carimbo below.

### Neutral (paper scale)
- **Paper Page** (`#e4e3dd`): the app's base ground — the "newsprint" surface behind everything.
- **Paper Panel** (`#f1f0ea`): cards, sidebar, header, table backgrounds — one step lighter than the page.
- **Paper Panel Raised** (`#faf9f5`): modals, login card, the active-state text-on-ink color — the "brightest sheet."
- **Paper Inset** (`#dcdbd2`): recessed fills — kanban columns, hover backgrounds, static form fields, scrollbar track.
- **Ink** (`#1b1912`): primary text, headings, active nav background.
- **Ink Secondary** (`#5c564a`): labels, secondary text, table headers, inactive nav.
- **Ink Tertiary** (`#615a4c`): placeholders, muted meta text, disabled-leaning content.
- **Rule** (`#c7c2b6`): the default hairline — card borders, table row dividers, grid cell dividers.
- **Rule Strong** (`#7a7461`): heavier borders — input borders, view-toggle borders, dashed kanban-add outline.

### Semantic / Status (separate system — do not conflate with the accent)
- **Status Success** (`#3f6b3a`): completed tasks, "Realizada" visits, positive trend.
- **Status Danger** (`#8b3a2b`): overdue/late, delete actions, form errors.
- **Status Warning** (`#7a5c1a`): "leilão" (auction-pending) state.
- **Status Advancing** (`#2e6b66`): "em proposta" / progressing-forward states — a teal distinct from success green.
- **Status Neutral** (`= ink-secondary`): todo/default state.
- **Status Active** (`= accent`): "doing"/in-progress states — the only place the identity accent doubles as a status color.

All status colors ship a `soft` background variant at ~10-12% opacity for badge fills, and pair with `--ink`-family text for 4.5:1+ contrast on paper backgrounds.

### Third-Party Brand Exception
The `.whatsapp-btn` (lote-card lead rows) uses WhatsApp's own brand green (`#25d366`, hover `#1ebe57`) and a near-black icon ink (`#0e0c0a`) instead of any system token. This is intentional and permanent: recoloring it into the carimbo-roxo accent or the paper/ink scale would make a recognizable third-party affordance look broken or unbranded. Do not fold these three values into the system palette or flag them as drift — they are deliberately outside it.

### Named Rules
**The Two-Palette Rule.** The carimbo-roxo accent (identity, interaction, emphasis) and the five-color status palette (task/lote/lead/visit state) are separate systems. Don't recruit a status color for a UI accent role, and don't extend the accent into new status meanings beyond the existing "doing" reuse.

### Dark Mode (opt-in, pure monochrome)
Added 2026-08-16 as a user-toggleable alternate theme (sidebar toggle, persisted to `localStorage`, default stays light — this does not reopen "never dark mode as default," it adds a second theme the visitor chooses). Activated via `:root[data-theme="dark"]`, which redefines the same custom-property names the light theme uses — no component CSS branches on theme, only the token values change.

**The palette drops every hue on purpose** (explicit user instruction: "sem cor nenhuma" — no color at all), including the carimbo-roxo accent and all five status colors. It is a black/white/gray system:
- `--bg-page: #000000` (pure black — the void behind every surface, was the warm newsprint gray)
- `--bg-panel: #f2f2f2`, `--bg-panel-raised: #ffffff`, `--bg-inset: #e2e2e2` (the "paper" tier flips from off-white to true white — cards, sidebar, header, modals all read as white sheets floating on black)
- `--ink: #0a0a0a`, `--ink-secondary: #3d3d3d`, `--ink-tertiary: #5c5c5c` (near-black text tuned for the white panels)
- `--rule: #999999`, `--rule-strong: #737373` (darkened relative to the light theme's values so hairlines stay visible against white panels, not just against the page)
- `--accent` and all `--status-*` tokens collapse to `#000000` (text/border) with a ~6-8% black tint for their `-soft` fills — **status is legible through border-style alone** (solid/dashed/double, see Status Badges below), which is exactly what that rule was already built to survive without color.

**Named Rule — Page-Level Text Exception.** `.status-tabs` and its children (`.status-tab`, `.status-tab.active`, `.status-tab-count`) are the one component that sits directly on `--bg-page` rather than on a white panel. The `--ink-*` tokens are tuned for text-on-white and go near-invisible on black, so this component carries its own dark-mode-only literal colors instead of the shared tokens: `#a3a3a3` (inactive tab text), `#ffffff` (hover/active tab text and the active tab's underline, replacing `--accent`), `rgba(255,255,255,0.16)` (active tab's count-badge fill). If a future component needs to render text directly on `--bg-page` in dark mode, follow this same pattern (dedicated `:root[data-theme="dark"] .your-class` rule with a literal light-on-black color) rather than reusing `--ink-secondary`/`--ink`, which will silently fail contrast there.

The WhatsApp brand exception (green button) is unchanged in dark mode — third-party brand color, not a system hue, stays as-is in both themes.

## Typography

**Display Font:** Bitter (with Georgia, serif fallback)
**Body Font:** Barlow (with system sans-serif fallback)
**Label/Mono Font:** Barlow Condensed for uppercase labels/tabs/buttons; JetBrains Mono for tabular figures.

**Character:** A serif/grotesque/condensed/mono four-part system mirrors an actual newspaper's type stack — serif for headlines, humanist sans for body copy, a condensed uppercase face for classified column-heads and section labels, and a monospace face wherever numbers must line up (codes, prices, dates, CPF, phone).

**The Fine-Grained Scale Rule.** This is a 22-step editorial scale, not a sparse 4-token system: `0.52, 0.7, 0.72, 0.74, 0.76, 0.78, 0.8, 0.82, 0.85, 0.86, 0.9, 0.92, 1, 1.05, 1.08, 1.15, 1.2, 1.3, 1.4, 1.5, 1.55, 2.1` (rem), listed by role name in `typography.scale`. Real newspaper type specs run in fine point-size increments per role (a caption is not the same size as a byline, which is not the same as a subhead), and this system deliberately follows that convention rather than a coarse 4-5-step UI ramp. `0.82rem` (label) and `0.9rem` (body/mono) are the two workhorse sizes and should be reached for first; every other step exists because a specific component role in the shipped app already uses it (e.g. `2.1rem` is exclusively the Dashboard stat-row's big number, `1.08rem` is exclusively lote-card/team-name titles). Adding a genuinely new size for a new role is fine — extend `typography.scale` when you do, so the next session's drift check stays honest — but reach for an existing step before inventing one, and never collapse this into a coarser scale to "clean it up"; that would flatten real, reviewed hierarchy.

### Hierarchy
- **Display** (Bitter, 600, 1.2-1.55rem, italic variant at 1.15rem for the masthead date): section headers (`.header-title`), card/lote/team titles, modal headings.
- **Title** (Bitter, 600, ~1rem-1.08rem): lote-card titles, team member names.
- **Body** (Barlow, 400-600, 0.85-0.92rem): table cells, lead/task/visit row text.
- **Label** (Barlow Condensed, 600-700, 0.7-0.86rem, uppercase, 0.04-0.12em tracking): nav items, card titles, status badges, form labels, buttons, tabs, kanban headers — the "classified column-head" voice.
- **Mono/Tabular** (JetBrains Mono, 400-700, tabular-nums): stat-row big numbers, prices, lote codes, phone numbers, dates in tables, kanban meta, avatar initials.

### Named Rules
**The Masthead Distinction Rule.** `.masthead-date` (italic Bitter, 1.15rem, own 2px ink underline) is a separate role from `.card-title` (Barlow Condensed, uppercase, 0.82rem label). It is the paper's own nameplate for "today's edition" on the Dashboard and must never collapse into a generic card title.

## Layout

The app shell is a fixed 260px sidebar plus a scrolling main column (`display: flex; height: 100vh`). Content pads at 32px on desktop. Grid surfaces (Lotes, Equipe) use `repeat(auto-fill, minmax(300px, 1fr))`. The Dashboard's stat row is a single flex row of three items divided by vertical rule lines, not three separate boxed stat cards. Kanban is a flex row of equal-width columns.

**Responsive layer** (first-class as of this pass, single breakpoint at `max-width: 900px`): the sidebar becomes an off-canvas drawer (translateX slide, 82vw/300px max, backdrop overlay, Escape-to-close, `aria-expanded`/`aria-controls`) triggered by a fixed hamburger button; the stat row stacks vertically with horizontal rules instead of vertical ones; lote/team grids and kanban collapse to a single column; multi-column forms (`.form-row`, `.form-row-3`, `.form-row-4`) collapse to one column; tables scroll horizontally inside a `.table-scroll` wrapper (`overflow-x: auto` on the wrapping div, never `display: block` on the `<table>` itself, which previously broke column layout).

## Elevation & Depth

Mostly flat with restrained ambient shadows, not a lifted/floating language. Two shadow tokens exist: `--shadow-sm` (`0 1px 2px rgba(27,25,18,0.1)`) for resting cards, the mobile menu button, and grid sheets; `--shadow-md` (`0 8px 20px -6px rgba(27,25,18,0.22)`) for modals, the login card, and the mobile sidebar drawer. Grid/list items (lote cards, team cards, kanban cards, nested lead/task rows) carry **no shadow of their own** — depth lives only at the outer sheet or overlay level. Hover on an interactive grid cell (lote card, kanban card) is a flat background tint plus an inset accent ring (`box-shadow: inset 0 0 0 1.5px var(--accent)`), never a lift or an added drop shadow.

### Named Rules
**The Ruled-Sheet Rule.** Lotes, Equipe, and Kanban are one bordered/shadowed/radiused container; individual cells inside contribute only `border-right`/`border-bottom` hairlines — no per-item radius, no per-item shadow, no hover-`translateY`. This was a finish-review-mandated correction after an earlier draft left independent floating cards in place; reintroducing per-item box-shadow + radius + lift in these contexts is the specific defect this system rejects.

**The Flat Nesting Rule.** A card/row nested inside another surface (a lead row inside a lote card, a task row inside a team card) is a plain ruled row (`border-bottom` only, no background box, no shadow) — the ruled-sheet logic applies recursively to nested content, not just top-level grids.

## Shapes

Corners are small and sharp by default: `--radius-sm` (3px) for buttons, badges, inputs, icon buttons, nav items; `--radius-md` (4px) for cards, panels, grid sheets, kanban columns, modals. `--radius-full` (9999px / true circle) is reserved for genuinely circular elements only — avatars (team, sidebar user) and the WhatsApp round-icon button. This is a deliberate rejection of the previous system's pill-shaped default buttons; no button, badge, tab, or input should use `--radius-full`.

Borders are structural, not decorative: 1px `--rule` for default dividers, 1.5-2px `--rule-strong`/`--ink` for emphasis (table header rule, modal header rule, masthead underline), and status badges use a 1.5px colored border whose *style* (solid/dashed/double) is itself meaningful (see Components → Status Badges).

## Components

### Buttons
- **Shape:** small sharp radius (`--radius-sm`, 3px), never pill-shaped.
- **Primary:** solid carimbo-roxo fill (`#5a2a6b`) with `--bg-panel-raised` text, 1.5px matching border, Barlow Condensed uppercase label, 9px 18px padding.
- **Hover / Focus:** primary darkens to `--accent-hover` (`#431f52`); all interactive elements use a 2px solid accent `outline` at 2px offset on `:focus-visible`, not a glow or shadow.
- **Secondary:** transparent fill, `--rule-strong` border, `--ink` text; hover fills with `--bg-inset`.
- **Icon buttons:** 32x32px, transparent, sharp radius, hover fills `--bg-inset`; a `-danger` variant hovers into the danger-soft/danger pairing.

### Status Badges
- **Style:** small sharp-radius pill-adjacent tag (not full-round), 1.5px border, uppercase Barlow Condensed label, colored soft background + matching ink text.
- **Border-style-as-state:** solid = todo/done/advancing baseline states, dashed = in-progress/pending (doing, leilão), double 3px = a terminal/alarm state (Atrasado/late) — border style is load-bearing semantics, not ornament.
- **Rotation:** static badges (`<span className="status-badge">`) carry a `-2deg` rotation for a hand-stamped feel via the `span.status-badge` selector. The one interactive reuse of these classes — Agenda's status `<select>` — is deliberately excluded from rotation because it is a functional control, not a decorative mark. Any future status control (select, button) must stay upright; only static spans rotate.

### Carimbo (signature component, added 2026-08-20)
The one deliberately "loud" element in an otherwise disciplined monochrome system — the ousadia budget is spent here and nowhere else. A `.carimbo` is a rotated (~-11deg) circular ring, double-bordered (`::before` inset ring), `mix-blend-mode: multiply`, translucent `--stamp-ring`/`--stamp-ink` (never solid — a real notary stamp is uneven, not flat vector color), holding short uppercase Barlow Condensed text (`.carimbo-text`).

**Where it appears (exactly three places, on purpose — do not scatter it further):**
- `LoteCard.jsx`: "Origem Leilão", bottom-left corner of the photo, marking the real fact that every lote in this system originates from judicial-auction inventory.
- `Login.jsx`: "Acesso Restrito", overlapping the bottom-right of the logo — the one identity touch on the app's most-seen, previously most-generic screen.
- `Agenda.jsx`: the "today" calendar cell reuses the ring/rotation language (border + inset box-shadow) at the existing `--radius-sm` day-cell size, without the full `.carimbo` component or its `mix-blend-mode` — **do not add `mix-blend-mode: multiply` to `.agenda-calendar-cell-day`**, it was tried and made the day number disappear in dark mode (the day number is real text content, not a decorative overlay like the other two placements).

**Do not** turn this into a general-purpose decoration — reintroducing pill-radius or scattering the stamp onto every card/badge would flatten it back into ornament. It stays rare precisely so it stays legible as "the one real touch."

### Cards / Containers
- **Corner Style:** 4px radius (`--radius-md`).
- **Background:** `--bg-panel` (`#f1f0ea`).
- **Shadow Strategy:** `--shadow-sm` at rest; see Elevation & Depth — no per-item shadows inside grid/list contexts.
- **Border:** 1px `--rule`.
- **Internal Padding:** 24px desktop, 18px at the 900px breakpoint.

### Inputs / Fields
- **Style:** `--bg-panel` fill, 1px `--rule-strong` border, 3px radius, Barlow body text; selects get a custom chevron SVG matching `--ink-secondary`.
- **Focus:** border shifts to accent + a 1px accent box-shadow ring (not a glow).
- **Error:** `.form-error` uses danger-soft background, danger border and text.
- **Disabled/static display:** `.form-static` uses `--bg-inset` fill with a plain `--rule` border and secondary-ink text.

### Navigation
- **Style:** vertical sidebar list, Barlow Condensed uppercase items, 3px radius per item.
- **Default:** `--ink-secondary` text/icon on transparent background.
- **Hover:** `--bg-inset` fill, ink text.
- **Active:** solid `--ink` fill with `--bg-panel-raised` text/icon — the one place ink itself (not the accent) marks selection.
- **Mobile:** off-canvas drawer, see Layout.

### Ruled-Sheet Grids (signature component)
Lotes and Equipe views, and the Kanban board, share one pattern: a single outer container carries `border-top`/`border-left` + `border-radius` + `box-shadow`; individual cells (lote cards, team cards, kanban cards) contribute only `border-right`/`border-bottom` hairlines, sit flush with no radius, and hover with a flat tint (`--bg-panel-raised`) plus an inset 1.5px accent ring — never a shadow or lift. Content nested inside a cell (a lead row inside a lote card, a task row inside a team card) follows the same logic recursively: plain `border-bottom` rows, no boxed background.

### Data Table
2px `--ink` rule under the header row (heavier than the 1px body-row rule), Barlow Condensed uppercase header labels, JetBrains Mono for numeric/date cells. Wrapped in `.table-scroll` for horizontal scroll on mobile.

## Do's and Don'ts

### Do:
- **Do** use the carimbo-roxo accent (`#5a2a6b`) sparingly — active nav underline, primary buttons, focus rings, the one price highlight — never as a general-purpose background fill.
- **Do** pair status color with border-style (solid/dashed/double) whenever adding a new status value; color alone is not sufficient in this system.
- **Do** keep new grid/list surfaces on the ruled-sheet pattern: one outer bordered/shadowed container, hairline-only per-item borders, flat-tint + inset-ring hover.
- **Do** use JetBrains Mono for any new tabular/numeric field (prices, codes, dates, phone, CPF) to match the existing figures.
- **Do** reference `public/logo-agiliza-ink.png` (dark navy ink mark) for any new brand-mark placement; its navy tone is a fixed, separate brand asset and is intentionally not tied to the violet UI accent.

### Don't:
- **Don't** make dark mode the default surface; light stays default, dark is an explicit opt-in via the sidebar toggle (see Colors → Dark Mode). The flip to a light newsprint ground for the base theme was a deliberate world decision, not an oversight.
- **Don't** use `--ink-secondary`/`--ink` for text that sits directly on `--bg-page` in dark mode (e.g. `.status-tabs`) — those tokens are tuned for white panels and go near-invisible on black. Use the component's own literal light-on-black override instead (see Colors → Dark Mode → Named Rule).
- **Don't** reintroduce pill-shaped (`--radius-full`) buttons, badges, tabs, or inputs; `--radius-full` is reserved for true circles only (avatars, WhatsApp button).
- **Don't** add `box-shadow` + `border-radius` + hover-`translateY` to individual items inside a grid/list (lote cards, team cards, kanban cards, nested rows) — this is the specific defect the finish review already caught and corrected once.
- **Don't** apply the `-2deg` status-badge rotation to any interactive control (select, button); rotation is reserved for static `<span>` badges only.
- **Don't** reference `public/logo-agiliza.png` (the old light-on-transparent mark); it is orphaned since the light-mode flip and would be invisible on the current background — use `logo-agiliza-ink.png`.
- **Don't** use `display: block` on a `<table>` to make it scroll on mobile; wrap it in `.table-scroll` (`overflow-x: auto` on the container) instead — the block approach previously broke column layout.
- **Don't** treat document/contract-generation UI as designed; no visual treatment exists yet for that unscoped future feature.
