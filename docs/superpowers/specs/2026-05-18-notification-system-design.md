# Notification System Design

**Date:** 2026-05-18
**Status:** Approved

## Problem

`AlertBanners` is hardcoded with two specific candidate names and dates. It shows on every page but never updates. `ActionQueue` is fully dynamic but only visible on the Cards tab and only for the selected job. There is no global, actionable notification system.

## Goals

- Replace hardcoded `AlertBanners` with a fully dynamic notification system
- Notifications visible on every tab via a bell icon in the header
- Each notification is actionable — clicking navigates the user to the exact place to take action
- Session-only dismiss; conditions auto-clear when resolved

## Out of Scope

- Persistent per-user dismissal (stored in DB)
- `no-followup-email` rule (requires email send tracking, not yet implemented)
- Push notifications / email alerts

---

## Dismissal Behavior

- **X button per item** → session-only snooze (React `useState`). Item returns on next page load if condition is unresolved.
- **Condition resolved** → notification disappears automatically. No manual action needed.
- No persistent storage of dismissed state.

---

## Notification Rules

All rules run in a single pass over all candidates (across all jobs). Items are sorted by urgency: red → amber → blue.

| Rule                        | Condition                                          | Color |
| --------------------------- | -------------------------------------------------- | ----- |
| `slot-today-unconfirmed`    | Slot date = today, `confirmed = false`             | red   |
| `overdue-scorecard`         | `interview_status = completed`, no scores filled   | red   |
| `no-slot`                   | `slot` is null or `'TBD'`                          | amber |
| `slot-tomorrow-unconfirmed` | Slot date = tomorrow, `confirmed = false`          | amber |
| `unconfirmed`               | Slot is set (beyond tomorrow), `confirmed = false` | amber |
| `no-verdict`                | `interview_status = completed`, `verdict = null`   | blue  |

The existing `unconfirmed` rule is kept for slots beyond tomorrow. The two new time-aware variants (`slot-today-unconfirmed`, `slot-tomorrow-unconfirmed`) take priority.

### Slot Parsing

Slots are stored as strings like `"Sun 17 May 11:00-12:00"`. A `parseSlotDate(slot: string | null): Date | null` utility parses the start time using the current year. Returns `null` if the string cannot be parsed, treating the slot as effectively absent.

---

## Architecture

### `src/lib/actionQueue.ts`

- Add `no-slot`, `slot-today-unconfirmed`, `slot-tomorrow-unconfirmed` to `ActionItemType`
- Add `jobId: number` to `ActionItem` interface — needed for slug resolution in `NotificationBell`
- Add `parseSlotDate(slot: string | null): Date | null`
- Update `deriveActionItems` to pass `jobId` through from the candidate input and apply new rules, sorted by urgency (red first)
- Export `TYPE_COLORS: Record<ActionItemType, string>` from this file so both `ActionQueue` and `NotificationBell` share the same color map

### `src/hooks/useNotifications.ts` (new)

Fetches all candidates and their state/scores globally (not filtered by job). Calls `deriveActionItems` and returns the sorted list. Used exclusively by the bell icon in the header.

```ts
export function useNotifications(): ActionItem[]
```

Data sources:

- `useCandidateMeta()` — all candidates, no job filter
- `useCandidateState()` — full state map
- `useAllScores(user?.id)` — for overdue-scorecard check

### `src/components/layout/NotificationBell.tsx` (new)

Bell icon button in the header. Uses Radix `Popover` (already in the project).

**Trigger:**

- `BellIcon` from lucide-react
- Red badge showing item count, hidden when count = 0

**Dropdown panel:**

- Max height `max-h-[400px]` with `overflow-y-auto` scroll
- Empty state: "All caught up" with muted text
- Each row:
  - Urgency dot (colored)
  - Candidate name (semibold)
  - Message text
  - Entire row is clickable
  - X button on the right for session dismiss

**Click behavior:**

- Navigates to `/cards?job=<candidateJobSlug>&profile=<candidateId>`
- Requires resolving `candidateJobSlug` from the candidate's `job_id` via `useJobs()`
- Closes dropdown immediately

**Dismiss behavior:**

- `dismissed` set in `useState<Set<string>>` keyed by `candidateId + ':' + type`
- Items filtered from display; not persisted

### `src/components/layout/Header.tsx`

- Import and render `<NotificationBell />` in the action row, between the job selector and the "+ Add candidate" button

### `src/components/layout/AlertBanners.tsx`

- **Deleted**

### `src/components/layout/Layout.tsx`

- Remove `<AlertBanners />` import and usage

### `src/components/cards/ActionQueue.tsx`

- **Kept as-is** — job-filtered contextual view on Cards tab
- Complements the bell (global) without duplicating it
- Remove local `TYPE_COLORS` definition; import it from `src/lib/actionQueue.ts` instead

---

## Data Flow

```
useNotifications (global, all jobs)
  └── useCandidateMeta (no jobId filter)
  └── useCandidateState
  └── useAllScores
  └── useJobs (for slug resolution on click)
  └── deriveActionItems → sorted ActionItem[]
        └── NotificationBell (header, all pages)

ActionQueue (Cards page only)
  └── candidates prop (job-filtered, from CardsPage)
  └── stateMap
  └── useAllScores
  └── deriveActionItems → sorted ActionItem[]
```

---

## Navigation on Click

Clicking a notification row navigates to:

```
/cards?job=<candidateJobSlug>&profile=<candidateId>
```

This opens the Cards tab with the candidate's job selected and their profile modal open — the exact place to take action (assign slot, confirm, fill scorecard, set verdict).

Uses `useNavigate` from React Router + `createSearchParams`.
