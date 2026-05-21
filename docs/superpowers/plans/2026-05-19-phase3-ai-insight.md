# Phase 3 — Profile Modal AI Insight Tab Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an "AI Insight" tab to the candidate profile modal that generates a live Claude assessment of the candidate's fit for the role on demand.

**Architecture:** A new `ProfileAIInsight` component handles the generate/display lifecycle. It reads the API key from `localStorage` using the existing `loadApiKey` helper, builds a candidate-specific system prompt, and calls the existing `sendChatMessage` function with a single user message. If no API key is configured, it shows the same "no key" prompt as the AI Assistant tab. The result is displayed in a readable card but NOT persisted to the database. `ProfileModal` gains a new "AI Insight" tab entry pointing to this component.

**Tech Stack:** React 18, TypeScript, existing `sendChatMessage` and `loadApiKey` from `src/lib/chat.ts`, `Button` component, `Spinner` component.

---

## File Map

| File                                          | Action | Responsibility                                   |
| --------------------------------------------- | ------ | ------------------------------------------------ |
| `src/components/profile/ProfileAIInsight.tsx` | Create | Generate + display AI assessment for a candidate |
| `src/components/profile/ProfileModal.tsx`     | Modify | Add "AI Insight" as 7th tab                      |

---

### Task 1: Create `ProfileAIInsight` component

**Files:**

- Create: `src/components/profile/ProfileAIInsight.tsx`

- [ ] **Step 1: Create the component**

```typescript
// src/components/profile/ProfileAIInsight.tsx
import { useState } from 'react'
import { ZapIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { sendChatMessage, loadApiKey } from '@/lib/chat'
import { formatSalary } from '@/lib/salary'
import type { Database } from '@/lib/database.types'

type Candidate = Database['public']['Tables']['candidates']['Row']
type Profile = Database['public']['Tables']['candidate_profiles']['Row']
type Analysis = Database['public']['Tables']['candidate_analysis']['Row']

interface ProfileAIInsightProps {
  candidate: Candidate
  profile: Profile
  analysis: Analysis | null
}

function buildPrompt(
  candidate: Candidate,
  profile: Profile,
  analysis: Analysis | null,
): string {
  const lines: string[] = [
    `Candidate: ${candidate.name}`,
    `Current role: ${profile.title ?? '—'} at ${profile.company ?? '—'}`,
    `Seniority: ${candidate.seniority ?? '—'}`,
    `Salary expectation: ${formatSalary(candidate.salary_amount, candidate.salary_currency, candidate.salary_period)}`,
    `Notice period: ${candidate.notice ?? '—'}`,
    '',
    `Fit score: ${profile.fit_score ?? '—'}% (${profile.fit_label ?? '—'})`,
    `AI/Tech score: ${profile.ai_score ?? '—'}/5`,
    `Fintech score: ${profile.fintech_score ?? '—'}/5`,
    `B2B score: ${profile.b2b_score ?? '—'}/5`,
    `Seniority score: ${profile.seniority_score ?? '—'}/5`,
    '',
    `Summary: ${profile.summary ?? '—'}`,
    `Strengths: ${(profile.strengths ?? []).join(', ') || '—'}`,
    `Watch for: ${profile.watch_for ?? '—'}`,
  ]

  if (analysis) {
    lines.push(
      '',
      `Education: ${analysis.degree ?? '—'} from ${analysis.university ?? '—'} (${analysis.grad_year ?? '—'})`,
      `Masters: ${analysis.masters === 'true' ? 'Yes' : 'No'}`,
      `Total experience: ${analysis.total_exp ?? '—'} years`,
      `PM experience: ${analysis.pm_exp ?? '—'} years`,
      `Domains: ${(analysis.domains ?? []).join(', ') || '—'}`,
      `AI/ML experience: ${analysis.ai_exp ? 'Yes' : 'No'}`,
      `B2B experience: ${analysis.b2b ? 'Yes' : 'No'}`,
      `B2C experience: ${analysis.b2c ? 'Yes' : 'No'}`,
      `Fintech experience: ${analysis.fintech ? 'Yes' : 'No'}`,
      analysis.notable ? `Notable: ${analysis.notable}` : '',
    )
  }

  return lines.filter(Boolean).join('\n')
}

const SYSTEM_PROMPT = `You are a senior hiring advisor for Intella, an AI-powered B2B SaaS company in Egypt.
You are evaluating candidates for a Senior Product Manager role that requires: strong AI/tech product experience,
B2B enterprise background, fintech domain knowledge, and senior-level strategic thinking.

When given a candidate profile, provide a concise assessment covering:
1. Top 2-3 fit signals for this specific role
2. Top 2-3 gaps or risks
3. A clear recommendation: Strong Hire / Worth Interviewing / Borderline / Pass
4. One question to probe in the interview

Be direct and specific. Keep the response under 300 words.`

export function ProfileAIInsight({ candidate, profile, analysis }: ProfileAIInsightProps) {
  const [insight, setInsight] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const apiKey = loadApiKey('anthropic')

  async function generate() {
    if (!apiKey) return
    setLoading(true)
    setError(null)
    try {
      const userMessage = `Please assess this candidate:\n\n${buildPrompt(candidate, profile, analysis)}`
      const result = await sendChatMessage(
        [{ role: 'user', content: userMessage }],
        SYSTEM_PROMPT,
        apiKey,
        'anthropic',
      )
      setInsight(result)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  if (!apiKey) {
    return (
      <div className="p-6">
        <div className="p-4 rounded-xl border border-border bg-muted/40 text-center max-w-md mx-auto">
          <p className="text-[14px] font-medium text-foreground mb-1">No API key configured</p>
          <p className="text-[13px] text-muted-foreground">
            Set your Anthropic API key in the AI Assistant tab to use this feature.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 flex flex-col gap-4">
      <div>
        <p className="text-[13px] text-muted-foreground leading-relaxed">
          Live Claude assessment of {candidate.name.split(' ')[0]}'s fit for the Intella Senior PM
          role, generated from their career data.
        </p>
      </div>

      {!insight && !loading && (
        <Button size="sm" onClick={generate} className="w-fit">
          <ZapIcon className="size-3.5" />
          Generate AI Assessment
        </Button>
      )}

      {loading && (
        <div className="flex items-center gap-3 text-[13px] text-muted-foreground">
          <Spinner className="size-4" />
          Generating assessment…
        </div>
      )}

      {error && (
        <div className="p-3 rounded-lg bg-destructive/8 border border-destructive/25 text-[12.5px] text-destructive">
          {error}
        </div>
      )}

      {insight && (
        <div className="flex flex-col gap-3">
          <div className="bg-muted/40 border border-border rounded-xl p-4 text-[13px] text-foreground leading-relaxed whitespace-pre-wrap">
            {insight}
          </div>
          <Button size="sm" variant="outline" onClick={generate} disabled={loading} className="w-fit">
            <ZapIcon className="size-3.5" />
            Regenerate
          </Button>
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Verify TypeScript**

```bash
yarn tsc --noEmit 2>&1 | grep "ProfileAIInsight"
```

Expected: no errors.

---

### Task 2: Add "AI Insight" tab to `ProfileModal`

**Files:**

- Modify: `src/components/profile/ProfileModal.tsx`

- [ ] **Step 1: Add import and extend TABS**

At the top of `ProfileModal.tsx`, add the import:

```typescript
import { ProfileAIInsight } from './ProfileAIInsight'
```

Find the TABS constant:

```typescript
const TABS = ['Overview', 'Score', 'Career', 'Questions', 'CV', 'History'] as const
```

Replace with:

```typescript
const TABS = ['Overview', 'Score', 'Career', 'Questions', 'CV', 'History', 'AI Insight'] as const
```

- [ ] **Step 2: Add the tab content**

In the content section of `ProfileModal`, find the last `{activeTab === 'History' && ...}` block and add after it:

```tsx
{
  activeTab === 'AI Insight' && (
    <ProfileAIInsight candidate={candidate} profile={profile} analysis={analysis} />
  )
}
```

- [ ] **Step 3: Verify TypeScript**

```bash
yarn tsc --noEmit 2>&1
```

Expected: zero errors.

- [ ] **Step 4: Open the app and verify**

1. Navigate to `http://localhost:5173/cards`
2. Open any candidate profile → confirm "AI Insight" tab appears as the 7th tab
3. If no API key is configured: confirm the "No API key configured" message appears
4. If an API key is set (via AI Assistant tab): click "Generate AI Assessment" and verify a response streams/appears
5. Click "Regenerate" to confirm it re-runs
