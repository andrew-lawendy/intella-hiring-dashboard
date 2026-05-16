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

const DAY_MAP: Record<string, string> = {
  sun: 'Sunday 17 May',
  mon: 'Monday 18 May',
  tue: 'Tuesday 19 May',
  wed: 'Wednesday 20 May',
  thu: 'Thursday 21 May',
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
  } else if (DAY_MAP[filter]) {
    result = result.filter((c) => c.day === DAY_MAP[filter])
  }

  if (search.trim()) {
    const q = search.toLowerCase()
    result = result.filter(
      (c) => c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q),
    )
  }

  return result
}
