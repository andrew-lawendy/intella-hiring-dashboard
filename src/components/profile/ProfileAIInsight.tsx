import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ZapIcon, KeyRoundIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { sendChatMessage, loadApiKey } from '@/lib/chat'
import type { Provider } from '@/lib/chat'
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

function buildPrompt(candidate: Candidate, profile: Profile, analysis: Analysis | null): string {
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

  const PROVIDERS: Provider[] = ['anthropic', 'openai', 'google']
  const provider = PROVIDERS.find((p) => loadApiKey(p) !== null) ?? 'anthropic'
  const apiKey = loadApiKey(provider)
  const navigate = useNavigate()

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
        provider,
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
      <div className="p-6 flex flex-col gap-4">
        <p className="text-[13px] text-muted-foreground leading-relaxed">
          To generate an AI assessment, you need an Anthropic API key.
        </p>
        <Button size="sm" className="w-fit" onClick={() => navigate('/chat')}>
          <KeyRoundIcon className="size-3.5" />
          Set up API key in AI Assistant
        </Button>
      </div>
    )
  }

  return (
    <div className="p-6 flex flex-col gap-4">
      <p className="text-[13px] text-muted-foreground leading-relaxed">
        Live Claude assessment of {candidate.name.split(' ')[0]}'s fit for the Intella Senior PM
        role, generated from their career data.
      </p>

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
          <Button
            size="sm"
            variant="outline"
            onClick={generate}
            disabled={loading}
            className="w-fit"
          >
            <ZapIcon className="size-3.5" />
            Regenerate
          </Button>
        </div>
      )}
    </div>
  )
}
