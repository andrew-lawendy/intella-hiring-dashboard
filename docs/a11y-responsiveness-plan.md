# Responsiveness & WCAG 2.2 AA — Adaptation Plan

Reference spec: `A11Y_AND_MOBILE_HANDOFF.md` (from Claude Design handoff bundle)
Target standard: WCAG 2.2 AA + mobile-first responsive layout

---

## What's already handled — no work needed

| Item                                                                    | Evidence                                                                                        |
| ----------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| `<html lang="en">`                                                      | `index.html`                                                                                    |
| Dialog: `role="dialog"`, `aria-modal`, focus trap, Escape, return focus | Radix `@radix-ui/react-dialog` used in `ProfileModal`, `EmailDraftModal`, `ShortlistComparison` |
| `prefers-reduced-motion` partial reset                                  | `src/styles/globals.css` — needs two additions (see P0)                                         |
| `.sr-only` utility                                                      | Tailwind `sr-only` class available everywhere                                                   |
| `role="tablist"` on `<nav>`                                             | `TabNav.tsx:16`                                                                                 |
| `role="tab"` on each nav item                                           | `TabNav.tsx:24`                                                                                 |
| `<button>` for all interactive actions                                  | shadcn `Button` component renders native `<button>`                                             |

---

## P0 — Global CSS (non-breaking, do first)

**File: `src/styles/globals.css`**

### 0-A. Skip link class

```css
.skip-link {
  position: absolute;
  left: -9999px;
  top: 0;
  background: var(--foreground);
  color: var(--background);
  padding: 12px 18px;
  border-radius: var(--radius-sm);
  text-decoration: none;
  font-weight: 500;
  font-size: 14px;
  z-index: 9999;
}
.skip-link:focus {
  left: 16px;
  top: 16px;
  outline: 3px solid var(--ring);
  outline-offset: 2px;
}
```

**File: `index.html`** — first child of `<body>`, before `<div id="root">`:

```html
<a class="skip-link" href="#main-content">Skip to main content</a>
```

### 0-B. Universal `:focus-visible` ring (WCAG 2.4.7, 2.4.11, 1.4.11)

The current `outline-ring/50` applied via `* { @apply border-border outline-ring/50 }` is too faint (50% opacity).
Replace/augment with:

```css
:focus {
  outline: none;
}
:focus-visible {
  outline: 2px solid var(--ring);
  outline-offset: 2px;
  border-radius: var(--radius-xs);
}
button:focus-visible,
[role='button']:focus-visible,
[role='tab']:focus-visible {
  box-shadow: 0 0 0 4px color-mix(in srgb, var(--ring) 20%, transparent);
}
```

### 0-C. Touch target floor (WCAG 2.5.8 AA — 24px minimum; 2.5.5 AAA — 44px)

```css
@media (pointer: coarse) {
  button,
  a,
  input[type='button'],
  input[type='submit'],
  [role='button'],
  [role='tab'] {
    min-height: 44px;
  }
}
```

### 0-D. iOS zoom prevention (inputs ≥ 16px on mobile)

```css
input,
select,
textarea {
  font-size: 16px;
}
@media (min-width: 640px) {
  input,
  select,
  textarea {
    font-size: 14px;
  }
}
```

### 0-E. Complete `prefers-reduced-motion` reset

Add the two missing lines to the existing rule:

```css
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important; /* ADD */
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important; /* ADD */
  }
}
```

---

## P1 — Semantic HTML & ARIA state

### 1-A. Layout — main landmark + tab panel

**File: `src/components/layout/Layout.tsx`**

- Add `id="main-content"` to `<main>` so the skip link target exists.
- Wrap `<Outlet />` in a panel div that announces the current section to screen readers:

```tsx
<main id="main-content" className="...">
  <div role="tabpanel" tabIndex={0} aria-label={currentRouteLabel}>
    <Outlet />
  </div>
</main>
```

Derive `currentRouteLabel` from `useLocation()` mapped against the tab labels array.

### 1-B. LoginPage — form semantics

**File: `src/components/auth/LoginPage.tsx`**

Currently missing: visible `<label>`, `autocomplete`, `aria-required`, `aria-invalid`, `aria-describedby`, live region.

- Replace the `MailIcon`-only affordance with a proper `<label htmlFor="login-email">` (can be `.sr-only` if design requires):

```tsx
<label htmlFor="login-email" className="sr-only">Intella work email</label>
<Input
  id="login-email"
  type="email"
  autoComplete="email"
  required
  aria-required="true"
  aria-invalid={!!emailError}
  aria-describedby={emailError ? 'login-email-error' : undefined}
  ...
/>
{emailError && (
  <p id="login-email-error" role="alert" className="text-[12px] text-destructive">
    {emailError}
  </p>
)}
```

- Add a live region for the send / sent state change:

```tsx
<div role="status" aria-live="polite" aria-atomic="true" className="sr-only">
  {sent ? `Magic link sent to ${email}` : sending ? 'Sending magic link…' : ''}
</div>
```

### 1-C. DataTable — table semantics

**File: `src/components/ui/data-table.tsx`**

- Wrap the table container in a keyboard-scrollable region:

```tsx
<div
  role="region"
  aria-label={caption ?? 'Data table'}
  tabIndex={0}
  className="bg-muted rounded-lg overflow-x-auto"
>
```

- Add a screen-reader caption inside each `<Table>`:

```tsx
<Table>
  <caption className="sr-only">{caption ?? 'Table data'}</caption>
  ...
</Table>
```

- Add a `caption` prop to `DataTableProps` so callers can provide context (e.g. "Schedule — 47 candidates").
- In `TableHead`, add `scope="col"` to every header cell.
- In rows with a name/identifier column, render that cell as `<th scope="row">` instead of `<td>`.

### 1-D. Chat — live region

**File: `src/components/chat/ChatInterface.tsx`**

- Wrap message list in a log region:

```tsx
<div
  role="log"
  aria-live="polite"
  aria-atomic="false"
  aria-label="Conversation"
  className="..."
>
  {messages.map(...)}
</div>
```

- Ensure Enter submits the form; Shift+Enter inserts a newline.
- Add `<label htmlFor="chat-input" className="sr-only">Message</label>` above the textarea.

---

## P2 — ARIA roles & states

### 2-A. ProgressRing — accessible SVG

**File: `src/components/layout/ProgressRing.tsx`**

```tsx
<svg
  role="img"
  aria-label={`Interview progress: ${done} of ${total} complete`}
  ...
>
  <title>Interview progress: {done} of {total} complete</title>
  ...
</svg>
```

### 2-B. Header — toolbar landmark + icon labels

**File: `src/components/layout/Header.tsx`**

- Wrap action buttons in a toolbar:

```tsx
<div role="toolbar" aria-label="Dashboard actions" className="flex items-center gap-1.5 flex-wrap">
  ...buttons...
</div>
```

- Any icon-only button must have `aria-label` (currently the `★ Shortlist` button has text — OK; verify ThemeToggle and Print).

### 2-C. ThemeToggle — pressed state

**File: `src/components/layout/ThemeToggle.tsx`**

```tsx
<Button aria-pressed={isDark} aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'} ...>
```

### 2-D. TabNav — `aria-selected` + keyboard navigation

**File: `src/components/layout/TabNav.tsx`**

Two additions:

**1. `aria-selected` on each tab** (required for WCAG 4.1.2 — Name, Role, Value):

```tsx
<NavLink
  role="tab"
  aria-selected={isActive}
  ...
>
```

**2. Arrow-key keyboard navigation** (ARIA APG Tabs pattern):

```tsx
function handleKeyDown(e: React.KeyboardEvent, index: number) {
  const total = tabs.length
  let next: number | null = null
  if (e.key === 'ArrowRight') next = (index + 1) % total
  else if (e.key === 'ArrowLeft') next = (index - 1 + total) % total
  else if (e.key === 'Home') next = 0
  else if (e.key === 'End') next = total - 1
  if (next !== null) {
    e.preventDefault()
    tabRefs.current[next]?.focus()
    navigate(tabs[next].to)
  }
}
```

Attach to `onKeyDown` on each `NavLink`, store refs in `tabRefs`.

### 2-E. Avatar initials — decorative

**File: `src/components/cards/CardHeader.tsx`** (and any other avatar usage)

Where the candidate name is visible next to the avatar, mark initials as decorative:

```tsx
<div aria-hidden="true" className="avatar-initials">
  ...
</div>
```

---

## P3 — Mobile responsiveness

### 3-A. Layout padding — mobile-first scale

**File: `src/components/layout/Layout.tsx`**

```tsx
// Before
<main className="max-w-[1480px] mx-auto px-6 py-7">

// After
<main className="max-w-[1480px] mx-auto px-4 py-5 sm:px-6 sm:py-7 lg:px-10 lg:py-8">
```

### 3-B. Header — mobile stacking

**File: `src/components/layout/Header.tsx`**

On small screens the header wraps awkwardly. Restructure into two explicit rows:

```tsx
<header className="sticky top-0 z-[100] border-b border-border px-4 sm:px-6 ...">
  {/* Row 1: brand + progress (always visible) */}
  <div className="flex items-center justify-between py-2.5 sm:py-3.5">
    <div className="flex items-center gap-3">{/* logo + ring + pipeline snapshot */}</div>
    {/* Actions — hidden on mobile, shown sm+ */}
    <div className="hidden sm:flex items-center gap-1.5">
      {/* Export, Print, Theme, Sign out */}
    </div>
    {/* Mobile menu trigger */}
    <button className="sm:hidden" aria-label="Open actions menu">
      ...
    </button>
  </div>
  {/* Row 2: overflowing actions on mobile (collapsible or scrollable strip) */}
</header>
```

Exact implementation is flexible — a scrollable horizontal strip or a disclosure button both work.

### 3-C. TabNav — touch size

**File: `src/components/layout/TabNav.tsx`**

Tabs currently have `py-2.5` (~10px vertical). On coarse pointers the 44px rule from P0-C covers this automatically, but also make text size responsive:

```tsx
className = '... text-[13px] sm:text-[13px] py-2.5 sm:py-2.5 ...'
// The touch-target CSS handles the 44px floor — no padding change needed
```

### 3-D. ProfileModal — full-screen on mobile

**File: `src/components/profile/ProfileModal.tsx`** (or `src/components/ui/dialog.tsx` `DialogContent`)

```tsx
// Adjust DialogContent className:
'fixed inset-0 sm:inset-auto sm:top-[50%] sm:left-[50%] sm:translate-x-[-50%] sm:translate-y-[-50%]
 w-full h-full sm:h-auto sm:max-w-3xl sm:rounded-lg rounded-none ...'
```

On mobile: full-screen. On ≥640px: centered card (current behaviour).

### 3-E. Table horizontal scroll wrapper

**File: `src/components/ui/data-table.tsx`**

Already has `overflow-x-auto`. Ensure the keyboard-scrollable wrapper from P1-C is in place with `tabIndex={0}` so keyboard users can reach content that overflows.

---

## P4 — Color contrast audit

Reference ratios (§3i of handoff spec):

| Token                            | Value     | On white | Status                                                                    |
| -------------------------------- | --------- | -------- | ------------------------------------------------------------------------- |
| `--text3` / `--muted-foreground` | `#717182` | 4.61:1   | ✅ passes AA for normal text                                              |
| `--text4`                        | `#bababa` | 2.41:1   | ❌ **never use for readable text** — decorative only                      |
| `--brand` / `--primary`          | `#195f6b` | 7.12:1   | ✅                                                                        |
| `--green` / `--success`          | `#1ba676` | 3.13:1   | ❌ fails AA for normal text; OK for UI components ≥18px or with border    |
| `--amber` / `--warning`          | `#e49028` | 2.6:1    | ❌ fails AA for text — use `--color-orange-800` (#7d430f) for text labels |
| `--destructive`                  | `#cc0000` | 5.9:1    | ✅                                                                        |

### Actions needed

- **`--text4`**: grep `text-text4`, `text-muted-foreground` usages where they label actual content. Switch any content text to `--text2` or `--text3`.
- **`--green` as text**: verdict chips ("Strong Yes", "Yes") are small text on a colored background. Ensure either:
  - The chip uses a border _and_ an icon alongside the label (color is not the sole signal — WCAG 1.4.1), or
  - The background color passes 4.5:1 against the text color (e.g. white text on `--color-green-800` `#136549` which is 5.9:1 ✅)
- **`--amber` as text**: Same pattern. "Pending" status badge — use `--color-orange-800` for text, or white text on a sufficiently dark orange background.

---

## P5 — Form labels & autocomplete

Apply to every form across the app:

| Component                                       | Fields to fix                                                      |
| ----------------------------------------------- | ------------------------------------------------------------------ |
| `LoginPage.tsx`                                 | Email — see P1-B                                                   |
| `EmailDraftModal.tsx`                           | To, Subject, Body — add `<label>`, `autocomplete`, `aria-required` |
| `ProfileModal.tsx`                              | Notes textarea — add `<label>` (not just adjacent heading)         |
| `ChatPage.tsx`                                  | API key input — add `<label htmlFor>` + `type="password"` (verify) |
| Any `<input placeholder="…">` without `<label>` | Add visually hidden `<label>`                                      |

Pattern to apply:

```tsx
<label htmlFor={id} className="sr-only">{labelText}</label>
<Input
  id={id}
  autoComplete="email"   // appropriate value per field
  required
  aria-required="true"
  aria-invalid={!!error}
  aria-describedby={error ? `${id}-error` : undefined}
/>
{error && (
  <p id={`${id}-error`} role="alert" className="text-xs text-destructive">
    {error}
  </p>
)}
```

---

## Keyboard checklist (verify after implementation)

For every screen:

- [ ] Tab moves through every interactive element in logical DOM order
- [ ] No keyboard traps (Tab always moves forward; Shift+Tab always moves back)
- [ ] Skip link is first focusable element and works (`href="#main-content"`)
- [ ] Escape closes every modal / dialog
- [ ] Enter and Space activate `<button>` and `role="button"` elements
- [ ] Arrow keys navigate: tabs (Left/Right), radio groups, menus
- [ ] Focus ring is visible at every interactive element (`:focus-visible`)
- [ ] Focus returns to trigger element after modal closes
- [ ] No `tabindex` value greater than 0 anywhere

---

## Testing matrix

| Viewport              | Browser / AT                     | Flows                                     |
| --------------------- | -------------------------------- | ----------------------------------------- |
| 375px (iPhone SE)     | iOS Safari + VoiceOver           | Login → Dashboard → Cards → Profile modal |
| 393px (iPhone 14 Pro) | iOS Safari + VoiceOver           | Same                                      |
| 768px (iPad)          | Safari                           | All tabs, table scroll                    |
| 1280px                | Chrome                           | Full flow                                 |
| 1920px                | Chrome                           | Full flow                                 |
| Any                   | Chrome + NVDA                    | Login, tabs, modals                       |
| Any                   | Keyboard only                    | Full flow                                 |
| Any                   | 200% zoom                        | No content clipped, no horizontal scroll  |
| Any                   | 400% zoom + reflow               | Content reflows to single column          |
| Any                   | Windows High Contrast            | All UI visible                            |
| Any                   | `prefers-reduced-motion` enabled | No auto-playing animation                 |

---

## Implementation order (by effort + impact)

| #   | Phase                                  | Files                              | Notes                           |
| --- | -------------------------------------- | ---------------------------------- | ------------------------------- |
| 1   | P0 — Global CSS                        | `globals.css`, `index.html`        | Non-breaking; instant wins      |
| 2   | P1-B — LoginPage semantics             | `LoginPage.tsx`                    | High visibility; single file    |
| 3   | P2-D — TabNav aria-selected + keyboard | `TabNav.tsx`                       | Fixes live WCAG 4.1.2 violation |
| 4   | P2-A — ProgressRing label              | `ProgressRing.tsx`                 | 3-line change                   |
| 5   | P2-C — ThemeToggle aria-pressed        | `ThemeToggle.tsx`                  | 2-line change                   |
| 6   | P1-A — Layout main landmark + panel    | `Layout.tsx`                       | Enables skip link target        |
| 7   | P1-C — DataTable table semantics       | `data-table.tsx`                   | Covers all table views          |
| 8   | P2-B — Header toolbar                  | `Header.tsx`                       | + mobile stacking (P3-B)        |
| 9   | P1-D — Chat live region                | `ChatInterface.tsx`                |                                 |
| 10  | P3-D — ProfileModal mobile             | `dialog.tsx` or `ProfileModal.tsx` |                                 |
| 11  | P4 — Color contrast audit              | Spread                             | Grep + targeted edits           |
| 12  | P5 — Form labels + autocomplete        | `EmailDraftModal`, `ProfileModal`  |                                 |
