# Expin — Campaign Performance Widget

A merchant-facing campaign performance widget. Live SSE-driven creator metrics,
URL-persisted filters, optimistic boost actions with rollback, and real
Arabic/English RTL parity.

This is my submission for the Expin Product Engineer (Merchant Web) take-home.

---

## Quickstart

```bash
npm install
npm --prefix client install
npm --prefix mock-server install
npm run dev
```

Open `http://localhost:5173`. Mock API runs on `http://localhost:4000` (the
client always goes through Vite's `/api` proxy).

```bash
npm --prefix client run lint   # tsc --noEmit
```

> **Starter fix:** `mock-server/seed.js` shipped using `faker.internet.username`
> which doesn't exist in `@faker-js/faker@9.x` (it's `userName` in v9). Fixed
> in [`mock-server/seed.js`](./mock-server/seed.js). Without this, the mock
> server crashes on startup.

---

## What shipped

Every requirement in the brief is implemented and working end-to-end.

| # | Requirement | Status | Notes |
|---|-------------|--------|-------|
| 1 | Creator performance table | ✅ | Default sort conv. rate desc; click any header to re-sort. |
| 2 | Filter bar — status multi-select, min rate slider, search | ✅ | URL-persisted via `nuqs`. `?status=none` sentinel preserves "deselected all". |
| 3 | Live SSE updates every 2–5s | ✅ | `EventSource` → `queryClient.setQueryData`. Row flash highlight on patches. Smooth re-sort. |
| 4 | Optimistic boost with rollback | ✅ | `useMutation` onMutate snapshot, onError rollback + toast. 409 handled. |
| 5 | Empty / loading / error states | ✅ | Skeleton, two empty variants (cold + filtered), inline error with retry. |
| 6 | Arabic + English with real RTL | ✅ | `ar-AE` with Latin digits, logical Tailwind utilities, Shadcn primitive patched, toaster position flips by lang. |

---

## Three most interesting decisions

These are the ones I'd walk through in the Loom. Full reasoning in
[`docs/SPEC.md`](./docs/SPEC.md).

1. **SSE patches never touch `boosted`.** The stream updater only writes
   `views / conversions / conversionRate`. If a stale SSE patch lands during
   an in-flight boost mutation, the optimistic flag survives. See
   [`hooks/useCreatorStream.ts`](./client/src/hooks/useCreatorStream.ts).

2. **Live re-sort, not pinned order.** I considered pinning the row order
   to avoid jitter, but pinning means rows can appear out-of-order relative
   to the current sort (row 5 showing 19% conv rate while row 1 shows 18%).
   With stable keys + `React.memo`'d rows + 50-row scale + one swap per
   2–5s, the live reorder is smoother *and* more honest than freezing.
   Stable secondary sort by id avoids churn.

3. **No Zustand store.** Every piece of state in the app already has a
   natural home (server state → TanStack Query; filters → URL via nuqs;
   debounced search input → local `useState`). Adding a Zustand bucket
   without a need is noise. The starter ships it pre-installed — the
   absence is a decision, not an omission.

---

## Architecture

```
client/src/
  api/         fetch wrapper, creators endpoint, EventSource factory
  hooks/       useCreators, useCreatorStream, useBoostCreator, useFilters
  lib/         pure functions: filter / sort / format / types
  i18n/        strings.ts dictionary + I18nProvider + useT() hook
  components/  CampaignWidget, CreatorTable/Row, FilterBar, BoostButton,
               StatusBadge, EmptyState, ErrorState, TableSkeleton,
               LanguageToggle, AppToaster, StreamIndicator
  components/ui/ vendored Shadcn primitives (patched select.tsx for RTL)
```

**State split:**

| State | Lives in |
|---|---|
| Creators + per-row metrics | TanStack Query cache |
| SSE metric patches | `queryClient.setQueryData` → same cache |
| Boost in-flight (per creator) | `useMutation` + optimistic write |
| Filters / sort / language | URL via `nuqs` |
| Debounced search input | local `useState` |

---

## RTL approach (real, not faked)

- Logical Tailwind utilities only (`ps-/pe-/ms-/me-/start-/end-/text-start/text-end`).
  Zero `pl-/pr-/ml-/mr-` in code I wrote. Grep audit is part of the workflow
  ([`.claude/skills/rtl-audit.md`](./.claude/skills/rtl-audit.md)).
- Shadcn `SelectItem` shipped with hardcoded `pl-8 pr-2` + `absolute left-2`.
  Patched in [`components/ui/select.tsx`](./client/src/components/ui/select.tsx).
- Sonner toaster position is a function of language: `top-left` for RTL,
  `top-right` for LTR. See [`components/AppToaster.tsx`](./client/src/components/AppToaster.tsx).
- Numbers and percents use `Intl.NumberFormat`. For Arabic, locale is
  `ar-AE-u-nu-latn` (Western digits) — Gulf merchant convention. Eastern
  Arabic digits would surprise UAE users.
- Handle (`@username`) is forced `dir="ltr"` so it doesn't render as
  `username@` in RTL contexts. (The `@` is weak-direction in bidi.)
- Manually walked every interactive surface in Arabic before declaring done.

---

## Race conditions handled

Documented in [`docs/SPEC.md`](./docs/SPEC.md) §2, summary:

1. SSE arrives during in-flight boost → patch only touches metric fields.
2. SSE patches stale `boosted` value → same defense.
3. Double-click on Boost → button disabled while `isPending || boosted`.
4. Boost fails after user filtered creator away → rollback writes to cache
   regardless of visibility.
5. Lang toggle mid-boost → presentational only, no mutation cache impact.
6. `EventSource` reconnect → `onopen` after first connect invalidates the
   creators query to resync lost-event window.
7. StrictMode double-mount → `EventSource` in a ref, closed in cleanup.

---

## What I didn't build

Conscious choices, called out so they're visible at review:

- **Pagination / virtualization** — 50 rows fits one screen; virtualizing
  would be ceremony with no benefit at this scale.
- **Authentication / multi-tenant routing** — out of scope per the brief.
- **Full test suite** — time-boxed. Pure `lib/filter.ts` and `lib/sort.ts`
  are testable without React; the hooks below are tested manually with
  the running mock server. If continuing, Vitest on the pure functions is
  the first add.
- **Brand polish** — Shadcn defaults are fine for a take-home. No custom
  theming, no design-system layer.

## What I'd do next (in priority order)

1. **Vitest unit tests** on `lib/filter.ts`, `lib/sort.ts`, `lib/format.ts`,
   and the status URL parser sentinel logic in `useFilters`. These are the
   pure-function surfaces where regressions hurt most.
2. **Reconnect indicator** — the `StreamIndicator` already shows
   live/offline, but a "reconnecting…" mid-state would be honest about
   what's happening during a network blip.
3. **Per-row trend sparkline** — keep a small ring buffer of recent metric
   values in the query cache and render an inline sparkline in the conv.
   rate cell. Useful signal for spotting acceleration/deceleration.
4. **Boost confirmation guardrail** for high-stakes creators (e.g. those
   already in the top 10) — small modal instead of one-click. The 30%
   failure rate is forgiving in the mock; production would not be.
5. **Bulk filter presets** — "Underperformers" preset (live + conv rate <
   median) as a one-click filter combo. The URL-state architecture makes
   this a one-liner.
6. **`prefers-reduced-motion` audit** — the flash highlight and the
   live-ping indicator animations should respect this user preference.

---

## AI workflow artifacts

Per the brief's submission criterion, the actual files I used live in the repo:

- [`CLAUDE.md`](./CLAUDE.md) — root instructions for Claude sessions on this repo.
- [`docs/SPEC.md`](./docs/SPEC.md) — the spec I fed to my agent. The
  contract for what was built.
- [`docs/AI-PROMPTS.md`](./docs/AI-PROMPTS.md) — six reusable prompts I
  used during the build (plan kickoff, SSE integration, optimistic boost,
  RTL audit, empty/loading/error matrix, hand-off review).
- [`.claude/skills/rtl-audit.md`](./.claude/skills/rtl-audit.md) — a small
  skill that codifies the RTL audit pass (grep + manual walk-through).

These are the files I actually used, not a writeup.

---

## Submission

- **Repo:** _(you fill in after pushing)_
- **Commit SHA:** _(the SHA of the final commit you push)_
- **Loom:** _(60–120s walkthrough; cover the three decisions above)_
- **AI artifacts:** in this repo at the paths listed above.
