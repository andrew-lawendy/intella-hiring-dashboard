import { useState } from 'react'
import { sendChatMessage } from '@/lib/chat'
import { buildDebriefPrompt } from '@/lib/systemPrompt'
import type { Provider } from '@/lib/chat'
import type { CandidateWithDetails } from '@/hooks/useCandidates'
import type { StateMap } from '@/hooks/useCandidateState'
import type { HiringRound } from '@/hooks/useHiringRound'
import { Button } from '@/components/ui/button'

interface DebriefSummaryProps {
  candidates: CandidateWithDetails[]
  stateMap: StateMap
  apiKey: string | null
  provider: Provider
  round?: HiringRound | null
  combinedScoreMap?: Record<string, number>
  commentsMap?: Record<string, string[]>
}

export function DebriefSummary({
  candidates,
  stateMap,
  apiKey,
  provider,
  round,
  combinedScoreMap = {},
  commentsMap = {},
}: DebriefSummaryProps) {
  const [summary, setSummary] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const completedCount = candidates.filter(
    ({ candidate }) => stateMap[candidate.id]?.interview_status === 'completed',
  ).length

  const generate = async () => {
    if (!apiKey) {
      setError('Enter your API key above first.')
      return
    }
    setLoading(true)
    setError(null)
    try {
      const prompt = buildDebriefPrompt(
        candidates,
        stateMap,
        round ?? null,
        combinedScoreMap,
        commentsMap,
      )
      const result = await sendChatMessage(
        [{ role: 'user', content: 'Generate the debrief summary.' }],
        prompt,
        apiKey,
        provider,
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
        <Button
          size="sm"
          onClick={generate}
          disabled={loading || completedCount === 0}
          loading={loading}
        >
          {loading ? 'Generating…' : 'Generate Debrief'}
        </Button>
      </div>

      {error && (
        <div className="px-5 py-3 bg-[var(--red-bg)] border-b border-[var(--red-line)] text-[var(--red)] text-[12px]">
          Error: {error}
        </div>
      )}

      {summary && (
        <div className="px-5 py-4">
          <div className="text-[13px] text-text leading-relaxed whitespace-pre-wrap font-sans">
            {summary}
          </div>
          <Button
            size="sm"
            variant="outline"
            className="mt-4"
            onClick={() => {
              const w = window.open('', '_blank')
              if (w) {
                w.document.write(
                  `<html><head><title>Debrief Summary</title><style>body{font-family:system-ui,sans-serif;max-width:800px;margin:40px auto;padding:20px;color:#1a1816;line-height:1.6}h1,h2,h3{margin-top:24px}pre{white-space:pre-wrap}</style></head><body><h1>Intella Hiring Round — Debrief Summary</h1><pre>${summary}</pre></body></html>`,
                )
                w.document.close()
                setTimeout(() => w.print(), 300)
              }
            }}
          >
            Print / Export
          </Button>
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
