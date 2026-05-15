import { isScoreSubmitted } from './scoring'
import type { Scores } from './scoring'

export type ActionItemType = 'unconfirmed' | 'no-verdict' | 'overdue-scorecard'

export interface ActionItem {
  type: ActionItemType
  candidateId: string
  candidateName: string
  message: string
}

interface CandidateMin {
  id: string
  name: string
  slot: string | null
}
interface StateMin {
  confirmed: boolean
  interview_status: string
  verdict: string | null
  peter_scores: Scores
  ossama_scores: Scores
}

export function deriveActionItems(
  candidates: CandidateMin[],
  stateMap: Record<string, StateMin>,
): ActionItem[] {
  const items: ActionItem[] = []

  for (const c of candidates) {
    const s = stateMap[c.id]
    if (!s) continue

    if (!s.confirmed && c.slot && c.slot !== 'TBD') {
      items.push({
        type: 'unconfirmed',
        candidateId: c.id,
        candidateName: c.name,
        message: `Confirmation pending`,
      })
    }

    if (s.interview_status === 'completed' && s.verdict === null) {
      items.push({
        type: 'no-verdict',
        candidateId: c.id,
        candidateName: c.name,
        message: `Interview done — no verdict set`,
      })
    }

    if (
      s.interview_status === 'completed' &&
      !isScoreSubmitted(s.peter_scores) &&
      !isScoreSubmitted(s.ossama_scores)
    ) {
      items.push({
        type: 'overdue-scorecard',
        candidateId: c.id,
        candidateName: c.name,
        message: `Scorecard overdue`,
      })
    }
  }

  return items
}
