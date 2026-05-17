export type FilterType =
  | 'all'
  | 'confirmed'
  | 'pending'
  | 'shortlisted'
  | 'rejected'
  | 'sun'
  | 'mon'
  | 'tue'
  | 'wed'
  | 'thu'

const FALLBACK_DAY_MAP: Record<string, string> = {
  sun: 'Sunday',
  mon: 'Monday',
  tue: 'Tuesday',
  wed: 'Wednesday',
  thu: 'Thursday',
  fri: 'Friday',
  sat: 'Saturday',
}

interface CandidateMin {
  id: string
  name: string
  email: string
  day?: string | null
}

interface StateSnapshot {
  shortlisted: boolean | null
  verdict: string | null
  interview_status: string
  confirmed?: boolean
}

export function filterCandidates<T extends CandidateMin>(
  candidates: T[],
  stateMap: Record<string, StateSnapshot>,
  filter: FilterType,
  search: string,
  dayMap: Record<string, string> = FALLBACK_DAY_MAP,
): T[] {
  let result = candidates

  if (filter === 'confirmed') {
    result = result.filter((c) => stateMap[c.id]?.confirmed === true)
  } else if (filter === 'shortlisted') {
    result = result.filter((c) => stateMap[c.id]?.shortlisted === true)
  } else if (filter === 'pending') {
    result = result.filter(
      (c) => stateMap[c.id]?.shortlisted !== true && stateMap[c.id]?.verdict === null,
    )
  } else if (filter === 'rejected') {
    result = result.filter((c) => stateMap[c.id]?.shortlisted === false)
  } else if (dayMap[filter]) {
    result = result.filter((c) => c.day === dayMap[filter])
  }

  if (search.trim()) {
    const q = search.toLowerCase()
    result = result.filter(
      (c) => c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q),
    )
  }

  return result
}
