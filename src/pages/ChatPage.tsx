import { useState, useCallback } from 'react'
import { ApiKeyBanner } from '@/components/chat/ApiKeyBanner'
import { ChatInterface } from '@/components/chat/ChatInterface'
import { DebriefSummary } from '@/components/chat/DebriefSummary'
import { useCandidates } from '@/hooks/useCandidates'
import { useCandidateState } from '@/hooks/useCandidateState'
import { useHiringRound } from '@/hooks/useHiringRound'
import { useAuth } from '@/hooks/useAuth'
import { useAllScores } from '@/hooks/useAllScores'
import { useAllComments } from '@/hooks/useAllComments'
import { buildSystemPrompt } from '@/lib/systemPrompt'
import type { Provider } from '@/lib/chat'

export function ChatPage() {
  const [apiKey, setApiKey] = useState<string | null>(null)
  const [provider, setProvider] = useState<Provider>('anthropic')
  const { data } = useCandidates()
  const { stateMap } = useCandidateState()
  const { data: round } = useHiringRound()
  const { user } = useAuth()
  const { combinedScoreMap } = useAllScores(user?.id)
  const { byCandidate: commentsByCandidate } = useAllComments(user?.id)

  const commentsMap = Object.fromEntries(
    Object.entries(commentsByCandidate).map(([cid, byUser]) => [cid, Object.values(byUser)]),
  )

  const systemPrompt = buildSystemPrompt(
    data,
    stateMap,
    round ?? null,
    combinedScoreMap,
    commentsMap,
  )

  const handleKeyChange = useCallback((key: string | null, p: Provider) => {
    setApiKey(key)
    setProvider(p)
  }, [])

  return (
    <div>
      <h1 className="text-[30px] font-medium tracking-[-0.025em] mb-1 text-text">AI Assistant</h1>
      <p className="text-text2 text-[13.5px] mb-6">
        Chat with your candidate data using Claude, GPT-4o mini, or Gemini. Works on hosted URL.
      </p>

      <ApiKeyBanner onKeyChange={handleKeyChange} />

      <div className="grid gap-5">
        <DebriefSummary
          candidates={data}
          stateMap={stateMap}
          apiKey={apiKey}
          provider={provider}
          round={round ?? null}
          combinedScoreMap={combinedScoreMap}
          commentsMap={commentsMap}
        />
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-text3 mb-3">
            Ask Anything
          </p>
          <ChatInterface systemPrompt={systemPrompt} apiKey={apiKey} provider={provider} />
        </div>
      </div>
    </div>
  )
}
