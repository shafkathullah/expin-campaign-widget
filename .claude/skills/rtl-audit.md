---
name: rtl-audit
description: Systematically check RTL parity for a web app. Use when you need to verify that an Arabic/Hebrew/RTL layout actually mirrors correctly — not just slaps `dir="rtl"` on the root. Catches the common leaks: hardcoded `pl-/pr-/ml-/mr-`, hardcoded toast positions, direction-implying icons that don't flip, locale-aware number formatting bypassed.
---

# RTL Audit Skill

A practical checklist for verifying real RTL parity. Run before declaring an
RTL feature done. The brief for *this* project explicitly grades on "Real RTL
parity, not faked" — that means walking every interactive surface in the RTL
language and confirming each one mirrors correctly.

## How to use

When invoked, run the checks below against the current project state. Report
per-file violations as `file:line + fix`. Do not silently fix — surface
everything first so the reviewer can see what slipped through.

## Checks

### 1. Static class audit

```bash
grep -rEn "\b(pl-|pr-|ml-|mr-|left-|right-)\d|inset-l-|inset-r-" client/src \
  --include='*.tsx' --include='*.ts' \
  | grep -v 'client/src/components/ui/'   # vendored Shadcn handled separately
```

Every hit in non-vendored code is a regression. The fix is the logical
equivalent: `pl-4` → `ps-4`, `mr-2` → `me-2`, `left-0` → `start-0`,
`text-right` → `text-end`.

### 2. Vendored Shadcn primitives in use

Shadcn ships several components with directional classes. List every Shadcn
primitive *imported anywhere in the project*, then check the source for `pl-`,
`pr-`, `ml-`, `mr-`, `left-`, `right-`. Patch the ones you use, leave the
ones you don't.

Known offenders in this project's snapshot:

- `select.tsx` — `SelectItem` uses `pl-8 pr-2` and the check indicator is
  `absolute left-2`. Patched to `ps-8 pe-2` and `absolute start-2`.

### 3. Toast / overlay positions

Sonner, react-hot-toast, and similar libraries take a `position` prop with
literal `top-right` / `top-left` strings. These are NOT auto-flipped by `dir`.
Read where the Toaster is mounted and verify position is a function of
language:

```tsx
<Toaster position={lang === 'ar' ? 'top-left' : 'top-right'} richColors />
```

Same applies to floating elements positioned with `style={{ left: x }}`.

### 4. Direction-implying icons

Any icon that implies progression — arrow, chevron, caret, "next"/"prev",
external-link arrow — must flip in RTL. Add `rtl:rotate-180` (for arrows that
point in a direction along the inline axis) or use a directional icon set.

Icons that are purely decorative (info `i`, gear, search magnifier, check
mark) should NOT flip.

```bash
grep -rEn "ArrowRight|ArrowLeft|ChevronRight|ChevronLeft|ExternalLink" client/src \
  --include='*.tsx'
```

### 5. Number, currency, date formatting

Hand-formatted numbers don't localize. Look for:

```bash
grep -rEn "toFixed\(|toLocaleString\(\)|\* 100\)" client/src --include='*.tsx' --include='*.ts'
```

`(rate * 100).toFixed(1) + '%'` is a code smell. It produces `12.4%` regardless
of locale, with Latin digits and `.` separator. The fix is `Intl.NumberFormat(locale, { style: 'percent', maximumFractionDigits: 1 })`.

For Arabic in a Gulf merchant context, use `ar-AE` with
`numberingSystem: 'latn'` — Western digits are conventional. Eastern Arabic
digits (٠١٢٣٤٥٦٧٨٩) are correct but surprising for UAE merchants.

### 6. Manual interactive walk-through

Switch the app to Arabic and click through every interactive surface. For
each one, confirm:

- Layout mirrors (controls on the right become controls on the left).
- Text aligns to the right (start in RTL = right).
- Icons that should flip, do.
- Numbers render in the chosen digit system consistently.
- Toasts appear on the correct side.
- Form inputs caret-position behave naturally.
- Tab order moves right-to-left through controls.

Surfaces specific to this project:

- Header (title, language toggle).
- Filter bar (status multi-select, slider thumbs, search input).
- Table headers (sort icons).
- Each row (Boost button position, status badge).
- Empty state.
- Error state.
- Loading skeleton.
- Toast for boost failure.

### 7. `html` attributes

`document.documentElement` MUST have both `dir` and `lang` set, and they MUST
match. Mismatch ("`dir=rtl lang=en`") breaks browser hyphenation and screen
readers.

```bash
grep -rEn "document.documentElement.(dir|lang)" client/src
```

Both should be set together, in one place, driven by the same source.

---

## Output format

```
RTL audit — <date>
Surface walked in: ar-AE

Violations:
  - <file>:<line>  — <issue>  → fix: <one-line>

Verified:
  - <surface>  — <observation>
```

Never declare "RTL is done" without the manual walk-through. The grep catches
static issues, but mirrored interactions (focus order, scroll directions,
keyboard nav) need a human eye.
