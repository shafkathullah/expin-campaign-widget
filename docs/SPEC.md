# Campaign Performance Widget — Build Spec

This is the spec I work against. It captures the architecture decisions and the
contract for each requirement, so review can focus on whether the output matches
this — rather than reverse-engineering intent from the diff.

If the spec and the code disagree, the code is wrong. Update the code, not the spec.

---

## 1. Goal

A Campaign Performance widget for a merchant dashboard. 50 creators in a table,
filterable, sortable, live-updating via SSE, with an optimistic Boost action and
real RTL parity.

The brief lists six requirements. Each section below maps to one.

---

## 2. State architecture

The single most-graded decision. The split:

| State                                | Lives in              | Why                                                           |
| ------------------------------------ | --------------------- | ------------------------------------------------------------- |
| Creators list + per-creator metrics  | TanStack Query cache  | Server state. SSE patches go through `queryClient.setQueryData`. |
| In-flight boost mutations            | TanStack Query        | `useMutation` per boost click. Optimistic + rollback.         |
| Filters (status, min rate, search)   | URL query params via `nuqs` | Sharable, refresh-safe. The brief explicitly requires this.   |
| Language (en / ar)                   | URL param + localStorage | Shareable + persists across reloads. Drives `dir` on `<html>`. |
| Sort column / direction              | URL query params      | Default `conversionRate` desc; user can override and share.    |
| Search input local debounce buffer   | `useState`            | Local-only; URL updates after 250ms idle.                     |

Nothing else. **No Zustand store** — every piece of client state is already
either URL or TanStack Query, and adding a third bucket without a need is noise.
The starter ships Zustand pre-installed; the absence is a deliberate decision,
not an omission. If a piece of pure client UI state shows up later that doesn't
fit URL or server cache, Zustand goes back on the table.

### nuqs wiring

nuqs v2 requires an adapter for non-Next apps. `<NuqsAdapter>` from
`nuqs/adapters/react` wraps everything in `main.tsx` alongside the query client
and toaster.

### Empty-status-filter URL semantics

The brief says multi-select status. Default is "all three selected". A user can
deselect all to see nothing (which then surfaces the filtered empty state).

URL encoding:

- No `status` param at all → default → all three shown.
- `status=live,pending` → those two.
- `status=` (present but empty) → none selected. This is the sentinel for
  "explicitly deselected everything." We write the empty param when the user
  unchecks all options.

This keeps the URL clean on a fresh load (no param), but distinguishes
"never touched" from "deselected to nothing."

### SSE strategy

A single `useCreatorStream(campaignId)` hook opens one `EventSource` to
`/stream`, and on each `message` event calls:

```ts
queryClient.setQueryData(['creators', campaignId], (prev) => patchCreator(prev, event));
```

`setQueryData` (not `invalidateQueries`) is the load-bearing choice:

- Every 2–5s is too often to refetch the whole list — `invalidateQueries`
  would trigger a full `GET /creators` per patch.
- More importantly, a refetch mid-boost would briefly return the server's
  stale `boosted: false` and clobber the optimistic flag until the boost
  POST completes and the next refetch lands.

Direct cache patching avoids both. Other properties that fall out of this:

- Components stay subscribed via `useQuery`. They re-render only when their
  derived data changes, because TanStack diffs by reference.
- The streaming layer never touches React state directly. One source of truth.
- Reconnect is automatic (`EventSource` does this). On reconnect, we don't
  re-subscribe — the patch stream resumes.

### Race conditions handled

1. **SSE during an in-flight boost** — covered by the `setQueryData`
   choice above. The current SSE payload is `{ creatorId, views,
   conversions, conversionRate }` — no `boosted` field — so a direct
   cache patch can't carry one. The real risk would have been a refetch
   strategy returning the server's stale `boosted: false`, which is the
   exact case `setQueryData` avoids.
2. **SSE schema regression (forward-compatibility)** — the patch updater
   spreads `...c` then writes only the three metric fields *by name*. If
   the SSE schema later grows a `boosted` field (e.g. to broadcast boost
   events across merchant tabs), the updater won't silently start
   clobbering the optimistic flag. Hygiene, not a sharp race today.
3. **User clicks Boost twice fast** — button is disabled while
   `mutation.isPending || creator.boosted`.
4. **Boost fails after 1–3s, user filtered the creator away in the meantime** —
   the rollback writes to the cache regardless of what's currently visible;
   the optimistic flag clears and the toast still fires.
5. **User toggles to Arabic mid-boost** — language change is presentational only,
   does not touch the mutation cache.
6. **EventSource reconnect (network blip)** — `EventSource` auto-reconnects, but
   events fired during the disconnect window are lost. On the `onopen` callback
   after the *initial* connect, we `queryClient.invalidateQueries(['creators'])`
   to refetch the authoritative snapshot. Stream resumes from there.
7. **StrictMode double-mount in dev** — the SSE hook owns its `EventSource` in a
   ref and closes it in the effect cleanup. StrictMode's second mount creates a
   fresh connection; the orphan from the first is closed cleanly. No leak.

---

## 3. File structure

```
client/src/
  App.tsx                       # Composition root: header + LanguageToggle + Widget
  main.tsx                      # Providers (QueryClient, Toaster, I18nProvider)
  i18n/
    strings.ts                  # { en, ar } dictionaries
    I18nProvider.tsx            # Context + useT() hook + sets <html dir="rtl"/>
  api/
    client.ts                   # fetch wrapper, base URL
    creators.ts                 # getCreators, boostCreator
    stream.ts                   # openCreatorStream (EventSource factory)
  hooks/
    useCreators.ts              # useQuery wrapper
    useCreatorStream.ts         # SSE -> setQueryData
    useBoostCreator.ts          # useMutation with optimistic + rollback
    useFilters.ts               # nuqs hooks for status / minRate / search / sort
  components/
    CampaignWidget.tsx          # Orchestrates filter bar + table
    FilterBar.tsx               # status multi-select, rate slider, search
    CreatorTable.tsx            # Sorted, filtered table
    CreatorRow.tsx              # Memoized row (prevents janky re-renders)
    BoostButton.tsx             # Optimistic state + disabled logic
    StatusBadge.tsx             # pending / live / completed
    LanguageToggle.tsx
    EmptyState.tsx              # Used for filter-no-results and zero-creators
    ErrorState.tsx              # Used for load failure with retry
    TableSkeleton.tsx           # Loading skeleton
    ui/                         # Shadcn primitives (already exists)
  lib/
    filter.ts                   # applyFilters(creators, filters) — pure
    sort.ts                     # applySort — pure
    format.ts                   # number / percent formatters (locale-aware)
    types.ts                    # Creator, PostStatus, Filters
```

Pure functions in `lib/` are testable without React. The hooks own the
TanStack Query / nuqs wiring. The components are dumb.

---

## 4. Requirement-by-requirement

### R1. Creator performance table

Columns: Name (+ handle), Status, Views, Conversions, Conversion Rate, Boost.
Default sort: `conversionRate` desc. Sort by other columns on header click.
Status renders as a colored Badge. Conversion rate formatted as `12.4%` using
`Intl.NumberFormat` with the active locale.

Row identity is `creator.id` — keys are stable so React reuses DOM nodes when
metrics update. The row component is `React.memo`'d on `(creator, t, lang)`.

### R2. Filter bar

- **Status:** multi-select. Default = all three selected. Empty selection = show none.
- **Min conversion rate:** slider 0–25% (matches the seed's range), step 0.5%.
- **Search:** name + handle, case-insensitive. 250ms debounce before URL write.

`useFilters()` returns `{ filters, setStatus, setMinRate, setSearch, reset }`.
The "Reset filters" button is visible only when any filter differs from default.

URL example:
`?status=live,pending&minRate=0.05&q=ahmed&sort=conversionRate&dir=desc&lang=ar`

Default values are *never* written to the URL. A fresh visit produces a clean
URL (`/`); params appear only when a user actively diverges from the default.
This also means `sort=conversionRate&dir=desc` does not appear until the user
sorts something else and then re-sorts back.

### R3. Live updates

SSE connection opens when the widget mounts, closes on unmount. Patches go
through `setQueryData`. Visible smoothness:

- Numbers render in `tabular-nums` cells so the digit width stays stable.
- A short flash highlight (700ms `bg-emerald-50`/`bg-emerald-900/20` fade) on
  the row that just received a patch — makes the change visible without the
  user having to track which number moved.
- **Order updates live, except under the cursor.** Rows re-sort on every
  patch. With 50 rows, at most one swap per 2–5s update, stable keys
  (creator.id), and `React.memo`'d row components, the reorder is smooth —
  DOM nodes survive across positions.
  - I considered pinning order to avoid jitter, but pinning means rows can
    appear in the wrong order relative to the current sort (e.g. row 5
    shows 19% conv rate while row 1 shows 18%), which is *more* confusing
    than a smooth reorder. Called out in the Loom as the more interesting
    tradeoff.
  - Stable secondary sort by `id` means rows with equal values don't churn.
  - **Freeze while hovering.** Live re-sort's one hazard is a mis-click — a
    row sliding to a new position the instant before the user clicks Boost.
    While the pointer is over the table the row *sequence* is held (cell
    values keep updating live); the held order is captured on pointer-enter,
    re-captured on an explicit header sort, and released on pointer-leave.
    Pure reordering helper: `lib/freezeOrder.ts` (`applyFrozenOrder`), driven
    by hover state in `CampaignWidget`. Boost is bound to `creatorId`, never
    row index, so correctness never depended on this — the freeze only guards
    the click *target*. Keyboard/focus users aren't covered yet (follow-up).

### R4. Boost

```ts
useMutation({
  mutationFn: boostCreator,
  onMutate: async (creatorId) => {
    await queryClient.cancelQueries({ queryKey });
    const prev = queryClient.getQueryData(queryKey);
    queryClient.setQueryData(queryKey, (data) => markBoosted(data, creatorId, true));
    return { prev };
  },
  onError: (err, _id, ctx) => {
    queryClient.setQueryData(queryKey, ctx.prev);
    toast.error(t('boostFailed'));
  },
  onSuccess: () => toast.success(t('boostQueued')),
});
```

Button disabled while `isPending || boosted`. 409 (already boosted) is treated
as success-ish: we just keep the optimistic flag and don't toast an error.

### R5. Empty / loading / error states

Matrix:

| Surface       | Loading                          | Empty                                | Error                              |
| ------------- | -------------------------------- | ------------------------------------ | ---------------------------------- |
| Table (initial fetch) | 8-row skeleton           | "No creators yet" illustration       | Inline error card with Retry       |
| Table (filtered)      | n/a (filtering is sync)  | "No creators match your filters" + Reset filters button | n/a |
| Boost action          | spinner + disabled       | n/a                                  | Toast (already covered above)      |

### R6. Arabic + English

- Toggle in header. Sets `dir` on `<html>` and `lang`.
- All copy via `t('key')`. Numbers and percents via `Intl.NumberFormat(locale)`.
- Layout uses Tailwind logical utilities only: `ps-*`, `pe-*`, `ms-*`, `me-*`,
  `start-*`, `end-*`, `text-start`, `text-end`. Zero `pl-/pr-/ml-/mr-/left-/right-`
  in code I write.
- **Shadcn primitives ship with directional classes** — `SelectItem` uses
  `pl-8 pr-2` and positions the check indicator with `absolute left-2`. These
  do not auto-flip. I patch `select.tsx` once to use `ps-8 pe-2` and
  `absolute start-2`. Same for any other primitive I find on audit.
- Sonner `<Toaster position="top-right" />` is currently hardcoded in
  `main.tsx`. Position becomes a function of language: `top-left` when `dir=rtl`,
  `top-right` otherwise. I wrap the Toaster in a small component that reads
  the current language.
- Radix `Slider` handles RTL natively when `dir="rtl"` is set on an ancestor —
  it inverts thumb direction. Verified.
- Icons with inherent direction (arrows, chevrons that imply progression) get
  `rtl:rotate-180`. Status chevrons that are purely decorative stay put.
- **Arabic numerals decision:** use `ar-AE` with `numberingSystem: 'latn'` so
  Western digits show in Arabic copy. Merchant dashboards in the Gulf
  overwhelmingly use Western digits; Eastern Arabic digits (٠١٢٣٤٥٦٧٨٩) would
  surprise users. Documented here so the choice is visible at review time.
- Verify by manually clicking through every interactive surface in Arabic.
  The `.claude/skills/rtl-audit.md` skill captures the checklist I run.

---

## 5. What I am NOT building

- Pagination. 50 rows fits one screen comfortably; virtualization is overkill.
- Auth. Out of scope per the brief (self-contained mock).
- Persistence beyond URL + localStorage for language.
- Tests. Time-boxed at 4–8 hours; spec discipline + manual RTL pass is the
  substitute. If time remains, one Vitest pass over `lib/filter.ts` and `lib/sort.ts`.
- A general "design system." Shadcn defaults are fine; brand polish stays light.

---

## 6. AI workflow artifacts

What I commit alongside the code, per the brief's submission criterion #4:

- `CLAUDE.md` — root instructions for future Claude sessions on this repo.
- `docs/SPEC.md` — this file. The spec I fed to my agent.
- `docs/AI-PROMPTS.md` — the actual reusable prompts I used for boost flow,
  RTL audit, SSE integration, and the filter bar.
- `.claude/skills/rtl-audit.md` — a small skill I wrote to systematically
  check RTL parity (the kind of thing the brief specifically grades on).

These are the real files, not a writeup.

---

## 7. API conventions

The Vite dev server exposes a `/api` proxy to `http://localhost:4000`. All
client fetches go through `/api/*` for consistency — `/api/creators`,
`/api/creators/:id/boost`, `/api/stream`. The mock-server still runs on 4000
directly; I just don't hit it directly from the client.

---

## 8. Definition of done

- All six requirements demonstrably work in the running app.
- `npm run dev` from a fresh clone gets to a working widget in under 60s.
- One toggle to Arabic produces a mirrored layout with localized numbers.
- The Boost button is optimistic and rolls back on failure.
- SSE updates are visible and smooth (no janky reorders or full re-renders).
- Empty / loading / error states render on every surface.
- `npm --prefix client run lint` passes (tsc --noEmit, zero errors).
- README updated with what's done, what's not, and what I'd do next.
