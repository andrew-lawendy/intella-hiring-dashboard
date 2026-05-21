export type FilterType =
  | 'all'
  | 'confirmed'
  | 'pending'
  | 'shortlisted'
  | 'rejected'
  | 'intern'
  | 'junior'
  | 'mid'
  | 'senior'

const SENIORITY_FILTERS = new Set<FilterType>(['intern', 'junior', 'mid', 'senior'])

interface CandidateMin {
  id: string
  name: string
  email: string
  day?: string | null
  seniority?: string | null
  interview_at?: string | null
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
  } else if (SENIORITY_FILTERS.has(filter)) {
    result = result.filter((c) => c.seniority?.toLowerCase() === filter)
  }

  if (search.trim()) {
    const q = search.toLowerCase()
    result = result.filter(
      (c) => c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q),
    )
  }

  return result
}

export function applyDayFilter<T extends { interview_at?: string | null }>(
  candidates: T[],
  dayFilter: string | null,
): T[] {
  if (!dayFilter) return candidates
  return candidates.filter(
    (c) =>
      c.interview_at != null && new Date(c.interview_at).toLocaleDateString('en-CA') === dayFilter,
  )
}
