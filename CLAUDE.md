# CLAUDE.md — Expin Campaign Performance Widget

You are working on a Campaign Performance widget for a merchant dashboard.
Future you: read this first, then `docs/SPEC.md` for the full design contract.
If the spec and the code disagree, the spec wins — fix the code, not the spec.

---

## What this project is

A take-home for Expin (Product Engineer, Merchant Web). One widget:

- Live performance table for 20–100 creators in a campaign.
- Filter bar with URL-persisted state (status multi-select, min conversion rate, name search).
- Live SSE updates every 2–5 seconds.
- Optimistic Boost action with rollback + toast on failure.
- Empty / loading / error states everywhere.
- Real Arabic / English RTL parity (not faked).

Mock API is local (`mock-server/`, port 4000). Vite dev server proxies `/api/*`
to it. The client never hits `http://localhost:4000` directly — always `/api/...`.

---

## Stack

- React 18 + Vite + TypeScript (strict).
- TanStack Query for all server state (creators list, boost mutation, SSE patches).
- `nuqs` for URL state (filter bar, sort, language). **No Zustand** — see SPEC §2.
- Shadcn/ui (Radix primitives) — pre-installed: button, input, badge, select,
  slider, skeleton. Sonner for toasts.
- Tailwind with Shadcn CSS vars.

---

## Conventions

### State (load-bearing — see SPEC §2)

| State                        | Lives in              |
| ---------------------------- | --------------------- |
| Creators + per-row metrics   | TanStack Query cache  |
| SSE patches                  | `queryClient.setQueryData` into the same cache |
| Boost in-flight              | `useMutation`, optimistic + rollback |
| Filters / sort / lang        | URL (`nuqs`)          |
| Debounced search input       | local `useState`      |

Do NOT introduce a Zustand store without a concrete reason — every piece of
state here either already lives in URL or the server cache. Adding a third
bucket is noise.

### File layout

```
client/src/
  api/       fetch wrappers + EventSource factory
  hooks/     useCreators, useCreatorStream, useBoostCreator, useFilters
  lib/       pure functions: filter / sort / format / types
  components/ dumb React components
  i18n/      strings + provider + useT hook
```

Pure functions in `lib/` MUST be testable without React. Hooks own the
TanStack Query / nuqs wiring. Components are dumb.

### RTL — non-negotiable

Real RTL parity is explicitly graded. Rules:

- Logical Tailwind utilities only: `ps-/pe-/ms-/me-/start-/end-/text-start/text-end`.
- **Zero** `pl-/pr-/ml-/mr-/left-/right-` in new code. The audit grep MUST come up empty.
- Shadcn `SelectItem` ships with `pl-8 pr-2` and `absolute left-2` for the
  check indicator. It is patched in `components/ui/select.tsx` to use logical
  classes. Do not regress this.
- Sonner Toaster `position` flips by language (`top-left` for `rtl`, `top-right` for `ltr`).
- Radix `Slider` handles RTL natively when an ancestor has `dir="rtl"`. Verified.
- Locale formatters use `ar-AE` with `numberingSystem: 'latn'` — Western digits
  in Arabic copy. Gulf merchant convention. Don't switch to Eastern digits.
- Run the RTL audit checklist in `.claude/skills/rtl-audit.md` before shipping.

### URL state

Defaults are NEVER written to the URL. A fresh visit is `/`. Params appear
only when the user diverges from the default. `?status=` (empty) is the
sentinel for "deselected everything."

### Race conditions

SPEC §2 lists seven. Two that matter most when editing:

- SSE patches MUST only touch `views / conversions / conversionRate`. Never
  touch `boosted` — that would clobber an in-flight optimistic boost.
- `EventSource` lives in a ref and closes in the effect cleanup. StrictMode
  double-mount in dev is fine; the orphan from the first mount is closed.

---

## Running it

```bash
npm run dev          # runs client (5173) + mock-server (4000) concurrently
npm --prefix client run lint     # tsc --noEmit
```

If port 5173 is busy, Vite picks the next. Open the URL printed in stdout.

---

## AI workflow artifacts (per task brief)

The submission requires real AI artifacts in the repo:

- This file (`CLAUDE.md`).
- `docs/SPEC.md` — the spec I fed to my agent.
- `docs/AI-PROMPTS.md` — actual reusable prompts I used during the build.
- `.claude/skills/rtl-audit.md` — small skill for systematically checking RTL parity.

These are the files I actually used. Not a writeup of how I used AI.

---

## House rules

- Edit the spec when intent changes. Don't let it drift.
- New components in `client/src/components/` only. No new top-level folders without a reason.
- No new dependencies without justifying them against what's already installed.
- If you find yourself writing `pl-` or `pr-`, stop and use logical classes.
