# Interview Page Design

> **For agentic workers:** Use `superpowers:writing-plans` to create the implementation plan from this spec.

**Goal:** A dedicated, stable full-page interview view per candidate that shows interview questions with per-question note-taking, preventing accidental navigation when notes are unsaved.

**Architecture:** A new route `/interview/:candidateId` sits inside `AuthGuard` but outside the main `Layout`. Questions are loaded from `interview_questions` (job-specific first, general always appended). Notes are stored in `interview_state.notes` as JSONB, keyed by `"${section.id}-${questionIndex}"`. The candidate's job context drives which job-specific sections appear.

**Tech stack:** React 18, TypeScript, React Router v6 (`useBlocker`), TanStack Query, Supabase, Tailwind CSS, nuqs (existing patterns).

---

## 1. Data Layer

### Migration `013_interview_page.sql`

Three changes in one migration:

**1. Drop `hiring_rounds`** — fully dead table, zero app references.

```sql
DROP TABLE IF EXISTS hiring_rounds;
```

**2. Add `notes` to `interview_state`**

```sql
ALTER TABLE interview_state
  ADD COLUMN notes jsonb NOT NULL DEFAULT '{}';
```

**3. Extend `interview_questions`** with `is_general` and `job_id`:

```sql
ALTER TABLE interview_questions
  ADD COLUMN is_general boolean NOT NULL DEFAULT false,
  ADD COLUMN job_id integer REFERENCES jobs(id);

-- Existing PM questions become job-specific (job id 2 = product-manager)
UPDATE interview_questions SET is_general = false, job_id = 2;

-- Insert general questions (versatile, tech + non-tech friendly)
-- 3 sections covering: general background, communication/collaboration, reflection
INSERT INTO interview_questions (position, title, duration, goal, color, bg, questions, is_general, job_id)
VALUES
  (100, 'Background & Motivation',  '5-10 min', 'Understand the candidate''s trajectory and what drives them.',
   '#6366f1', '#eef2ff',
   ARRAY[
     'Walk me through your career so far. What has been your most meaningful role and why?',
     'What drew you to apply for this position at Intella?',
     'What does success look like for you in the first 6 months of a new role?'
   ], true, null),

  (101, 'Collaboration & Communication', '5-10 min', 'Assess how the candidate works with others and handles conflict.',
   '#0ea5e9', '#f0f9ff',
   ARRAY[
     'Describe a situation where you had to align people with different priorities. How did you handle it?',
     'Tell me about a time you gave or received feedback that changed how you worked.',
     'How do you prefer to communicate progress and blockers on a project?'
   ], true, null),

  (102, 'Reflection & Growth', '5 min', 'Assess self-awareness, learning mindset, and cultural fit.',
   '#10b981', '#f0fdf4',
   ARRAY[
     'What is something you are actively trying to improve about the way you work?',
     'Tell me about a failure or mistake you made. What did you learn?',
     'What kind of environment brings out your best work?'
   ], true, null);
```

### `database.types.ts` updates

- `interview_state.Row/Insert/Update`: add `notes: Json`
- `interview_questions.Row`: add `is_general: boolean`, `job_id: number | null`

---

## 2. `useInterviewQuestions` hook

Accepts an optional `jobId?: number`. Returns job-specific sections (where `job_id = jobId`) ordered by `position`, followed by general sections (`is_general = true`) also ordered by `position`. When no `jobId` is provided (existing QuestionsPage), returns all sections ordered by `position` — preserving current behaviour.

```ts
useInterviewQuestions(jobId?: number): { questions: Question[], loading: boolean }
```

General sections use `position` values 100+ so they always sort after job-specific sections (which use 1–7) within the same `ORDER BY position` query.

---

## 3. `useCandidateState` — `setNotes`

Thin wrapper over the existing `updateState`, same pattern as `setConfirmed` / `setVerdict`:

```ts
const setNotes = useCallback(
  (id: string, notes: Record<string, string>) => updateState(id, { notes }),
  [updateState],
)
```

Notes are read from `stateMap[candidateId]?.notes` — already loaded at startup since `useCandidateState` fetches all state rows.

---

## 4. Routing

`App.tsx` gains a sibling route to the Layout route, wrapped in its own `AuthGuard`:

```tsx
<Route
  path="/interview/:candidateId"
  element={
    <AuthGuard>
      <InterviewPage />
    </AuthGuard>
  }
/>
```

The Schedule page navigates with `useNavigate('/interview/${candidate.id}')` — normal navigation, no new tab.

---

## 5. Interview page

**File:** `src/pages/InterviewPage.tsx`

### Header (sticky)

Displays: candidate name, job title (from `profile.title`), salary (formatted), notice period. Back button `← Schedule` that triggers the dirty guard if notes are unsaved.

Save state indicator next to the save button:

- Default: "Save notes" button, no indicator
- Dirty: "Unsaved changes" label appears (subtle, muted text)
- Saving: button shows "Saving…"
- Saved: brief "Saved ✓" then fades

### Body

All sections expanded by default (no accordion). Per section:

- Section header: title, duration, goal (same colour-coded style as QuestionsPage)
- Job-specific sections appear first; general sections follow with a subtle visual separator ("General questions" label)
- Per question: question text, then a `<textarea>` below it for notes

### Note keys

Notes JSONB key: `"${section.id}-${questionIndex}"` — uses the DB section `id` (stable integer) and zero-based question index within the section's `questions` array.

### Save mechanics

- Textareas write to **local state only** (`Record<string, string>`)
- Local state is initialized from `stateMap[candidateId]?.notes` on load
- Dirty = local state differs from last saved state (deep equality check)
- "Save notes" button calls `setNotes(candidateId, localNotes)` — single write of the full notes object
- No auto-save, no blur-save — recruiter controls when to save

### Dirty guard

Uses React Router v6 `useBlocker`:

- Blocks navigation when `isDirty === true`
- Shows native `window.confirm`: "You have unsaved notes. Leave anyway?"
- If confirmed: allow navigation (notes discarded)
- If cancelled: stay on page

---

## 6. Schedule page change

Each row in the Schedule table gets an "Interview" button that navigates to `/interview/${candidate.id}`. Uses `useNavigate` from React Router.

---

## Out of scope

- Questions per job UI (managed in DB directly for now)
- Per-interviewer notes (notes are shared across the team)
- Rich text / code block formatting in note textareas (plain text only)
- Timer or scoring inputs on the interview page (those live in ProfileModal → Score tab)
