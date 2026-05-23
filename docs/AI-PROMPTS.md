# AI Prompts Used in This Build

These are the actual prompts I reused during the build. Kept here both as a
submission artifact (per the brief) and because they're the ones I'd reach for
again on the next Expin feature.

Each prompt is meant to be dropped into Claude Code with the project context
already loaded. They assume `CLAUDE.md` and `docs/SPEC.md` are read.

---

## P1 — Plan-then-build kickoff

> Read `docs/SPEC.md` and `CLAUDE.md` end-to-end. Don't write code yet.
> Then propose a build order as a checklist that respects dependencies
> (i18n + RTL plumbing before any components, pure `lib/` functions before
> the hooks that use them, hooks before components, RTL audit last).
> Flag any spec ambiguities you'd want resolved before starting.

Used at the start. The "flag ambiguities" line is what catches the things
the spec hand-waved (default-filter URL writes, Arabic numeral system,
shadcn primitive RTL leaks).

---

## P2 — TanStack Query + SSE integration

> Write `client/src/hooks/useCreatorStream.ts`. It opens an `EventSource` to
> `/api/stream?campaignId=demo`, parses each `data:` event as
> `{ creatorId, views, conversions, conversionRate }`, and patches the
> creators query cache via `queryClient.setQueryData(['creators', campaignId], …)`.
>
> Requirements:
> - The patch updater ONLY touches `views / conversions / conversionRate` —
>   never `boosted`. That field is owned by the boost mutation, and an SSE
>   patch arriving mid-boost must not clobber the optimistic flag.
> - On `onopen` after the *initial* connect, invalidate
>   `['creators', campaignId]` to resync after disconnects (lost events).
> - `EventSource` lives in a `useRef`. Cleanup closes it. StrictMode's
>   double-mount must not leak a connection.
> - The hook returns nothing — components read via `useCreators`.

The "only touches three fields" line is the load-bearing instruction.
Without it the agent will write a `{ ...creator, ...patch }` spread that
also wipes `boosted: true` if the server's snapshot of `boosted` is stale.

---

## P3 — Optimistic boost mutation

> Implement `useBoostCreator` in `client/src/hooks/useBoostCreator.ts`.
>
> Pattern:
> - `onMutate(creatorId)` → cancel in-flight queries, snapshot, optimistically
>   flip `boosted = true` on the matching creator via `setQueryData`,
>   return `{ prev }` as context.
> - `onError(err, _id, ctx)` → restore `ctx.prev`, fire `toast.error(t('boostFailed'))`.
> - `onSuccess()` → `toast.success(t('boostQueued'))`.
> - HTTP 409 ("already boosted") is treated as success-equivalent: keep the
>   optimistic flag, do NOT show an error toast. Other non-2xx → onError.
> - The mutation does NOT invalidate the creators query. The optimistic write
>   is the source of truth until the next full refetch (e.g. on reconnect).
>
> The Boost button is disabled when `mutation.isPending || creator.boosted`.

---

## P4 — RTL audit pass

> Audit the `client/src/` tree for RTL violations. Run these checks and report
> per-file:
>
> 1. `grep -rEn "\\b(pl-|pr-|ml-|mr-|left-|right-)\\d" client/src/components` —
>    every hit is a regression. Exception: paths that match `client/src/components/ui/`
>    are vendored Shadcn; patch the ones we use (already done for `select.tsx`).
> 2. Any `<svg>` or icon component that implies direction (arrow, chevron,
>    caret) — must have `rtl:rotate-180` unless it's purely decorative.
> 3. Sonner toaster position MUST be `lang === 'ar' ? 'top-left' : 'top-right'`.
> 4. Number / percent formatting MUST go through `lib/format.ts` using
>    `ar-AE` with `numberingSystem: 'latn'` for Arabic. No hand-formatted
>    `(x * 100).toFixed(1) + '%'`.
> 5. Walk every interactive surface in Arabic: filter bar (every control),
>    table header (every sort), Boost button on a pending and a boosted row,
>    empty state, error state.
>
> Report violations as file:line + fix.

Used as the final pass before declaring done. Catches the things that slip
through during component-level work.

---

## P5 — Empty / loading / error state matrix

> For each surface — table (initial fetch), table (filtered), boost action —
> implement loading, empty, and error states per SPEC §4 R5. Use:
> - Skeleton (8 rows) for initial fetch loading.
> - `<EmptyState />` for zero creators (cold) and zero results (after filter).
>   The filtered variant includes a "Reset filters" button bound to
>   `useFilters().reset()`.
> - `<ErrorState />` with `t('retry')` button calling
>   `queryClient.invalidateQueries(['creators'])` for initial-fetch failures.
> - Boost errors → toast only (per spec).
>
> All copy goes through `useT()`. Don't hardcode any strings.

---

## P6 — Hand-off review

> Before I commit, scan the diff against these criteria from the brief:
>
> - State architecture: server vs client vs URL split is clean and matches SPEC §2?
> - RTL: zero `pl-/pr-/ml-/mr-` in non-vendored code, toaster flips, formatters use locale?
> - Optimistic boost: rollback on failure, no double-click?
> - Race conditions: SSE patch can't clobber optimistic boost?
> - Empty/loading/error states on every surface?
> - Readable on first scan — no clever one-liners, descriptive names, low nesting?
>
> Flag anything that fails. Don't fix it yet — just list what needs attention.

The "don't fix yet" matters. Otherwise the agent will start editing and you
lose visibility into what was wrong.
