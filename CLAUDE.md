# Agiliza Imóveis

> Project memory for Claude Code. Keep this file short and high-signal.

## Behavioral guidelines

1. **Think before coding** — state assumptions explicitly. If multiple interpretations exist, present them instead of picking silently. Say so when a simpler approach exists. If something is genuinely unclear, stop and ask.
2. **Simplicity first** — minimum code that solves the problem. No speculative features, no abstractions for single-use code, no unrequested configurability, no error handling for impossible scenarios.
3. **Surgical changes** — touch only what the request requires. Match existing style. Don't refactor, reformat, or "improve" adjacent code that wasn't part of the request.
4. **Goal-driven execution** — turn tasks into verifiable goals (e.g. "fix the bug" becomes "write a test that reproduces it, then make it pass"). For multi-step work, state a brief plan with a verify check per step, then loop until every step is verified.
5. **Orchestrator, not implementer** — the main session plans, decides, and coordinates; it does not implement. Delegable implementation and analysis goes to a specialist subagent, dispatched in parallel when task scopes don't conflict. Every frontend change must still be validated live in a real browser session (not just `npm run build`) before it's considered done.

## Stack

React 19 · Vite 8 · Supabase (Postgres + Auth + Edge Functions) · plain CSS with design tokens (no UI framework) · lucide-react icons

## Canonical commands

- **Install:** `npm install`
- **Lint:** `npm run lint` (oxlint)
- **Build:** `npm run build` — also the closest thing to a typecheck; there's no separate typecheck script
- **Dev:** `npm run dev` — starts on 5173, or the next free port if occupied; check with `netstat` before assuming which port is live
- **Test:** none yet — no test suite exists in this project

## Specialist agent routing table

When work is delegable, dispatch the specialist that matches the task instead of a generic agent. Below is a starter set — enough to show the pattern without bloating a file that loads into every session. The full ~20-role reference roster lives in [`docs/tools/02-subagent-orchestration.md`](https://github.com/soumatheusgomes/vibe-coding-toolkit/blob/main/docs/tools/02-subagent-orchestration.md) of the vibe-coding-toolkit repo this template came from — copy in only the rows this project actually needs.

| Agent | When to use |
|---|---|
| `orchestrator` | Coordinates multi-agent or cross-domain tasks by delegating to specialized agents. Use when a task spans multiple domains or needs parallel subagent execution. |
| `code-reviewer` | Reviews code changes for bugs, security, error handling, and test coverage. Use after editing any source file. |
| `security-reviewer` | Reviews code for OWASP Top 10 vulnerabilities, hardcoded secrets, broken auth, and dependency CVEs. Use before any merge that touches auth, input handling, or secrets. |
| `test-engineer` | Writes unit and integration tests with TDD discipline and edge-case coverage. Use after implementing new logic — this project has no test suite yet, so this is where one starts. |
| `backend-specialist` | Implements Supabase schema, RLS policies, and Edge Functions. Use when building or modifying backend/data logic. |
| `frontend-specialist` | Designs and implements UI components, layouts, and frontend performance. Use when building or refactoring UI. |

## Conventions

- UI copy defaults to **formal, ABNT-style Portuguese** (pt-BR), no abbreviations. WhatsApp message templates are the one exception — casual tone there.
- Theming lives in `src/index.css` as CSS custom properties: a `:root` block (light, default) plus a `:root[data-theme="dark"]` override. Dark mode is intentionally **monochrome** — status differentiation there relies on `border-style` (solid/dashed/double), not hue. Don't introduce a new color without reusing the existing `--status-*` / `--bg-*` / `--ink-*` tokens.
- Supabase tables use snake_case columns; each context (`LotesContext.jsx`, `LeadsContext.jsx`, `VisitsContext.jsx`, ...) maps rows to camelCase via `fromRow`/`toRow` helpers — keep that pattern for new tables.
- Any Supabase `select` that can return more than 1000 rows needs manual `.range()` pagination — PostgREST silently caps at 1000 otherwise. (This already caused a real bug: leads were silently truncated from 1186 to 1000.)
- Never handle a real password or a `service_role`/secret key, even if offered directly — anything that requires viewing or typing a credential value goes through the Supabase dashboard, done by the user.
- Commit messages: short, imperative, `feat:`/`fix:`/`docs:`/`chore:` prefix, matching the existing `git log` style.
- Every `*Context.jsx` file intentionally exports both its Provider component and its `useX` hook from the same file (Context+hook co-location) — `react/only-export-components` is turned off project-wide in `.oxlintrc.json` for this reason, not an oversight. Their `useEffect` fetch/subscribe effects intentionally depend on `currentUser?.id` (not the whole `currentUser` object) to avoid refetching on every object-identity change — each site has an inline `oxlint-disable-next-line react-hooks/exhaustive-deps` comment explaining this; don't remove those comments to "fix" the warning by adding `currentUser` to the deps array, that reintroduces unnecessary refetches.

## Learn more

Adapted from the [vibe-coding-toolkit](https://github.com/soumatheusgomes/vibe-coding-toolkit) `CLAUDE.md.template`, following its Quick Start exactly: the `superpowers@claude-plugins-official` plugin is installed for this setup, enabling the specialist agent routing table above. For the reasoning behind each section, see the `docs/` folder in that repository.
