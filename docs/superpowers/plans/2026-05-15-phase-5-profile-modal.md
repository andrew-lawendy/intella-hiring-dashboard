# Phase 5: Profile Modal — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the full candidate profile modal with 5 tabs (Overview, Career, Questions, CV, History), the email draft modal, and wire up all "Profile" and "Email" buttons in the Cards tab.

**Architecture:** `ProfileModal` is a full-screen overlay (fixed position) rendered at the `CardsPage` level and controlled by a `selectedCandidateId` state variable. The CV tab fetches a signed URL from Supabase Storage on demand. The History tab reads the `audit_log` table for the selected candidate.

**Tech Stack:** Supabase Storage (signed URLs), Supabase `audit_log` table, Tailwind, shadcn/ui Tabs component

**Prerequisites:** Phase 4 complete.

---

### Task 1: Audit Log Hook

**Files:**
- Create: `src/hooks/useAuditLog.ts`

- [ ] **Step 1: Write failing test**

Create `src/hooks/__tests__/useAuditLog.test.ts`:
```ts
import { describe, it, expect, vi } from 'vitest'
import { formatAuditEntry } from '../useAuditLog'

describe('formatAuditEntry', () => {
  it('formats verdict change', () => {
    const result = formatAuditEntry({ field: 'verdict', old_value: null, new_value: 'strong-yes', changed_by: 'peter@intellaworld.com', created_at: '2026-05-19T10:30:00Z' })
    expect(result).toContain('Verdict')
    expect(result).toContain('strong-yes')
  })

  it('formats shortlisted change', () => {
    const result = formatAuditEntry({ field: 'shortlisted', old_value: 'null', new_value: 'true', changed_by: 'ossama@intellaworld.com', created_at: '2026-05-19T10:30:00Z' })
    expect(result).toContain('Shortlisted')
  })

  it('formats interview_status change', () => {
    const result = formatAuditEntry({ field: 'interview_status', old_value: 'pending', new_value: 'completed', changed_by: 'peter@intellaworld.com', created_at: '2026-05-19T10:30:00Z' })
    expect(result).toContain('Status')
    expect(result).toContain('completed')
  })

  it('truncates email to first part before @', () => {
    const result = formatAuditEntry({ field: 'verdict', old_value: null, new_value: 'yes', changed_by: 'peter@intellaworld.com', created_at: '2026-05-19T10:30:00Z' })
    expect(result).toContain('peter')
    expect(result).not.toContain('@intellaworld.com')
  })
})
```

- [ ] **Step 2: Run to verify failure**
```bash
npm run test:run src/hooks/__tests__/useAuditLog.test.ts
```
Expected: FAIL.

- [ ] **Step 3: Implement useAuditLog**

Create `src/hooks/useAuditLog.ts`:
```ts
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { Database } from '@/lib/database.types'

type AuditEntry = Database['public']['Tables']['audit_log']['Row']

const FIELD_LABELS: Record<string, string> = {
  verdict: 'Verdict',
  shortlisted: 'Shortlisted',
  interview_status: 'Status',
  confirmed: 'Confirmation',
  peter_scores: 'Peter scores',
  ossama_scores: 'Ossama scores',
}

export function formatAuditEntry(
  entry: Pick<AuditEntry, 'field' | 'old_value' | 'new_value' | 'changed_by' | 'created_at'>,
): string {
  const label = FIELD_LABELS[entry.field] ?? entry.field
  const by = entry.changed_by.split('@')[0]
  const val = entry.new_value ?? 'cleared'
  return `${label} set to "${val}" by ${by}`
}

export function useAuditLog(candidateId: string | null) {
  const [entries, setEntries] = useState<AuditEntry[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!candidateId) { setEntries([]); return }
    setLoading(true)
    supabase
      .from('audit_log')
      .select('*')
      .eq('candidate_id', candidateId)
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setEntries(data ?? [])
        setLoading(false)
      })
  }, [candidateId])

  return { entries, loading }
}
```

- [ ] **Step 4: Run tests to verify they pass**
```bash
npm run test:run src/hooks/__tests__/useAuditLog.test.ts
```
Expected: 4 tests pass.

- [ ] **Step 5: Commit**
```bash
git add -A
git commit -m "feat(profile): add audit log hook and format utility"
```

---

### Task 2: Email Draft Utility + Modal

**Files:**
- Create: `src/lib/emailDraft.ts`
- Create: `src/components/profile/EmailDraftModal.tsx`

- [ ] **Step 1: Write failing tests**

Create `src/lib/__tests__/emailDraft.test.ts`:
```ts
import { describe, it, expect } from 'vitest'
import { generateEmailDraft } from '../emailDraft'

describe('generateEmailDraft', () => {
  const candidate = { name: 'Mina Taallap Shawkei', email: 'mina@test.com' }

  it('generates strong-yes email with "next steps" subject', () => {
    const draft = generateEmailDraft(candidate, 'strong-yes', ['fintech', 'payments'])
    expect(draft.subject).toContain('next steps')
    expect(draft.body).toContain('Mina')
    expect(draft.to).toBe('mina@test.com')
  })

  it('generates no email with polite rejection subject', () => {
    const draft = generateEmailDraft(candidate, 'no', [])
    expect(draft.subject).toContain('application')
    expect(draft.body).toContain('Mina')
  })

  it('uses first name only in body', () => {
    const draft = generateEmailDraft(candidate, 'yes', [])
    expect(draft.body).toContain('Dear Mina')
    expect(draft.body).not.toContain('Shawkei')
  })

  it('falls back gracefully for null verdict', () => {
    const draft = generateEmailDraft(candidate, null, [])
    expect(draft.subject).toBeTruthy()
    expect(draft.body).toBeTruthy()
  })
})
```

- [ ] **Step 2: Run to verify failure**
```bash
npm run test:run src/lib/__tests__/emailDraft.test.ts
```
Expected: FAIL.

- [ ] **Step 3: Implement emailDraft**

Create `src/lib/emailDraft.ts`:
```ts
type Verdict = 'strong-yes' | 'yes' | 'maybe' | 'no' | null

interface EmailDraft {
  to: string
  subject: string
  body: string
}

export function generateEmailDraft(
  candidate: { name: string; email: string },
  verdict: Verdict,
  domains: string[],
): EmailDraft {
  const firstName = candidate.name.split(' ')[0]
  const domainStr = domains.slice(0, 2).join(' and ') || 'product management'

  const subjects: Record<NonNullable<Verdict>, string> = {
    'strong-yes': 'Great news — next steps for your application at Intella',
    yes: 'Next steps — Senior PM role at Intella',
    maybe: 'Thank you for interviewing with Intella',
    no: 'Re: Senior PM application — Intella',
  }

  const bodies: Record<NonNullable<Verdict>, string> = {
    'strong-yes': `Dear ${firstName},\n\nThank you for taking the time to interview with us for the Senior Product Manager role. We were genuinely impressed by your background, particularly your experience in ${domainStr}.\n\nWe would like to move forward with you to the next stage. Could you share your availability for a follow-up call this week?\n\nBest regards,\nPeter Ehab\nCPO, Intella`,
    yes: `Dear ${firstName},\n\nThank you for meeting with us for the Senior PM role at Intella. We enjoyed learning about your experience.\n\nWe would like to move forward. Please let us know your availability for a follow-up call.\n\nBest regards,\nPeter Ehab\nCPO, Intella`,
    maybe: `Dear ${firstName},\n\nThank you for taking the time to interview with us. We appreciated the conversation.\n\nWe are completing our interview process and will be in touch shortly.\n\nBest regards,\nPeter Ehab\nCPO, Intella`,
    no: `Dear ${firstName},\n\nThank you for your interest in the Senior PM role at Intella and for taking the time to interview with us.\n\nAfter careful consideration, we have decided to move forward with other candidates at this time. We wish you all the best.\n\nBest regards,\nPeter Ehab\nCPO, Intella`,
  }

  const subject = verdict ? subjects[verdict] : 'Re: Senior PM Interview — Intella'
  const body = verdict
    ? bodies[verdict]
    : `Dear ${firstName},\n\nThank you for interviewing with us.\n\nBest regards,\nPeter Ehab\nCPO, Intella`

  return { to: candidate.email, subject, body }
}
```

- [ ] **Step 4: Run tests to verify they pass**
```bash
npm run test:run src/lib/__tests__/emailDraft.test.ts
```
Expected: 4 tests pass.

- [ ] **Step 5: Build EmailDraftModal**

Create `src/components/profile/EmailDraftModal.tsx`:
```tsx
import { useState } from 'react'
import { generateEmailDraft } from '@/lib/emailDraft'
import type { Database } from '@/lib/database.types'

type Candidate = Database['public']['Tables']['candidates']['Row']
type State = Database['public']['Tables']['interview_state']['Row']

interface EmailDraftModalProps {
  candidate: Candidate
  state: State
  domains: string[]
  onClose: () => void
}

export function EmailDraftModal({ candidate, state, domains, onClose }: EmailDraftModalProps) {
  const draft = generateEmailDraft(
    { name: candidate.name, email: candidate.email },
    state.verdict,
    domains,
  )

  const [to, setTo] = useState(draft.to)
  const [subject, setSubject] = useState(draft.subject)
  const [body, setBody] = useState(draft.body)

  const openInMail = () => {
    const url = `mailto:${encodeURIComponent(to)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
    window.open(url)
    onClose()
  }

  return (
    <div
      className="fixed inset-0 bg-black/60 z-[600] flex items-center justify-center p-5"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-bg rounded-[var(--radius)] w-full max-w-[620px] overflow-hidden shadow-[var(--shadow-lg)]">
        <div className="bg-accent px-5 py-4 flex justify-between items-center">
          <span className="font-semibold text-sm text-bg">Email Draft — {candidate.name}</span>
          <button onClick={onClose} className="text-bg/70 hover:text-bg text-lg bg-transparent border-none cursor-pointer">✕</button>
        </div>
        <div className="p-5 flex flex-col gap-3">
          {[
            { label: 'To', value: to, onChange: setTo, type: 'input' as const },
            { label: 'Subject', value: subject, onChange: setSubject, type: 'input' as const },
          ].map((field) => (
            <div key={field.label}>
              <label className="block text-[11px] font-semibold uppercase text-text3 mb-1">{field.label}</label>
              <input
                value={field.value}
                onChange={(e) => field.onChange(e.target.value)}
                className="w-full px-2.5 py-2 border border-border rounded-[var(--radius-xs)] bg-surface2 text-text font-sans text-xs outline-none focus:border-text"
              />
            </div>
          ))}
          <div>
            <label className="block text-[11px] font-semibold uppercase text-text3 mb-1">Body</label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={8}
              className="w-full px-2.5 py-2 border border-border rounded-[var(--radius-xs)] bg-surface2 text-text font-sans text-xs outline-none focus:border-text resize-y"
            />
          </div>
          <div className="flex gap-2 justify-end">
            <button onClick={onClose} className="px-4 py-2 border border-border rounded-[var(--radius-xs)] text-text2 text-xs font-medium cursor-pointer hover:bg-surface2">
              Cancel
            </button>
            <button onClick={openInMail} className="px-4 py-2 bg-accent text-bg rounded-[var(--radius-xs)] text-xs font-semibold cursor-pointer hover:opacity-85">
              Open in Mail App
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 6: Commit**
```bash
git add -A
git commit -m "feat(profile): add email draft utility and modal"
```

---

### Task 3: Profile Modal (5 Tabs)

**Files:**
- Create: `src/components/profile/ProfileModal.tsx`
- Create: `src/components/profile/ProfileOverview.tsx`
- Create: `src/components/profile/ProfileCareer.tsx`
- Create: `src/components/profile/ProfileQuestions.tsx`
- Create: `src/components/profile/ProfileCV.tsx`
- Create: `src/components/profile/ProfileHistory.tsx`

- [ ] **Step 1: Build ProfileOverview**

Create `src/components/profile/ProfileOverview.tsx`:
```tsx
import type { Database } from '@/lib/database.types'

type Profile = Database['public']['Tables']['candidate_profiles']['Row']
type Analysis = Database['public']['Tables']['candidate_analysis']['Row']

interface ProfileOverviewProps {
  profile: Profile
  analysis: Analysis | null
}

export function ProfileOverview({ profile, analysis }: ProfileOverviewProps) {
  const fitBars = [
    { label: 'AI Experience', value: profile.ai_score ?? 0 },
    { label: 'Fintech', value: profile.fintech_score ?? 0 },
    { label: 'B2B', value: profile.b2b_score ?? 0 },
    { label: 'Seniority', value: profile.seniority_score ?? 0 },
  ]

  return (
    <div className="p-6 overflow-y-auto max-h-[calc(80vh-120px)]">
      {/* Summary */}
      <div className="mb-5">
        <div className="flex items-center gap-3 mb-3">
          <span className="text-[28px] font-medium tracking-tight text-text">{profile.fit_score}%</span>
          <span className="text-sm font-medium px-2 py-0.5 rounded-full" style={{ background: `color-mix(in srgb, ${profile.fit_color} 15%, transparent)`, color: profile.fit_color ?? 'var(--text2)' }}>
            {profile.fit_label}
          </span>
        </div>
        <p className="text-[13px] text-text2 leading-relaxed">{profile.summary}</p>
      </div>

      {/* Fit score bars */}
      <div className="mb-5">
        <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-text3 mb-3">Fit Breakdown</p>
        {fitBars.map((bar) => (
          <div key={bar.label} className="flex items-center gap-3 mb-2 text-xs">
            <span className="text-text2 w-28 flex-shrink-0">{bar.label}</span>
            <div className="flex-1 h-2 bg-surface2 rounded-full overflow-hidden border border-border">
              <div className="h-full rounded-full bg-brand transition-[width] duration-500" style={{ width: `${(bar.value / 5) * 100}%` }} />
            </div>
            <span className="text-text3 font-mono text-[11px]">{bar.value}/5</span>
          </div>
        ))}
      </div>

      {/* Strengths */}
      <div className="mb-5">
        <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-text3 mb-2">Strengths</p>
        {(profile.strengths ?? []).map((s, i) => (
          <div key={i} className="text-[12.5px] text-green mb-1.5">✓ {s}</div>
        ))}
      </div>

      {/* Weaknesses */}
      <div className="mb-5">
        <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-text3 mb-2">Weaknesses</p>
        {(profile.weaknesses ?? []).map((w, i) => (
          <div key={i} className="text-[12.5px] text-red mb-1.5">⚠ {w}</div>
        ))}
      </div>

      {/* Watch for */}
      {profile.watch_for && (
        <div className="p-3 bg-amber-bg border border-amber-line rounded-[var(--radius-xs)]">
          <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-amber mb-1">Watch For</p>
          <p className="text-[12.5px] text-text2">{profile.watch_for}</p>
        </div>
      )}

      {/* Analysis extras */}
      {analysis && (
        <div className="mt-5 grid grid-cols-2 gap-2 text-xs">
          {[
            { label: 'University', value: analysis.university },
            { label: 'Degree', value: analysis.degree },
            { label: 'Total Exp', value: `${analysis.total_exp} yrs` },
            { label: 'PM Exp', value: `${analysis.pm_exp} yrs` },
            { label: 'Current Role', value: analysis.current_role },
            { label: 'Company', value: analysis.current_company },
          ].map((row) => (
            <div key={row.label} className="bg-surface2 rounded-[var(--radius-xs)] p-2">
              <p className="text-[9px] font-semibold uppercase tracking-wide text-text3 mb-0.5">{row.label}</p>
              <p className="text-text font-medium">{row.value ?? '—'}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Build ProfileCareer**

Create `src/components/profile/ProfileCareer.tsx`:
```tsx
interface CareerEntry { year: string; role: string; company: string; desc: string }
interface ProfileCareerProps { career: CareerEntry[] }

export function ProfileCareer({ career }: ProfileCareerProps) {
  return (
    <div className="p-6 overflow-y-auto max-h-[calc(80vh-120px)]">
      <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-text3 mb-4">Career Timeline</p>
      <div className="relative pl-5 border-l border-border">
        {career.map((entry, i) => (
          <div key={i} className="mb-5 relative">
            <div className="absolute -left-[21px] w-2.5 h-2.5 rounded-full bg-brand border-2 border-surface" />
            <p className="text-[11px] font-mono text-text3 mb-1">{entry.year}</p>
            <p className="font-semibold text-sm text-text">{entry.role}</p>
            <p className="text-[12px] text-text2 mb-1">{entry.company}</p>
            <p className="text-[12px] text-text2 leading-relaxed">{entry.desc}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Build ProfileQuestions**

Create `src/components/profile/ProfileQuestions.tsx`:
```tsx
interface ProfileQuestionsProps { questions: string[] }

export function ProfileQuestions({ questions }: ProfileQuestionsProps) {
  return (
    <div className="p-6 overflow-y-auto max-h-[calc(80vh-120px)]">
      <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-text3 mb-4">Custom Interview Questions</p>
      {questions.map((q, i) => (
        <div key={i} className="mb-3 bg-blue-bg border-l-[3px] border-blue px-4 py-3 rounded-r-[var(--radius-xs)]">
          <span className="text-[11px] font-semibold text-blue mr-2">Q{i + 1}.</span>
          <span className="text-[12.5px] text-text leading-relaxed">{q}</span>
        </div>
      ))}
    </div>
  )
}
```

- [ ] **Step 4: Build ProfileCV**

Create `src/components/profile/ProfileCV.tsx`:
```tsx
import { useState } from 'react'
import { supabase } from '@/lib/supabase'

interface ProfileCVProps {
  candidateId: string
  photoUrl: string | null
  onPhotoSave: (url: string | null) => void
}

export function ProfileCV({ candidateId, photoUrl, onPhotoSave }: ProfileCVProps) {
  const [cvUrl, setCvUrl] = useState<string | null>(null)
  const [loadingCv, setLoadingCv] = useState(false)
  const [photoInput, setPhotoInput] = useState(photoUrl ?? '')
  const [photoSaved, setPhotoSaved] = useState(false)

  const openCV = async () => {
    setLoadingCv(true)
    const { data } = await supabase.storage
      .from('candidate-cvs')
      .createSignedUrl(`${candidateId}.pdf`, 3600)
    setLoadingCv(false)
    if (data?.signedUrl) {
      setCvUrl(data.signedUrl)
      window.open(data.signedUrl, '_blank')
    }
  }

  const savePhoto = () => {
    onPhotoSave(photoInput.trim() || null)
    setPhotoSaved(true)
    setTimeout(() => setPhotoSaved(false), 2000)
  }

  return (
    <div className="p-6 overflow-y-auto max-h-[calc(80vh-120px)] flex flex-col gap-5">
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-text3 mb-3">CV</p>
        <button
          onClick={openCV}
          disabled={loadingCv}
          className="px-4 py-2 bg-surface border border-border rounded-[var(--radius-xs)] text-xs font-medium text-text cursor-pointer hover:bg-text hover:text-bg hover:border-text transition-all disabled:opacity-50"
        >
          {loadingCv ? 'Loading...' : 'Open CV (PDF)'}
        </button>
        {cvUrl && <p className="text-[11px] text-text3 mt-2">CV opened in new tab. Link expires in 1 hour.</p>}
      </div>

      <div>
        <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-text3 mb-3">Photo URL</p>
        <input
          value={photoInput}
          onChange={(e) => setPhotoInput(e.target.value)}
          placeholder="https://..."
          className="w-full px-2.5 py-2 border border-border rounded-[var(--radius-xs)] bg-surface2 text-text text-xs font-sans outline-none focus:border-text"
        />
        <button
          onClick={savePhoto}
          className="mt-2 px-3 py-1.5 bg-text text-bg rounded-[var(--radius-xs)] text-[11px] font-medium cursor-pointer hover:opacity-85 border-none"
        >
          Save Photo
        </button>
        {photoSaved && <span className="ml-2 text-[10.5px] text-green font-medium">Saved</span>}
      </div>
    </div>
  )
}
```

- [ ] **Step 5: Build ProfileHistory**

Create `src/components/profile/ProfileHistory.tsx`:
```tsx
import { useAuditLog, formatAuditEntry } from '@/hooks/useAuditLog'

interface ProfileHistoryProps { candidateId: string }

export function ProfileHistory({ candidateId }: ProfileHistoryProps) {
  const { entries, loading } = useAuditLog(candidateId)

  if (loading) {
    return <div className="p-6 text-text3 text-sm">Loading history...</div>
  }

  if (!entries.length) {
    return <div className="p-6 text-text3 text-sm">No changes recorded yet.</div>
  }

  return (
    <div className="p-6 overflow-y-auto max-h-[calc(80vh-120px)]">
      <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-text3 mb-4">Decision History</p>
      <div className="flex flex-col gap-2">
        {entries.map((entry) => (
          <div key={entry.id} className="flex items-start gap-3 text-xs py-2.5 border-b border-border last:border-b-0">
            <div className="w-1.5 h-1.5 rounded-full bg-brand mt-1.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-text">{formatAuditEntry(entry)}</p>
              <p className="text-text3 mt-0.5 font-mono text-[10px]">
                {new Date(entry.created_at).toLocaleString()}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 6: Build the ProfileModal**

Create `src/components/profile/ProfileModal.tsx`:
```tsx
import { useState } from 'react'
import { ProfileOverview } from './ProfileOverview'
import { ProfileCareer } from './ProfileCareer'
import { ProfileQuestions } from './ProfileQuestions'
import { ProfileCV } from './ProfileCV'
import { ProfileHistory } from './ProfileHistory'
import type { CandidateWithDetails } from '@/hooks/useCandidates'
import type { Database } from '@/lib/database.types'

type State = Database['public']['Tables']['interview_state']['Row']

interface ProfileModalProps {
  data: CandidateWithDetails
  state: State
  onClose: () => void
  onPhotoSave: (url: string | null) => void
}

const TABS = ['Overview', 'Career', 'Questions', 'CV', 'History'] as const
type Tab = (typeof TABS)[number]

export function ProfileModal({ data, state, onClose, onPhotoSave }: ProfileModalProps) {
  const [activeTab, setActiveTab] = useState<Tab>('Overview')
  const { candidate, profile, analysis } = data

  if (!profile) return null

  const career = (profile.career as { year: string; role: string; company: string; desc: string }[]) ?? []

  return (
    <div
      className="fixed inset-0 bg-black/55 backdrop-blur-[8px] z-[500] flex items-start justify-center py-8 px-8 overflow-y-auto"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="relative bg-surface rounded-[16px] w-full max-w-[900px] my-auto overflow-hidden shadow-[var(--shadow-lg)] border border-border">
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-4 right-5 w-8 h-8 rounded-full bg-surface border border-border flex items-center justify-center text-text2 hover:bg-text hover:text-bg hover:border-text cursor-pointer z-10 transition-all text-lg shadow-[var(--shadow-sm)]"
        >
          ✕
        </button>

        {/* Header */}
        <div className="px-6 pt-6 pb-0 border-b border-border">
          <div className="flex items-start gap-4 mb-4">
            <div>
              <h2 className="text-[22px] font-semibold tracking-tight text-text">{candidate.name}</h2>
              <p className="text-text2 text-sm mt-0.5">{profile.title} · {profile.company}</p>
              <p className="text-text3 text-xs mt-0.5">{candidate.email}</p>
            </div>
          </div>

          {/* Tab buttons */}
          <div className="flex gap-0 -mb-px">
            {TABS.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={[
                  'px-4 py-2.5 text-[13px] font-medium font-sans border-b-[1.5px] -mb-px transition-all duration-150 cursor-pointer bg-transparent border-l-0 border-r-0 border-t-0',
                  activeTab === tab
                    ? 'text-text border-b-text font-semibold'
                    : 'text-text2 border-b-transparent hover:text-text',
                ].join(' ')}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Tab content */}
        {activeTab === 'Overview' && <ProfileOverview profile={profile} analysis={analysis} />}
        {activeTab === 'Career' && <ProfileCareer career={career} />}
        {activeTab === 'Questions' && <ProfileQuestions questions={profile.custom_questions ?? []} />}
        {activeTab === 'CV' && (
          <ProfileCV
            candidateId={candidate.id}
            photoUrl={state.photo_url}
            onPhotoSave={onPhotoSave}
          />
        )}
        {activeTab === 'History' && <ProfileHistory candidateId={candidate.id} />}
      </div>
    </div>
  )
}
```

- [ ] **Step 7: Wire ProfileModal and EmailDraftModal into CardsPage**

Modify `src/pages/CardsPage.tsx` — add state and modal rendering:

At the top of the component, add:
```tsx
const [profileId, setProfileId] = useState<string | null>(null)
const [emailId, setEmailId] = useState<string | null>(null)

const profileData = profileId ? data.find((d) => d.candidate.id === profileId) : null
const emailData = emailId ? data.find((d) => d.candidate.id === emailId) : null
```

Update `onOpenProfile` callbacks to `() => setProfileId(candidate.id)`.
Update `onEmailDraft` callbacks to `() => setEmailId(candidate.id)`.

At the bottom of the JSX, before the closing `</div>`, add:
```tsx
{profileData && stateMap[profileData.candidate.id] && (
  <ProfileModal
    data={profileData}
    state={stateMap[profileData.candidate.id]}
    onClose={() => setProfileId(null)}
    onPhotoSave={(url) => updateState(profileData.candidate.id, { photo_url: url })}
  />
)}

{emailData && stateMap[emailData.candidate.id] && (
  <EmailDraftModal
    candidate={emailData.candidate}
    state={stateMap[emailData.candidate.id]}
    domains={(emailData.analysis?.domains ?? []) as string[]}
    onClose={() => setEmailId(null)}
  />
)}
```

Import `ProfileModal` and `EmailDraftModal` at the top.

- [ ] **Step 8: Verify in browser**
```bash
npm run dev
```
- Click "Profile" on any candidate card → full modal opens with 5 tabs
- Overview shows fit score, strengths, weaknesses, watch-for
- Career shows timeline
- Questions shows custom questions
- CV tab has "Open CV" button → opens PDF in new tab
- History tab shows audit log (empty initially, entries appear after making changes)
- Click "Email" on a card → email draft modal with correct pre-filled content based on verdict

Kill the server.

- [ ] **Step 9: Run all tests**
```bash
npm run test:run
```
Expected: All tests pass.

- [ ] **Step 10: Commit**
```bash
git add -A
git commit -m "feat(profile): complete profile modal with 5 tabs and email draft"
```

---

**Phase 5 complete.** Profile modal and email drafting are fully functional. Proceed to Phase 6: Secondary Tabs.
