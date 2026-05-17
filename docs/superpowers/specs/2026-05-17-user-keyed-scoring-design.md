# User-Keyed Scoring & Comments Design

**Date:** 2026-05-17  
**Status:** Approved — implementing

---

## Problem

The scoring system was built around two hardcoded slots ("peter" / "ossama"). These are names of real people treated as system identifiers — wrong in every way. The system should treat scorers as users: any number of them, identified only by their `user_id`, named by their profile.

---

## Decisions

| Question                        | Decision                                           |
| ------------------------------- | -------------------------------------------------- |
| See others' scores immediately? | Yes — no blinding                                  |
| Score display layout            | Two sub-tabs: Scores (table) + Summary (aggregate) |
| Save mechanism                  | Immediate on star click — no save button           |
| Comments visibility             | Always visible, others read-only                   |
| Combined score formula          | Average of all scorers' totals                     |
| `scorer_slot` in profiles       | Remove entirely                                    |
| Old `interview_state` columns   | Drop                                               |

---

## Database Changes

### Migration 1 — Drop old interview_state columns

```sql
ALTER TABLE interview_state
  DROP COLUMN peter_scores,
  DROP COLUMN ossama_scores,
  DROP COLUMN peter_comment,
  DROP COLUMN ossama_comment;
```

### Migration 2 — Drop scorer_slot from profiles

```sql
ALTER TABLE profiles DROP COLUMN scorer_slot;
```

### Migration 3 — Allow all intellaworld users to read all profiles

```sql
-- Needed so users can see co-scorers' names
CREATE POLICY "profiles: select all intellaworld"
  ON profiles FOR SELECT
  USING (is_intellaworld_user());
```

The `scores` and `candidate_comments` tables already exist with correct schema and RLS — no changes.

---

## Data Layer

### `useAllScores(userId)`

- Fetches all rows from `scores` table
- Returns:
  - `myScoresFor(candidateId)` → `Scores` for current user
  - `allScoresFor(candidateId)` → `Array<{ userId, name, scores, total, isMe }>`
  - `combinedScoreFor(candidateId)` → average of all users' totals
  - `combinedScoreMap` → `Record<candidateId, number>` for analytics/exports
  - `setMyScore(candidateId, category, value)` → immediate upsert

### `useAllComments(userId)`

- Fetches all rows from `candidate_comments` table
- Returns:
  - `myCommentFor(candidateId)` → string
  - `allCommentsFor(candidateId)` → `Array<{ userId, name, body, isMe }>`
  - `setMyComment(candidateId, body)`

### `useTeamProfiles()`

- Fetches all profiles — used to resolve names for scores/comments
- Cached with `staleTime: 5min`

### Deleted

- `useInterviewerNames` — removed entirely
- Slot-based helpers from `useCandidateState` — already removed in Phase 5

---

## Score Tab UI

### "Scores" sub-tab — comparison table

```
                | You (Andrew) | Sarah  | John   |
Communication   |   ★★★★☆     | ★★★☆☆  | ★★★★★  |
Technical       |   ★★★☆☆     | ★★★★☆  | ★★★☆☆  |
Culture Fit     |   ★★★★☆     | ★★☆☆☆  | ★★★★☆  |
Leadership      |   ★★★☆☆     | ★★★☆☆  | ★★★☆☆  |
Overall         |   ★★★★☆     | ★★★★☆  | ★★★★☆  |
─────────────────────────────────────────────────
Total           |    18/25    |  15/25  |  18/25  |  Combined: 17
```

- Your column: stars are interactive, save immediately on click
- Others' columns: read-only star display
- If a user hasn't scored: column shows `—` in all cells
- Score categories driven by `hiring_round.score_categories`

### "Summary" sub-tab — aggregate view

- Large combined score at top: `★ 17 / 25`
- Per-category average shown as a bar or star display
- Per-user totals listed below: "Andrew — 18/25", "Sarah — 15/25"

### Comments — below both sub-tabs

- Your comment: textarea + Save button (explicit save, since it's free text)
- Other users' comments: read-only cards labeled by name
- Always visible

### Status & Verdict — at top of Score tab (above sub-tabs)

---

## Removed Concepts

- `scorer_slot` — gone from profiles table and UI
- `Scorecard` old props (`myScores`, `coScores`, `myName`, `coName`) — replaced by self-contained hook calls
- `useInterviewerNames` — deleted
- Per-slot score columns in RankingTable — replaced by single "Combined" column
- Blinding mechanic — removed

---

## Files Changed

| File                                                     | Change                                           |
| -------------------------------------------------------- | ------------------------------------------------ |
| `supabase/migrations/009_drop_legacy_scorer_columns.sql` | New migration                                    |
| `src/lib/database.types.ts`                              | Remove dropped fields                            |
| `src/hooks/useAllScores.ts`                              | Add `allScoresFor` with names                    |
| `src/hooks/useAllComments.ts`                            | Add `allCommentsFor` with names                  |
| `src/hooks/useTeamProfiles.ts`                           | New — fetch all profiles                         |
| `src/hooks/useInterviewerNames.ts`                       | Delete                                           |
| `src/hooks/usePipelineStats.ts`                          | Replace old column reads with scores table count |
| `src/components/cards/Scorecard.tsx`                     | Rewrite as comparison table                      |
| `src/components/cards/Comments.tsx`                      | Rewrite for N users                              |
| `src/components/profile/ProfileScore.tsx`                | Add sub-tabs, use new hooks                      |
| `src/components/profile/ProfileDrawer.tsx`               | Remove scorer_slot field                         |
| `src/components/analysis/RankingTable.tsx`               | Remove scorer columns, single combined           |
| `src/hooks/useAuditLog.ts`                               | Update FIELD_LABELS                              |
| `src/pages/CardsPage.tsx`                                | Remove useInterviewerNames                       |
| `supabase/seed/index.ts`                                 | Remove old columns from insert                   |
