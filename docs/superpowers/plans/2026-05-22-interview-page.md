# Interview Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a full-page `/interview/:candidateId` route with per-question note-taking, candidate context header, explicit save, and a dirty-state navigation guard.

**Architecture:** New sibling route to the Layout route in `App.tsx`, wrapped in its own `AuthGuard`. `useInterviewQuestions` gains an optional `jobId` param to return job-specific sections first, then general sections. Notes live in `interview_state.notes` (JSONB), written by a new `setNotes` wrapper in `useCandidateState`. A local state copy tracks edits; the guard (`useBlocker`) fires only when local state diverges from saved.

**Tech Stack:** React 18, TypeScript, React Router v6 (`useBlocker`), TanStack Query, Supabase, Tailwind CSS.

> **Project convention:** Do NOT commit — stage all changes and await user review before committing.
> **Tests:** Unit tests are written as a final task (Task 8), not inline per task.

---

## File Map

| Action | File                                                | Responsibility                            |
| ------ | --------------------------------------------------- | ----------------------------------------- |
| Create | `supabase/migrations/013_interview_page.sql`        | DB schema changes                         |
| Modify | `src/lib/database.types.ts`                         | Add `notes`, `is_general`, `job_id` types |
| Modify | `src/hooks/useInterviewQuestions.ts`                | Accept optional `jobId`                   |
| Modify | `src/hooks/useCandidateState.ts`                    | Add `setNotes`                            |
| Modify | `src/App.tsx`                                       | Add `/interview/:candidateId` route       |
| Create | `src/pages/InterviewPage.tsx`                       | Full interview page                       |
| Modify | `src/pages/SchedulePage.tsx`                        | Add "Interview" button column             |
| Test   | `src/hooks/__tests__/useInterviewQuestions.test.ts` | Hook unit tests                           |

---

### Task 1: Migration 013

**Files:**

- Create: `supabase/migrations/013_interview_page.sql`

- [ ] **Step 1: Create migration file**

```sql
-- 1. Drop dead table (zero app references)
DROP TABLE IF EXISTS hiring_rounds;

-- 2. Add notes to interview_state
ALTER TABLE interview_state
  ADD COLUMN notes jsonb NOT NULL DEFAULT '{}';

-- 3. Extend interview_questions with is_general + job_id
ALTER TABLE interview_questions
  ADD COLUMN is_general boolean NOT NULL DEFAULT false,
  ADD COLUMN job_id integer REFERENCES jobs(id);

-- Existing PM questions become job-specific (job id 2 = product-manager)
UPDATE interview_questions SET is_general = false, job_id = 2;

-- Insert 3 general sections (position 100+ so they sort after job-specific 1-7)
INSERT INTO interview_questions (position, title, duration, goal, color, bg, questions, is_general, job_id)
VALUES
  (100, 'Background & Motivation', '5-10 min', 'Understand the candidate''s trajectory and what drives them.',
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

- [ ] **Step 2: Apply migration to dev** (user-gated for prod per project convention)

```bash
# Apply via Supabase CLI (dev only)
npx supabase db push
# OR via the Supabase dashboard SQL editor
```

---

### Task 2: TypeScript types

**Files:**

- Modify: `src/lib/database.types.ts:67-93`

- [ ] **Step 1: Add `notes` to `interview_state`**

Find the `interview_state` block (lines ~67-79) and replace:

```ts
interview_state: {
  Row: {
    candidate_id: string
    confirmed: boolean
    shortlisted: boolean | null
    interview_status: 'pending' | 'in-progress' | 'completed'
    verdict: 'strong-yes' | 'yes' | 'maybe' | 'no' | null
    checklist: Json
    notes: Json
    updated_at: string
  }
  Insert: Omit<Database['public']['Tables']['interview_state']['Row'], 'updated_at'>
  Update: Partial<Database['public']['Tables']['interview_state']['Insert']>
}
```

- [ ] **Step 2: Add `is_general` and `job_id` to `interview_questions`**

Find the `interview_questions` block (lines ~80-93) and replace:

```ts
      interview_questions: {
        Row: {
          id: number
          position: number
          title: string
          duration: string | null
          goal: string | null
          color: string | null
          bg: string | null
          questions: string[] | null
          is_general: boolean
          job_id: number | null
        }
        Insert: Omit<Database['public']['Tables']['interview_questions']['Row'], 'id'>
        Update: Partial<Database['public']['Tables']['interview_questions']['Insert']>
      }
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
yarn tsc --noEmit
```

Expected: no errors related to `notes`, `is_general`, or `job_id`.

---

### Task 3: `useInterviewQuestions` — optional `jobId` param

**Files:**

- Modify: `src/hooks/useInterviewQuestions.ts`

- [ ] **Step 1: Rewrite hook to accept optional `jobId`**

Replace the entire file:

```ts
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Database } from '@/lib/database.types'

type Question = Database['public']['Tables']['interview_questions']['Row']

export function useInterviewQuestions(jobId?: number) {
  const { data: questions = [], isLoading: loading } = useQuery({
    queryKey: ['interview-questions', jobId],
    queryFn: async () => {
      if (jobId !== undefined) {
        const { data } = await supabase
          .from('interview_questions')
          .select('*')
          .or(`job_id.eq.${jobId},is_general.eq.true`)
          .order('position')
        return (data ?? []) as Question[]
      }
      const { data } = await supabase.from('interview_questions').select('*').order('position')
      return (data ?? []) as Question[]
    },
  })

  return { questions, loading }
}
```

> When `jobId` is provided the OR filter fetches job-specific sections (positions 1-7) and general sections (positions 100+). Since general positions are 100+, `ORDER BY position` naturally places job-specific sections first. When `jobId` is omitted (QuestionsPage), all sections are returned ordered by position — preserving existing behavior.

- [ ] **Step 2: Verify QuestionsPage still compiles**

`QuestionsPage` calls `useInterviewQuestions()` with no args — the optional param means no change is needed there.

```bash
yarn tsc --noEmit
```

Expected: no errors.

---

### Task 4: `useCandidateState` — add `setNotes`

**Files:**

- Modify: `src/hooks/useCandidateState.ts`

- [ ] **Step 1: Add `setNotes` after `setChecklist`**

In `src/hooks/useCandidateState.ts`, after the `setChecklist` declaration (line ~68) add:

```ts
const setNotes = useCallback(
  (id: string, notes: Record<string, string>) => updateState(id, { notes }),
  [updateState],
)
```

- [ ] **Step 2: Add `setNotes` to the return object**

Find the return statement and add `setNotes`:

```ts
return {
  stateMap,
  loading,
  updateState,
  setVerdict,
  setInterviewStatus,
  setShortlisted,
  setConfirmed,
  setChecklist,
  setNotes,
}
```

- [ ] **Step 3: Verify**

```bash
yarn tsc --noEmit
```

Expected: no errors.

---

### Task 5: Route in `App.tsx`

**Files:**

- Modify: `src/App.tsx`

- [ ] **Step 1: Import `InterviewPage`**

Add to the import block at the top of `src/App.tsx`:

```ts
import { InterviewPage } from '@/pages/InterviewPage'
```

- [ ] **Step 2: Add sibling route outside Layout**

After the closing `</Route>` for the Layout route (line ~53), add:

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

The full `<Routes>` block should look like:

```tsx
<Routes>
  <Route path="/login" element={<LoginPageWithError />} />
  <Route path="/auth/callback" element={<AuthCallback />} />
  <Route
    path="/"
    element={
      <AuthGuard>
        <Layout />
      </AuthGuard>
    }
  >
    <Route index element={<Navigate to="/cards" replace />} />
    <Route path="cards" element={<CardsPage />} />
    <Route path="schedule" element={<SchedulePage />} />
    <Route path="compare" element={<ComparePage />} />
    <Route path="questions" element={<QuestionsPage />} />
    <Route path="salary" element={<SalaryPage />} />
    <Route path="briefing" element={<BriefingPage />} />
    <Route path="analysis" element={<AnalysisPage />} />
    <Route path="chat" element={<ChatPage />} />
  </Route>
  <Route
    path="/interview/:candidateId"
    element={
      <AuthGuard>
        <InterviewPage />
      </AuthGuard>
    }
  />
</Routes>
```

- [ ] **Step 3: Verify**

```bash
yarn tsc --noEmit
```

---

### Task 6: `InterviewPage`

**Files:**

- Create: `src/pages/InterviewPage.tsx`

- [ ] **Step 1: Create the page**

```tsx
import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate, useBlocker } from 'react-router-dom'
import { useCandidates } from '@/hooks/useCandidates'
import { useCandidateState } from '@/hooks/useCandidateState'
import { useInterviewQuestions } from '@/hooks/useInterviewQuestions'
import { formatSalary } from '@/lib/salary'
import { Spinner } from '@/components/ui/spinner'
import { Button } from '@/components/ui/button'
import type { Database } from '@/lib/database.types'

type Question = Database['public']['Tables']['interview_questions']['Row']
type SaveStatus = 'idle' | 'saving' | 'saved'

function SectionCard({
  section,
  localNotes,
  onNoteChange,
}: {
  section: Question
  localNotes: Record<string, string>
  onNoteChange: (key: string, value: string) => void
}) {
  return (
    <div
      className="bg-surface border border-border rounded-[var(--radius)] overflow-hidden shadow-[var(--shadow-sm)]"
      style={{ borderLeft: `3px solid ${section.color ?? 'var(--border)'}` }}
    >
      <div className="px-5 py-4" style={{ background: section.bg ?? undefined }}>
        <p className="font-semibold text-[14px] text-text tracking-tight">{section.title}</p>
        <div className="flex items-center gap-3 mt-1">
          {section.duration && <span className="text-[12px] text-text3">⏱ {section.duration}</span>}
          {section.goal && <span className="text-[12px] text-text3">{section.goal}</span>}
        </div>
      </div>

      {section.questions && (
        <div className="border-t border-border divide-y divide-border">
          {(section.questions as string[]).map((q, i) => {
            const key = `${section.id}-${i}`
            return (
              <div key={key} className="px-5 py-4 flex flex-col gap-2">
                <div className="flex items-start gap-3 text-[13px]">
                  <span className="font-mono text-[12px] text-text3 mt-0.5 shrink-0">Q{i + 1}</span>
                  <span className="text-text leading-relaxed">{q}</span>
                </div>
                <textarea
                  value={localNotes[key] ?? ''}
                  onChange={(e) => onNoteChange(key, e.target.value)}
                  placeholder="Add notes…"
                  rows={3}
                  className="w-full text-[13px] px-3 py-2 border border-border rounded-[var(--radius-xs)] bg-bg text-text placeholder:text-text3 resize-y focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export function InterviewPage() {
  const { candidateId } = useParams<{ candidateId: string }>()
  const navigate = useNavigate()

  const { data, loading: candidateLoading } = useCandidates({
    ids: candidateId ? [candidateId] : [],
  })
  const { stateMap, setNotes, loading: stateLoading } = useCandidateState()

  const candidateData = data[0]
  const { candidate, profile } = candidateData ?? {}
  const jobId = candidate?.job_id ?? undefined

  const { questions: sections, loading: questionsLoading } = useInterviewQuestions(jobId)

  const loading = candidateLoading || questionsLoading || stateLoading

  const [localNotes, setLocalNotes] = useState<Record<string, string>>({})
  const [initialized, setInitialized] = useState(false)
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle')

  useEffect(() => {
    if (!loading && !initialized && candidateId) {
      const saved = (stateMap[candidateId]?.notes ?? {}) as Record<string, string>
      setLocalNotes(saved)
      setInitialized(true)
    }
  }, [loading, initialized, candidateId, stateMap])

  const savedNotes = (stateMap[candidateId ?? '']?.notes ?? {}) as Record<string, string>
  const isDirty = initialized && JSON.stringify(localNotes) !== JSON.stringify(savedNotes)

  const handleNoteChange = useCallback((key: string, value: string) => {
    setLocalNotes((prev) => ({ ...prev, [key]: value }))
  }, [])

  const handleSave = useCallback(async () => {
    if (!candidateId || !isDirty) return
    setSaveStatus('saving')
    await setNotes(candidateId, localNotes)
    setSaveStatus('saved')
    setTimeout(() => setSaveStatus('idle'), 1500)
  }, [candidateId, isDirty, localNotes, setNotes])

  const blocker = useBlocker(() => isDirty)

  useEffect(() => {
    if (blocker.state === 'blocked') {
      if (window.confirm('You have unsaved notes. Leave anyway?')) {
        blocker.proceed()
      } else {
        blocker.reset()
      }
    }
  }, [blocker])

  if (loading) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <Spinner className="size-8" />
      </div>
    )
  }

  if (!candidateData || !candidate || !candidateId) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center text-text2">
        Candidate not found.
      </div>
    )
  }

  const jobSections = sections.filter((s) => !s.is_general)
  const generalSections = sections.filter((s) => s.is_general)

  const buttonDisabled = !isDirty || saveStatus === 'saving' || saveStatus === 'saved'
  const buttonLabel =
    saveStatus === 'saving' ? 'Saving…' : saveStatus === 'saved' ? 'Saved ✓' : 'Save notes'

  return (
    <div className="min-h-screen bg-bg">
      <header className="sticky top-0 z-10 bg-surface border-b border-border shadow-[var(--shadow-sm)]">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4 min-w-0">
            <button
              onClick={() => navigate('/schedule')}
              className="text-[13px] text-text2 hover:text-text transition-colors shrink-0"
            >
              ← Schedule
            </button>
            <div className="min-w-0">
              <p className="font-semibold text-[15px] text-text truncate">{candidate.name}</p>
              <div className="flex items-center gap-3 flex-wrap">
                {profile?.title && <span className="text-[12px] text-text2">{profile.title}</span>}
                <span className="text-[12px] text-text3">
                  {formatSalary(
                    candidate.salary_amount,
                    candidate.salary_currency,
                    candidate.salary_period,
                  )}
                </span>
                {candidate.notice && (
                  <span className="text-[12px] text-text3">Notice: {candidate.notice}</span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {isDirty && saveStatus === 'idle' && (
              <span className="text-[12px] text-text3">Unsaved changes</span>
            )}
            <Button size="sm" onClick={handleSave} disabled={buttonDisabled}>
              {buttonLabel}
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-8 flex flex-col gap-6">
        {jobSections.map((section) => (
          <SectionCard
            key={section.id}
            section={section}
            localNotes={localNotes}
            onNoteChange={handleNoteChange}
          />
        ))}

        {generalSections.length > 0 && (
          <>
            {jobSections.length > 0 && (
              <div className="flex items-center gap-3 my-2">
                <div className="flex-1 h-px bg-border" />
                <span className="text-[11px] text-text3 font-medium uppercase tracking-widest">
                  General questions
                </span>
                <div className="flex-1 h-px bg-border" />
              </div>
            )}
            {generalSections.map((section) => (
              <SectionCard
                key={section.id}
                section={section}
                localNotes={localNotes}
                onNoteChange={handleNoteChange}
              />
            ))}
          </>
        )}
      </main>
    </div>
  )
}
```

- [ ] **Step 2: Verify**

```bash
yarn tsc --noEmit
```

Expected: no errors.

---

### Task 7: "Interview" button in `SchedulePage`

**Files:**

- Modify: `src/pages/SchedulePage.tsx`

- [ ] **Step 1: Import `useNavigate`**

`useNavigate` is already available from `react-router-dom`. Add it to the existing import:

```ts
import { useMemo, useState, useCallback } from 'react'
import { useQueryState, parseAsString, parseAsInteger } from 'nuqs'
import { useNavigate, type ColumnDef } from '@tanstack/react-table'
```

Wait — `useNavigate` comes from `react-router-dom`, not `@tanstack/react-table`. Add it to the react-router-dom import:

```ts
import { useNavigate } from 'react-router-dom'
```

- [ ] **Step 2: Instantiate `navigate` in the component**

At the top of `SchedulePage()`, after the existing hooks:

```ts
const navigate = useNavigate()
```

- [ ] **Step 3: Add "Interview" column to `columns`**

Add this as the last entry in the `columns` array (after the `status` column):

```tsx
      {
        id: 'interview',
        header: '',
        size: 100,
        cell: ({ row }) => (
          <button
            onClick={() => navigate(`/interview/${row.original.candidate.id}`)}
            className="text-[12px] font-medium px-2.5 py-1 rounded-[var(--radius-xs)] border border-border bg-surface text-text hover:bg-surface2 transition-colors cursor-pointer whitespace-nowrap"
          >
            Interview
          </button>
        ),
      },
```

- [ ] **Step 4: Add `navigate` to the `columns` dependency array**

`columns` is memoized with `[setConfirmed, handleStatusChange]`. Add `navigate`:

```ts
  ), [setConfirmed, handleStatusChange, navigate])
```

- [ ] **Step 5: Verify**

```bash
yarn tsc --noEmit
yarn dev
```

Open `/schedule`, confirm each row has an "Interview" button. Click one — should navigate to `/interview/<candidateId>`. Confirm the header shows candidate name, salary, notice. Type in a textarea — "Unsaved changes" label should appear. Click "Save notes" — should show "Saving…" then "Saved ✓". Navigate away with unsaved changes — confirm prompt appears.

---

### Task 8: Unit tests (deferred per project convention)

**Files:**

- Create: `src/hooks/__tests__/useInterviewQuestions.test.ts`

- [ ] **Step 1: Write tests for `useInterviewQuestions`**

```ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React from 'react'
import { useInterviewQuestions } from '../useInterviewQuestions'

const generalSection = {
  id: 100,
  position: 100,
  title: 'Background & Motivation',
  duration: '5-10 min',
  goal: 'Understand trajectory',
  color: '#6366f1',
  bg: '#eef2ff',
  questions: ['Q1', 'Q2'],
  is_general: true,
  job_id: null,
}

const pmSection = {
  id: 1,
  position: 1,
  title: 'Product Sense',
  duration: '15 min',
  goal: 'Assess PM skills',
  color: '#f59e0b',
  bg: '#fffbeb',
  questions: ['PM Q1'],
  is_general: false,
  job_id: 2,
}

vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(),
  },
}))

function wrapper({ children }: { children: React.ReactNode }) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return React.createElement(QueryClientProvider, { client }, children)
}

describe('useInterviewQuestions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns all sections ordered by position when no jobId provided', async () => {
    const { supabase } = await import('@/lib/supabase')
    const selectMock = vi.fn().mockReturnValue({
      order: vi.fn().mockResolvedValue({ data: [pmSection, generalSection] }),
    })
    vi.mocked(supabase.from).mockReturnValue({ select: selectMock } as never)

    const { result } = renderHook(() => useInterviewQuestions(), { wrapper })

    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.questions).toHaveLength(2)
    // No OR filter used — select called without or()
    expect(selectMock).toHaveBeenCalledWith('*')
  })

  it('filters by jobId OR is_general when jobId provided', async () => {
    const { supabase } = await import('@/lib/supabase')
    const orMock = vi.fn().mockReturnValue({
      order: vi.fn().mockResolvedValue({ data: [pmSection, generalSection] }),
    })
    const selectMock = vi.fn().mockReturnValue({ or: orMock })
    vi.mocked(supabase.from).mockReturnValue({ select: selectMock } as never)

    const { result } = renderHook(() => useInterviewQuestions(2), { wrapper })

    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(orMock).toHaveBeenCalledWith('job_id.eq.2,is_general.eq.true')
    expect(result.current.questions).toHaveLength(2)
  })

  it('returns empty array on null data', async () => {
    const { supabase } = await import('@/lib/supabase')
    vi.mocked(supabase.from).mockReturnValue({
      select: vi.fn().mockReturnValue({
        order: vi.fn().mockResolvedValue({ data: null }),
      }),
    } as never)

    const { result } = renderHook(() => useInterviewQuestions(), { wrapper })

    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.questions).toEqual([])
  })
})
```

- [ ] **Step 2: Run tests**

```bash
yarn test src/hooks/__tests__/useInterviewQuestions.test.ts
```

Expected: 3 passing tests.

---

## Self-Review

**Spec coverage check:**

| Spec requirement                                                   | Task   |
| ------------------------------------------------------------------ | ------ |
| Drop `hiring_rounds`                                               | Task 1 |
| Add `notes jsonb` to `interview_state`                             | Task 1 |
| Add `is_general`, `job_id` to `interview_questions`                | Task 1 |
| Mark existing questions `job_id = 2`                               | Task 1 |
| Insert 3 general sections                                          | Task 1 |
| `database.types.ts` updates                                        | Task 2 |
| `useInterviewQuestions(jobId?)`                                    | Task 3 |
| `setNotes` in `useCandidateState`                                  | Task 4 |
| `/interview/:candidateId` route (outside Layout, inside AuthGuard) | Task 5 |
| Sticky header (name, title, salary, notice, back button)           | Task 6 |
| Save state indicator (idle/dirty/saving/saved)                     | Task 6 |
| All sections expanded, job-specific first then general             | Task 6 |
| Per-question textarea                                              | Task 6 |
| Note keys `${section.id}-${questionIndex}`                         | Task 6 |
| Local state only until explicit save                               | Task 6 |
| `useBlocker` dirty guard with `window.confirm`                     | Task 6 |
| "Interview" button navigates to `/interview/:id`                   | Task 7 |
| Unit tests for `useInterviewQuestions`                             | Task 8 |
