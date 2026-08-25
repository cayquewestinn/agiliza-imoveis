# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Primary user is the requester and his team at his real-estate-auction employer (this is the internal system for his job, not a personal side project). Roles: **Adm/Agendador** (admin — sees the full company-wide picture), **Agendador**, **Vendedor** (non-admins — see only their own assigned tasks). They use the tool daily to manage tasks, auction lots (lotes), and the leads attached to each lot.

**Validated 2026-08-15** against the user's actual daily activities (contatar lead, atualizar status de um imóvel, marcar visita, gerar documento/contrato):
- Covered today: contacting a lead (WhatsApp button + etapa field), updating a lote's status, and (as of 2026-08-15) **scheduling a visit** with real date/time — see Capabilities.
- **Remaining gap — document/contract generation:** does not exist at all yet. The user hasn't generated a contract yet but says he's about to start, and does not yet know which document type or whether he'll have a template to fill from — this is a real but unspecified future need, not yet ready to scope.

## Product Purpose

An internal task/CRM tool for the auction team's daily operations: tracks tasks, auction lots (lotes), and the leads tied to each lot, with role-based visibility (admin sees everything; others see only their own work). Success means it becomes the tool the team actually relies on day-to-day at the job — accuracy against real workflows matters more than demo polish, though this is not yet fully validated.

## Positioning

Modeled on **Canal Pro** (grupozap's professional real-estate listing platform, `canal-pro.grupozap.com`) — the tool the team already works in daily — so coworkers find it familiar rather than foreign. The user has explicitly given permission to go further than Canal Pro when it makes the tool more interactive or better, not to clone it strictly. The mechanism a generic CRM wouldn't have: tasks and leads are tied directly to individual auction lots (lotes), matching the auction-specific workflow (comitentes, leilão dates, lance inicial) instead of a generic sales pipeline.

## Operating Context

The team's daily tool-of-record for listings is Canal Pro; the CRM's lote/lead data shapes should stay legible against that mental model without being a literal clone. Auction-domain vocabulary: **lote** (código, endereço, avaliação, lance inicial, status, data do leilão, comitente), **leads** per lote (contacted via WhatsApp deep links). Team roles: Adm/Agendador (admin), Agendador, Vendedor. There is currently no fixed demo date for showing this to the user's boss — shipping visible progress quickly is still the priority, just without a hard deadline.

## Capabilities and Constraints

Implementation: React 19 + Vite 8 SPA, state held in-memory via React Context (Tasks/Lotes/Leads/Visits) — **no backend or persistence yet**; data resets on reload. Login is a client-side MVP gate only (plaintext `usuario`/`senha` fields in `teamHelpers.js`), not real authentication — intended to be replaced with real auth (Supabase was suggested and is available, but deferred) once backend work starts. Role-based filtering: non-admins see only tasks assigned to them; Lotes and Agenda (visits) stay shared/unfiltered for every role (inventory/scheduling, not per-user data — visits are intentionally visible to everyone to avoid double-booking).

**Visit scheduling (built 2026-08-15):** `src/views/Agenda.jsx` + `src/context/VisitsContext.jsx` + `src/components/VisitModal.jsx`. Two visit types: **imóvel** (tied to an existing lote/lead, reachable from Agenda's "+" or a "marcar visita" button on each lead row inside a Lote card) and **empresa** (coworking visit to meet a vendedor — requires nome completo/CPF/telefone for reception; can attach to an existing lead or auto-create a new one). Scheduling any visit auto-sets the lead's etapa to "Em Visita"; marking a visit "Realizada" auto-advances the lead's etapa to "Em Proposta". No calendar-grid view yet (list grouped by date) and no conflict detection — both reasonable candidates for the later design-refinement pass.

**Confirmed missing capabilities (not yet built):**
- Document/contract generation — no template, no defined document type yet; the user will start generating contracts soon but the shape of this feature is still undetermined. Treat as a real but unscoped future need; ask again once he has a concrete document in hand.

## Brand Commitments

**Binding as of 2026-08-25: the CRM's visual identity is realigned to Able Development's design-principles doc** for the public-facing Agiliza Imóveis site (`principios-de-design.html`) — the user's own company built that site, and wants the CRM and the public site to read as one brand family. Core commitments: navy `#13315C` as the single identity accent, neutral zinc/white base, Inter typeface throughout (no separate display/mono face), generous 10–12px corner radius, individual bordered cards (not hairline "ruled sheets") for grid surfaces. See `DESIGN.md` for the full system as built.

This replaces the CRM's prior "Seção de Editais" newspaper-editorial identity (shipped 2026-08-16), which is now anti-reference only — do not restore its carimbo motif, border-style-as-status, badge rotation, or four-font stack (Bitter/Barlow/Barlow Condensed/JetBrains Mono). It also supersedes the earlier disavowed "23.4studios" brandbook correction (that brandbook belongs to a different one of the user's businesses and was never a valid reference).

## Evidence on Hand

Canal Pro's real data structure (listing/property schema, leads funnel, ad-quality scoring) has been captured in detail as a reference for entity design when backend work starts. All data currently in the CRM (tasks, lotes, leads, team members) is mock/demo data — there is no real production data on hand yet.

## Product Principles

1. Stay legible against Canal Pro's structure and terminology so the team isn't disoriented — but improving on it (more interactive, better UX) is explicitly welcomed, not a deviation to avoid.
2. Tasks and leads stay tied to individual lotes (auction lots), never flattened into a generic pipeline.
3. Role-based access is a hard rule: admins see the company-wide picture; everyone else sees only their own assigned work.
4. Ship visible, working progress quickly — this is a tool for an active job, not a project that can wait for a "right" build order.
5. Coverage against real daily job functions was validated 2026-08-15: task/lead/lote CRUD, contact, status-update, and (as of the same day) visit scheduling are solid. **Document/contract generation** remains the one confirmed gap — do not design it until the user has a concrete document in hand.
