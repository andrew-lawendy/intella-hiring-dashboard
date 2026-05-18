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

const MONTHS: Record<string, number> = {
  Jan: 0,
  Feb: 1,
  Mar: 2,
  Apr: 3,
  May: 4,
  Jun: 5,
  Jul: 6,
  Aug: 7,
  Sep: 8,
  Oct: 9,
  Nov: 10,
  Dec: 11,
}

export function parseSlotDate(slot: string | null): Date | null {
  if (!slot || slot === 'TBD') return null
  const match = slot.match(/\w+ (\d+) (\w+) (\d+):(\d+)/)
  if (!match) return null
  const [, day, month, hour, minute] = match
  const monthIndex = MONTHS[month]
  if (monthIndex === undefined) return null
  // Known limitation: always uses the current year, so a slot of "Mon 31 Dec 14:00-15:00"
  // checked in early January of the next year will parse with the wrong year.
  return new Date(
    new Date().getFullYear(),
    monthIndex,
    parseInt(day),
    parseInt(hour),
    parseInt(minute),
  )
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
  slot: string | null
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

    const slotDate = parseSlotDate(c.slot)

    if (!c.slot || c.slot === 'TBD' || slotDate === null) {
      items.push({
        type: 'no-slot',
        candidateId: c.id,
        candidateName: c.name,
        jobId: c.jobId,
        message: 'No slot assigned',
      })
    } else if (slotDate && isSameDay(slotDate, now) && !s.confirmed) {
      items.push({
        type: 'slot-today-unconfirmed',
        candidateId: c.id,
        candidateName: c.name,
        jobId: c.jobId,
        message: 'Interview today — not confirmed',
      })
    } else if (slotDate && isSameDay(slotDate, tomorrow) && !s.confirmed) {
      items.push({
        type: 'slot-tomorrow-unconfirmed',
        candidateId: c.id,
        candidateName: c.name,
        jobId: c.jobId,
        message: 'Interview tomorrow — not confirmed',
      })
    } else if (!s.confirmed && c.slot && c.slot !== 'TBD') {
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
