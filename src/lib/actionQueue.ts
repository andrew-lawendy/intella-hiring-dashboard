export type ActionItemType =
  | 'no-slot'
  | 'slot-today-unconfirmed'
  | 'slot-tomorrow-unconfirmed'
  | 'unconfirmed'
  | 'no-verdict'
  | 'overdue-scorecard'

export interface ActionItem {
  type: ActionItemType
  candidateId: string
  candidateName: string
  jobId: number
  message: string
}

export const TYPE_COLORS: Record<ActionItemType, string> = {
  'slot-today-unconfirmed': 'var(--red)',
  'overdue-scorecard': 'var(--red)',
  'no-slot': 'var(--amber)',
  'slot-tomorrow-unconfirmed': 'var(--amber)',
  unconfirmed: 'var(--amber)',
  'no-verdict': 'var(--blue)',
}

const URGENCY: Record<ActionItemType, number> = {
  'slot-today-unconfirmed': 0,
  'overdue-scorecard': 0,
  'no-slot': 1,
  'slot-tomorrow-unconfirmed': 1,
  unconfirmed: 1,
  'no-verdict': 2,
}

function getInterviewDate(interview_at: string | null): Date | null {
  if (!interview_at) return null
  const d = new Date(interview_at)
  return isNaN(d.getTime()) ? null : d
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

interface CandidateMin {
  id: string
  name: string
  interview_at: string | null
  jobId: number
}

interface StateMin {
  confirmed: boolean
  interview_status: string
  verdict: string | null
}

export function deriveActionItems(
  candidates: CandidateMin[],
  stateMap: Record<string, StateMin>,
  myScoresMap: Record<string, Record<string, number>>,
): ActionItem[] {
  const now = new Date()
  const tomorrow = new Date(now)
  tomorrow.setDate(now.getDate() + 1)

  const items: ActionItem[] = []

  for (const c of candidates) {
    const s = stateMap[c.id]
    if (!s) continue

    const interviewDate = getInterviewDate(c.interview_at)

    if (!c.interview_at || interviewDate === null) {
      items.push({
        type: 'no-slot',
        candidateId: c.id,
        candidateName: c.name,
        jobId: c.jobId,
        message: 'No slot assigned',
      })
    } else if (interviewDate && isSameDay(interviewDate, now) && !s.confirmed) {
      items.push({
        type: 'slot-today-unconfirmed',
        candidateId: c.id,
        candidateName: c.name,
        jobId: c.jobId,
        message: 'Interview today — not confirmed',
      })
    } else if (interviewDate && isSameDay(interviewDate, tomorrow) && !s.confirmed) {
      items.push({
        type: 'slot-tomorrow-unconfirmed',
        candidateId: c.id,
        candidateName: c.name,
        jobId: c.jobId,
        message: 'Interview tomorrow — not confirmed',
      })
    } else if (!s.confirmed && c.interview_at) {
      items.push({
        type: 'unconfirmed',
        candidateId: c.id,
        candidateName: c.name,
        jobId: c.jobId,
        message: 'Confirmation pending',
      })
    }

    // Completed interviews can emit both no-verdict and overdue-scorecard — intentionally separate action items
    if (s.interview_status === 'completed' && s.verdict === null) {
      items.push({
        type: 'no-verdict',
        candidateId: c.id,
        candidateName: c.name,
        jobId: c.jobId,
        message: 'Interview done — no verdict set',
      })
    }

    const myScores = myScoresMap[c.id] ?? {}
    const hasScored = Object.values(myScores).some((v) => v > 0)
    if (s.interview_status === 'completed' && !hasScored) {
      items.push({
        type: 'overdue-scorecard',
        candidateId: c.id,
        candidateName: c.name,
        jobId: c.jobId,
        message: 'Scorecard overdue',
      })
    }
  }

  return items.sort((a, b) => URGENCY[a.type] - URGENCY[b.type])
}
