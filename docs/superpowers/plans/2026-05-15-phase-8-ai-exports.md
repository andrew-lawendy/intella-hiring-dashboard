# Phase 8: AI Assistant & Exports — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the AI Assistant tab (chat interface with API key management and async debrief summary), the Netlify Function Claude proxy, and all export utilities (Excel, Decision Report PDF, Print Brief Card, print stylesheet).

**Architecture:** The Netlify Function at `/api/claude/v1/messages` proxies requests to the Anthropic API, forwarding the user-supplied `x-api-key` header from the request. The chat interface builds a rich system prompt from all candidate data at message time. Exports are client-side: Excel uses the `xlsx` library; PDF and print briefs open a new window with print-optimized HTML.

**Tech Stack:** Netlify Functions, Claude API (claude-sonnet-4-5), `xlsx` library, `@anthropic-ai/sdk` types

**Prerequisites:** Phases 1–7 complete.

---

### Task 1: Netlify Function — Claude Proxy

**Files:**
- Create: `netlify/functions/claude.ts`

- [ ] **Step 1: Install Netlify Functions types**
```bash
npm install --save-dev @netlify/functions
```

- [ ] **Step 2: Write the Claude proxy function**

Create `netlify/functions/claude.ts`:
```ts
import type { Handler } from '@netlify/functions'

const ANTHROPIC_URL = 'https://api.anthropic.com/v1/messages'

export const handler: Handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' }
  }

  const apiKey = event.headers['x-api-key']
  if (!apiKey) {
    return {
      statusCode: 401,
      body: JSON.stringify({ error: 'Missing x-api-key header' }),
    }
  }

  try {
    const response = await fetch(ANTHROPIC_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: event.body ?? '',
    })

    const data = await response.text()

    return {
      statusCode: response.status,
      headers: { 'Content-Type': 'application/json' },
      body: data,
    }
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Proxy request failed', detail: String(err) }),
    }
  }
}
```

- [ ] **Step 3: Add Netlify function routing in netlify.toml**

Verify `netlify.toml` has (add if missing):
```toml
[[redirects]]
  from = "/api/claude/*"
  to = "/.netlify/functions/claude"
  status = 200
```

- [ ] **Step 4: Commit**
```bash
git add -A
git commit -m "feat(chat): add netlify function claude proxy"
```

---

### Task 2: Chat Utilities + System Prompt

**Files:**
- Create: `src/lib/chat.ts`
- Create: `src/lib/systemPrompt.ts`

- [ ] **Step 1: Write failing tests for chat utilities**

Create `src/lib/__tests__/chat.test.ts`:
```ts
import { describe, it, expect } from 'vitest'
import { maskApiKey, trimChatHistory, isValidApiKey } from '../chat'

describe('maskApiKey', () => {
  it('masks all but first 12 chars', () => {
    expect(maskApiKey('sk-ant-api03-abcdef')).toBe('sk-ant-api03' + '••••••')
  })

  it('returns empty string for null', () => {
    expect(maskApiKey(null)).toBe('')
  })
})

describe('isValidApiKey', () => {
  it('returns true for keys starting with sk-ant', () => {
    expect(isValidApiKey('sk-ant-api03-abc')).toBe(true)
  })

  it('returns false for keys not starting with sk-ant', () => {
    expect(isValidApiKey('sk-proj-abc')).toBe(false)
    expect(isValidApiKey('')).toBe(false)
  })
})

describe('trimChatHistory', () => {
  it('caps history at 20 messages', () => {
    const history = Array.from({ length: 25 }, (_, i) => ({ role: 'user' as const, content: `msg ${i}` }))
    expect(trimChatHistory(history)).toHaveLength(20)
  })

  it('keeps the most recent messages', () => {
    const history = Array.from({ length: 25 }, (_, i) => ({ role: 'user' as const, content: `msg ${i}` }))
    const trimmed = trimChatHistory(history)
    expect(trimmed[trimmed.length - 1].content).toBe('msg 24')
  })

  it('returns unchanged if under 20 messages', () => {
    const history = [{ role: 'user' as const, content: 'hi' }]
    expect(trimChatHistory(history)).toHaveLength(1)
  })
})
```

- [ ] **Step 2: Run to verify failure**
```bash
npm run test:run src/lib/__tests__/chat.test.ts
```
Expected: FAIL.

- [ ] **Step 3: Implement chat utilities**

Create `src/lib/chat.ts`:
```ts
export type ChatMessage = { role: 'user' | 'assistant'; content: string }

const API_KEY_STORAGE = 'intella_api_key'
const MAX_HISTORY = 20

export function loadApiKey(): string | null {
  try { return localStorage.getItem(API_KEY_STORAGE) } catch { return null }
}

export function saveApiKey(key: string): void {
  try { localStorage.setItem(API_KEY_STORAGE, key) } catch { /* noop */ }
}

export function clearApiKey(): void {
  try { localStorage.removeItem(API_KEY_STORAGE) } catch { /* noop */ }
}

export function maskApiKey(key: string | null): string {
  if (!key) return ''
  return key.substring(0, 12) + '••••••'
}

export function isValidApiKey(key: string): boolean {
  return key.startsWith('sk-ant')
}

export function trimChatHistory(history: ChatMessage[]): ChatMessage[] {
  return history.slice(-MAX_HISTORY)
}

export function getApiUrl(): string {
  if (typeof window !== 'undefined' &&
    (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
    return 'http://localhost:8888/.netlify/functions/claude'
  }
  return '/api/claude/v1/messages'
}

export async function sendChatMessage(
  messages: ChatMessage[],
  systemPrompt: string,
  apiKey: string,
): Promise<string> {
  const url = getApiUrl()
  const isLocal = url.includes('localhost')

  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (!isLocal) headers['x-api-key'] = apiKey

  const response = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      model: 'claude-sonnet-4-5',
      max_tokens: 1000,
      system: systemPrompt,
      messages,
    }),
  })

  if (!response.ok) {
    const err = await response.text()
    throw new Error(`API error ${response.status}: ${err}`)
  }

  const data = await response.json()
  return data.content?.[0]?.text ?? ''
}
```

- [ ] **Step 4: Run tests to verify they pass**
```bash
npm run test:run src/lib/__tests__/chat.test.ts
```
Expected: All tests pass.

- [ ] **Step 5: Implement system prompt builder**

Create `src/lib/systemPrompt.ts`:
```ts
import type { CandidateWithDetails } from '@/hooks/useCandidates'
import type { StateMap } from '@/hooks/useCandidateState'
import { totalScore, maxScore } from './scoring'
import type { Scores } from './scoring'

export function buildSystemPrompt(
  candidates: CandidateWithDetails[],
  stateMap: StateMap,
): string {
  const max = maxScore()
  const candidateSummaries = candidates
    .map(({ candidate, profile, analysis }) => {
      const state = stateMap[candidate.id]
      const score = state
        ? totalScore(state.peter_scores as Scores, state.ossama_scores as Scores)
        : 0
      return [
        `**${candidate.name}** (${candidate.id})`,
        `- Slot: ${candidate.slot} | Type: ${candidate.type} | Salary: ${candidate.salary} | Notice: ${candidate.notice}`,
        profile ? `- Title: ${profile.title} at ${profile.company} | Fit: ${profile.fit_score}% (${profile.fit_label})` : '',
        profile ? `- AI Score: ${profile.ai_score}/5 | B2B: ${profile.b2b_score}/5 | Fintech: ${profile.fintech_score}/5` : '',
        analysis ? `- Exp: ${analysis.total_exp}y total, ${analysis.pm_exp}y PM | AI exp: ${analysis.ai_exp} | Domains: ${(analysis.domains ?? []).join(', ')}` : '',
        state ? `- Combined score: ${score}/${max} | Status: ${state.interview_status} | Verdict: ${state.verdict ?? 'none'}` : '',
        state?.peter_comment ? `- Peter's notes: ${state.peter_comment}` : '',
        state?.ossama_comment ? `- Ossama's notes: ${state.ossama_comment}` : '',
      ].filter(Boolean).join('\n')
    })
    .join('\n\n')

  return `You are an AI assistant helping the Intella team evaluate candidates for a Senior Product Manager role.
The company is Intella, building Ziila — an AI agent platform for bank call centers.
Today is May 2026. The hiring round covers 20 candidates interviewing May 17–21.

Key requirements for the role:
- B2B enterprise experience (banking clients preferred)
- AI/LLM product experience
- 5+ years PM experience
- Strong stakeholder management

Here is the current state of all candidates:

${candidateSummaries}

Answer questions about the candidates, help compare them, suggest talking points for the debrief, or generate insights about the hiring round. Be direct and specific.`
}

export function buildDebriefPrompt(
  candidates: CandidateWithDetails[],
  stateMap: StateMap,
): string {
  const completedCandidates = candidates.filter(
    ({ candidate }) => stateMap[candidate.id]?.interview_status === 'completed',
  )

  const summaries = buildSystemPrompt(completedCandidates, stateMap)

  return `Based on the interview data below, generate a structured debrief summary for the Intella hiring team.

Format your response with these sections:
1. **Top Candidates** — rank the top 3-5 by combined score and explain why
2. **Consensus vs. Disagreement** — where Peter and Ossama agree/disagree on verdicts
3. **Key Trade-offs** — e.g., high AI experience but low seniority; strong B2B but no fintech
4. **Recommendation** — who to advance to next stage and why
5. **Suggested Debrief Talking Points** — 3-5 questions to discuss as a team

${summaries}`
}
```

- [ ] **Step 6: Commit**
```bash
git add -A
git commit -m "feat(chat): add chat utilities and system prompt builder"
```

---

### Task 3: AI Assistant Tab (Chat UI)

**Files:**
- Create: `src/components/chat/ApiKeyBanner.tsx`
- Create: `src/components/chat/ChatInterface.tsx`
- Create: `src/components/chat/DebriefSummary.tsx`
- Modify: `src/pages/ChatPage.tsx`

- [ ] **Step 1: Build ApiKeyBanner**

Create `src/components/chat/ApiKeyBanner.tsx`:
```tsx
import { useState, useEffect } from 'react'
import { loadApiKey, saveApiKey, clearApiKey, maskApiKey, isValidApiKey } from '@/lib/chat'

interface ApiKeyBannerProps {
  onKeyChange: (key: string | null) => void
}

export function ApiKeyBanner({ onKeyChange }: ApiKeyBannerProps) {
  const [input, setInput] = useState('')
  const [active, setActive] = useState(false)

  useEffect(() => {
    const key = loadApiKey()
    if (key) { setActive(true); setInput(maskApiKey(key)); onKeyChange(key) }
  }, [onKeyChange])

  const handleSave = () => {
    if (input.includes('•')) return // masked — unchanged
    if (!isValidApiKey(input)) { alert('Enter a valid Anthropic API key (starts with sk-ant-)'); return }
    saveApiKey(input)
    setActive(true)
    onKeyChange(input)
    setInput(maskApiKey(input))
  }

  const handleClear = () => {
    clearApiKey()
    setActive(false)
    setInput('')
    onKeyChange(null)
  }

  return (
    <div
      className="rounded-[var(--radius)] border p-4 mb-5 flex items-center gap-3 flex-wrap"
      style={{
        background: active ? 'var(--green-bg)' : 'var(--amber-bg)',
        borderColor: active ? 'var(--green)' : 'var(--amber)',
      }}
    >
      <div className="flex-1">
        <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-text3 mb-1.5">
          Anthropic API Key {active && <span className="text-green ml-1">● Active</span>}
        </p>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="sk-ant-..."
          className="w-full max-w-xs px-2.5 py-1.5 border border-border rounded-[var(--radius-xs)] bg-surface text-text font-mono text-xs outline-none focus:border-text"
        />
      </div>
      <div className="flex gap-1.5">
        <button onClick={handleSave} className="text-[11px] font-medium px-2.5 py-1.5 bg-text text-bg rounded-[var(--radius-xs)] border-none cursor-pointer hover:opacity-85">
          Save
        </button>
        {active && (
          <button onClick={handleClear} className="text-[11px] font-medium px-2.5 py-1.5 bg-surface border border-border text-text2 rounded-[var(--radius-xs)] cursor-pointer hover:bg-red-bg hover:text-red hover:border-red-line transition-all">
            Clear
          </button>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Build ChatInterface**

Create `src/components/chat/ChatInterface.tsx`:
```tsx
import { useState, useRef, useEffect } from 'react'
import { sendChatMessage, trimChatHistory } from '@/lib/chat'
import type { ChatMessage } from '@/lib/chat'

interface ChatInterfaceProps {
  systemPrompt: string
  apiKey: string | null
}

export function ChatInterface({ systemPrompt, apiKey }: ChatInterfaceProps) {
  const [history, setHistory] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [history, loading])

  const send = async () => {
    if (!input.trim() || loading) return
    if (!apiKey) { setError('Enter your Anthropic API key above first.'); return }

    const userMsg: ChatMessage = { role: 'user', content: input.trim() }
    const newHistory = trimChatHistory([...history, userMsg])
    setHistory(newHistory)
    setInput('')
    setLoading(true)
    setError(null)

    try {
      const reply = await sendChatMessage(newHistory, systemPrompt, apiKey)
      setHistory((prev) => trimChatHistory([...prev, { role: 'assistant', content: reply }]))
    } catch (err) {
      setError(String(err))
      setHistory((prev) => prev.slice(0, -1)) // remove the user message on error
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Messages */}
      <div className="bg-surface border border-border rounded-[var(--radius)] p-4 min-h-[300px] max-h-[500px] overflow-y-auto flex flex-col gap-3">
        {!history.length && (
          <p className="text-text3 text-[13px] text-center my-auto">
            Ask anything about the candidates — compare them, get a ranking summary, or ask for debrief talking points.
          </p>
        )}
        {history.map((msg, i) => (
          <div
            key={i}
            className={`max-w-[80%] rounded-[14px] px-4 py-3 text-[13.5px] leading-relaxed shadow-[var(--shadow-sm)] ${
              msg.role === 'user'
                ? 'bg-text text-bg self-end rounded-tr-[4px]'
                : 'bg-surface border border-border self-start rounded-tl-[4px] text-text whitespace-pre-wrap'
            }`}
          >
            {msg.content}
          </div>
        ))}
        {loading && (
          <div className="bg-surface2 border border-dashed border-border rounded-[14px] px-4 py-3 text-[12.5px] text-text3 italic self-start max-w-[80%]">
            Thinking…
          </div>
        )}
        {error && (
          <div className="bg-red-bg border border-red-line rounded-[var(--radius-xs)] px-3 py-2 text-red text-[12px]">
            Error: {error}
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && send()}
          placeholder="Ask about candidates..."
          className="flex-1 px-4 py-2.5 bg-surface border border-border rounded-[var(--radius-sm)] text-[13px] font-sans text-text outline-none focus:border-text transition-colors placeholder:text-text3"
        />
        <button
          onClick={send}
          disabled={loading || !input.trim()}
          className="px-4 py-2.5 bg-text text-bg rounded-[var(--radius-sm)] text-[12px] font-medium cursor-pointer hover:opacity-85 disabled:opacity-50 transition-opacity border-none"
        >
          Send
        </button>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Build DebriefSummary**

Create `src/components/chat/DebriefSummary.tsx`:
```tsx
import { useState } from 'react'
import { sendChatMessage } from '@/lib/chat'
import { buildDebriefPrompt } from '@/lib/systemPrompt'
import type { CandidateWithDetails } from '@/hooks/useCandidates'
import type { StateMap } from '@/hooks/useCandidateState'

interface DebriefSummaryProps {
  candidates: CandidateWithDetails[]
  stateMap: StateMap
  apiKey: string | null
}

export function DebriefSummary({ candidates, stateMap, apiKey }: DebriefSummaryProps) {
  const [summary, setSummary] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const completedCount = candidates.filter(
    ({ candidate }) => stateMap[candidate.id]?.interview_status === 'completed',
  ).length

  const generate = async () => {
    if (!apiKey) { setError('Enter your Anthropic API key first.'); return }
    setLoading(true)
    setError(null)
    try {
      const prompt = buildDebriefPrompt(candidates, stateMap)
      const result = await sendChatMessage(
        [{ role: 'user', content: 'Generate the debrief summary.' }],
        prompt,
        apiKey,
      )
      setSummary(result)
    } catch (err) {
      setError(String(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-surface border border-border rounded-[var(--radius)] overflow-hidden shadow-[var(--shadow-sm)]">
      <div className="px-5 py-4 border-b border-border flex items-center justify-between">
        <div>
          <p className="font-semibold text-[14px] text-text">Team Debrief Summary</p>
          <p className="text-[12px] text-text2 mt-0.5">
            AI-generated summary of {completedCount} completed interviews
          </p>
        </div>
        <button
          onClick={generate}
          disabled={loading || completedCount === 0}
          className="px-4 py-2 bg-brand-soft text-brand border border-[color-mix(in_srgb,var(--brand)_25%,transparent)] rounded-[var(--radius-sm)] text-[12px] font-medium cursor-pointer hover:bg-brand hover:text-white hover:border-brand transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Generating…' : 'Generate Debrief'}
        </button>
      </div>

      {error && (
        <div className="px-5 py-3 bg-red-bg border-b border-red-line text-red text-[12px]">
          Error: {error}
        </div>
      )}

      {summary && (
        <div className="px-5 py-4">
          <div className="text-[13px] text-text leading-relaxed whitespace-pre-wrap font-sans">
            {summary}
          </div>
          <button
            onClick={() => {
              const w = window.open('', '_blank')
              if (w) {
                w.document.write(`<html><head><title>Debrief Summary</title><style>body{font-family:system-ui,sans-serif;max-width:800px;margin:40px auto;padding:20px;color:#1a1816;line-height:1.6}h1,h2,h3{margin-top:24px}pre{white-space:pre-wrap}</style></head><body><h1>Intella Hiring Round — Debrief Summary</h1><pre>${summary}</pre></body></html>`)
                w.document.close()
                setTimeout(() => w.print(), 300)
              }
            }}
            className="mt-4 text-[11px] font-medium px-3 py-1.5 border border-border rounded-[var(--radius-xs)] text-text2 hover:bg-text hover:text-bg transition-all cursor-pointer"
          >
            Print / Export
          </button>
        </div>
      )}

      {!summary && !loading && completedCount === 0 && (
        <div className="px-5 py-6 text-center text-text3 text-[13px]">
          No completed interviews yet. Mark interviews as "Done" to generate a debrief.
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 4: Build the full ChatPage**

Replace `src/pages/ChatPage.tsx`:
```tsx
import { useState } from 'react'
import { ApiKeyBanner } from '@/components/chat/ApiKeyBanner'
import { ChatInterface } from '@/components/chat/ChatInterface'
import { DebriefSummary } from '@/components/chat/DebriefSummary'
import { useCandidates } from '@/hooks/useCandidates'
import { useCandidateState } from '@/hooks/useCandidateState'
import { buildSystemPrompt } from '@/lib/systemPrompt'

export function ChatPage() {
  const [apiKey, setApiKey] = useState<string | null>(null)
  const { data } = useCandidates()
  const { stateMap } = useCandidateState()

  const systemPrompt = buildSystemPrompt(data, stateMap)

  return (
    <div>
      <h1 className="text-[30px] font-medium tracking-[-0.025em] mb-1 text-text">AI Assistant</h1>
      <p className="text-text2 text-[13.5px] mb-6">
        Powered by Claude with full context of all 20 candidates. Works on hosted URL.
      </p>

      <ApiKeyBanner onKeyChange={setApiKey} />

      <div className="grid gap-5">
        <DebriefSummary candidates={data} stateMap={stateMap} apiKey={apiKey} />
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-text3 mb-3">Ask Anything</p>
          <ChatInterface systemPrompt={systemPrompt} apiKey={apiKey} />
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 5: Commit**
```bash
git add -A
git commit -m "feat(chat): complete ai assistant tab with debrief summary"
```

---

### Task 4: Export Utilities

**Files:**
- Create: `src/lib/exports.ts`
- Modify: `src/styles/globals.css` (add print stylesheet)
- Modify: `src/components/layout/Header.tsx` (wire up export buttons)

- [ ] **Step 1: Install xlsx**
```bash
npm install xlsx
```

- [ ] **Step 2: Implement export utilities (including Print Brief Card)**

Create `src/lib/exports.ts`:
```ts
import * as XLSX from 'xlsx'
import type { CandidateWithDetails } from '@/hooks/useCandidates'
import type { StateMap } from '@/hooks/useCandidateState'
import { totalScore, maxScore } from './scoring'
import type { Scores } from './scoring'

export function exportToExcel(candidates: CandidateWithDetails[], stateMap: StateMap): void {
  const max = maxScore()
  const rows = candidates.map(({ candidate, profile, analysis }) => {
    const state = stateMap[candidate.id]
    const score = state ? totalScore(state.peter_scores as Scores, state.ossama_scores as Scores) : 0
    return {
      Name: candidate.name,
      Email: candidate.email,
      Slot: candidate.slot,
      Type: candidate.type,
      Salary: candidate.salary,
      Notice: candidate.notice,
      'Current Role': analysis?.current_role ?? '',
      'Current Company': analysis?.current_company ?? '',
      'Total Exp (yrs)': analysis?.total_exp ?? '',
      'PM Exp (yrs)': analysis?.pm_exp ?? '',
      'AI Experience': analysis?.ai_exp ? 'Yes' : 'No',
      'Fit Score': profile?.fit_score ?? '',
      'Fit Label': profile?.fit_label ?? '',
      'Combined Score': `${score}/${max}`,
      'Peter Score': state ? Object.values(state.peter_scores as Scores).reduce((a, b) => a + b, 0) : '',
      'Ossama Score': state ? Object.values(state.ossama_scores as Scores).reduce((a, b) => a + b, 0) : '',
      Verdict: state?.verdict ?? '',
      Status: state?.interview_status ?? '',
      Confirmed: state?.confirmed ? 'Yes' : 'No',
      Shortlisted: state?.shortlisted === true ? 'Yes' : state?.shortlisted === false ? 'No' : '',
      'Peter Notes': state?.peter_comment ?? '',
      'Ossama Notes': state?.ossama_comment ?? '',
    }
  })

  const ws = XLSX.utils.json_to_sheet(rows)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Candidates')
  XLSX.writeFile(wb, 'intella-hiring-may-2026.xlsx')
}

export function exportDecisionReport(candidates: CandidateWithDetails[], stateMap: StateMap): void {
  const max = maxScore()
  const sorted = [...candidates].sort((a, b) => {
    const sa = stateMap[a.candidate.id]
    const sb = stateMap[b.candidate.id]
    const ta = sa ? totalScore(sa.peter_scores as Scores, sa.ossama_scores as Scores) : 0
    const tb = sb ? totalScore(sb.peter_scores as Scores, sb.ossama_scores as Scores) : 0
    return tb - ta
  })

  const verdictLabels: Record<string, string> = {
    'strong-yes': '⭐ Strong Yes',
    yes: '✓ Yes',
    maybe: '? Maybe',
    no: '✗ No',
  }

  const rows = sorted.map((d, i) => {
    const { candidate, profile, analysis } = d
    const state = stateMap[candidate.id]
    const score = state ? totalScore(state.peter_scores as Scores, state.ossama_scores as Scores) : 0
    return `
      <tr>
        <td>${i + 1}</td>
        <td><strong>${candidate.name}</strong><br/><small>${analysis?.current_role ?? ''} @ ${analysis?.current_company ?? ''}</small></td>
        <td>${candidate.salary ?? '—'}</td>
        <td>${candidate.notice ?? '—'}</td>
        <td>${profile?.fit_score ?? '—'}%</td>
        <td><strong>${score}/${max}</strong></td>
        <td style="color:${state?.verdict === 'strong-yes' ? 'green' : state?.verdict === 'no' ? 'red' : 'inherit'}">${verdictLabels[state?.verdict ?? ''] ?? '—'}</td>
        <td><small>${state?.peter_comment ? 'P: ' + state.peter_comment.slice(0, 60) : ''}${state?.ossama_comment ? '<br/>O: ' + state.ossama_comment.slice(0, 60) : ''}</small></td>
      </tr>`
  }).join('')

  const html = `<!DOCTYPE html><html><head><title>Intella Decision Report</title>
  <style>
    body{font-family:system-ui,sans-serif;font-size:12px;color:#111;margin:30px}
    h1{font-size:20px;margin:0 0 4px}p{color:#666;margin:0 0 16px}
    table{width:100%;border-collapse:collapse}
    th{background:#1a1816;color:#fff;padding:8px 10px;text-align:left;font-size:10px;text-transform:uppercase;letter-spacing:.06em}
    td{padding:8px 10px;border-bottom:1px solid #eee;vertical-align:top}
    tr:hover td{background:#f9f9f9}
    @media print{body{margin:10px}}
  </style></head><body>
  <h1>Intella Hiring Round — Decision Report</h1>
  <p>Senior PM · May 17–21, 2026 · Generated ${new Date().toLocaleDateString()}</p>
  <table><thead><tr><th>#</th><th>Candidate</th><th>Salary</th><th>Notice</th><th>Fit</th><th>Score</th><th>Verdict</th><th>Notes</th></tr></thead>
  <tbody>${rows}</tbody></table></body></html>`

  const w = window.open('', '_blank')
  if (w) { w.document.write(html); w.document.close(); setTimeout(() => w.print(), 300) }
}
```

- [ ] **Step 3: Add `printBriefCard` to exports.ts**

Add this function to the end of `src/lib/exports.ts`:
```ts
export function printBriefCard(data: CandidateWithDetails, state: StateMap[string]): void {
  const { candidate, profile, analysis } = data
  const strengths = (profile?.strengths ?? []).slice(0, 3).map((s) => `<div style="color:#166534;font-size:12px;margin-bottom:4px">✓ ${s}</div>`).join('')
  const questions = (profile?.custom_questions ?? []).map((q, i) => `<div style="background:#f0f4ff;border-left:3px solid #1e3a8a;padding:8px 10px;margin-bottom:6px;border-radius:0 4px 4px 0;font-size:12px;line-height:1.5"><strong>Q${i + 1}.</strong> ${q}</div>`).join('')

  const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Brief: ${candidate.name}</title>
  <style>
    body{font-family:system-ui,sans-serif;max-width:700px;margin:30px auto;color:#111;font-size:13px}
    h2{font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.05em;color:#666;margin:14px 0 5px;border-bottom:1px solid #eee;padding-bottom:3px}
    .meta{display:flex;gap:16px;flex-wrap:wrap;color:#555;font-size:12px;margin-bottom:14px}
    .grid{display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-bottom:12px}
    .box{background:#f8f8f8;border-radius:5px;padding:8px 10px}
    .lbl{font-size:9px;font-weight:600;text-transform:uppercase;color:#888;margin-bottom:2px}
    .val{font-size:12px;font-weight:500}
    @media print{body{margin:15px}}
  </style></head><body>
  <h1 style="font-size:18px;margin:0 0 4px">${candidate.name}</h1>
  <div class="meta">
    <span>📅 ${candidate.slot ?? 'TBD'}</span>
    <span>💰 ${candidate.salary ?? '—'}</span>
    <span>⏱ Notice: ${candidate.notice ?? '—'}</span>
    ${analysis ? `<span>🏢 ${analysis.current_role} @ ${analysis.current_company}</span>` : ''}
  </div>
  <div class="grid">
    <div class="box"><div class="lbl">University</div><div class="val">${analysis?.university ?? '—'}</div></div>
    <div class="box"><div class="lbl">Experience</div><div class="val">${analysis ? `${analysis.total_exp}y total, ${analysis.pm_exp}y PM` : '—'}</div></div>
    <div class="box"><div class="lbl">AI Exp</div><div class="val">${analysis?.ai_exp ? 'Yes' : 'No'}</div></div>
    <div class="box"><div class="lbl">Fit Score</div><div class="val">${profile ? `${profile.fit_label} (${profile.fit_score}%)` : '—'}</div></div>
  </div>
  ${strengths ? `<h2>Top Strengths</h2>${strengths}` : ''}
  ${profile?.watch_for ? `<h2>Watch For</h2><div style="font-size:12px;color:#92400e;background:#fffbeb;padding:8px 10px;border-radius:4px">${profile.watch_for}</div>` : ''}
  ${questions ? `<h2>Interview Questions</h2>${questions}` : ''}
  </body></html>`

  const w = window.open('', '_blank')
  if (w) { w.document.write(html); w.document.close(); setTimeout(() => w.print(), 300) }
}
```

Also update the `BriefCard` component's `onPrintBrief` call in `BriefingPage.tsx` to pass the actual function:
```tsx
onPrintBrief={() => printBriefCard({ candidate, ...rest }, stateMap[candidate.id])}
```

Import `printBriefCard` from `@/lib/exports` in `BriefingPage.tsx`.

- [ ] **Step 4: Add print stylesheet to globals.css**

Add to the end of `src/styles/globals.css`:
```css
@media print {
  header, nav, .tab-nav, .filter-bar, .action-queue,
  button, input, textarea, select {
    display: none !important;
  }
  main { padding: 0 !important; }
  .card { break-inside: avoid; border: 1px solid #ccc !important; margin-bottom: 12px; box-shadow: none !important; }
  body { font-size: 11px; background: #fff; }
}
```

- [ ] **Step 5: Wire export buttons in Header**

Modify `src/components/layout/Header.tsx` — the `Header` component already accepts `onExportReport` and `onExportExcel` props. These are passed down from `Layout.tsx`.

Modify `src/components/layout/Layout.tsx` to import and pass the export functions. Add at the top:
```tsx
import { useCandidates } from '@/hooks/useCandidates'
import { useCandidateState } from '@/hooks/useCandidateState'
import { exportToExcel, exportDecisionReport } from '@/lib/exports'
```

Inside `Layout()`:
```tsx
const { data } = useCandidates()
const { stateMap } = useCandidateState()
```

Pass to `Header`:
```tsx
<Header
  onExportReport={() => exportDecisionReport(data, stateMap)}
  onExportExcel={() => exportToExcel(data, stateMap)}
  onPrint={() => window.print()}
/>
```

- [ ] **Step 6: Verify exports in browser**
```bash
npm run dev
```
- Click "Export Excel" in header → downloads `intella-hiring-may-2026.xlsx` with all columns
- Click "Report PDF" → opens new window with ranked decision report, triggers print dialog
- Click "Print Brief" on a Day Briefing card → opens per-candidate print window with profile summary
- Click "Print" in header → triggers browser print on current page

Kill the server.

- [ ] **Step 7: Run all tests**
```bash
npm run test:run
```
Expected: All tests pass.

- [ ] **Step 8: Update README phase table**

In `README.md`, update the phases table to mark all phases as ✅ Done.

- [ ] **Step 9: Final commit**
```bash
git add -A
git commit -m "feat(exports): add excel export, decision report, print brief and print stylesheet"
```

---

### Task 5: Final Build Verification

- [ ] **Step 1: Production build**
```bash
npm run build
```
Expected: No TypeScript errors. No Vite warnings. `dist/` directory created.

- [ ] **Step 2: Run full test suite**
```bash
npm run test:run
```
Expected: All tests pass.

- [ ] **Step 3: Run lint**
```bash
npm run lint
```
Expected: Zero warnings or errors.

- [ ] **Step 4: Final commit**
```bash
git add -A
git commit -m "chore: phase 8 complete - all tests pass, build clean"
```

---

**Phase 8 complete. All 8 phases delivered.**

The Intella Hiring Dashboard is fully migrated from a 4.5MB static HTML file to a production-grade React application with:
- Supabase backend (Postgres + Auth + Storage)
- Google OAuth restricted to `@intellaworld.com`
- 8 fully functional tabs
- Feedback blinding, audit trail, action queue, pipeline health
- AI Assistant with debrief summary
- Excel and PDF exports
- Netlify deployment
