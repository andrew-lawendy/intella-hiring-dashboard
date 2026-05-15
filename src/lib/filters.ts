type FilterType = 'all' | 'shortlisted' | 'pending' | 'rejected'

interface Candidate {
  id: string
  name: string
  email: string
}

interface StateSnapshot {
  shortlisted: boolean | null
  verdict: string | null
  interview_status: string
}

export function filterCandidates(
  candidates: Candidate[],
  stateMap: Record<string, StateSnapshot>,
  filter: FilterType,
  search: string,
): Candidate[] {
  let result = candidates

  if (filter === 'shortlisted') {
    result = result.filter((c) => stateMap[c.id]?.shortlisted === true)
  } else if (filter === 'pending') {
    result = result.filter(
      (c) => stateMap[c.id]?.shortlisted !== true && stateMap[c.id]?.verdict === null,
    )
  } else if (filter === 'rejected') {
    result = result.filter((c) => stateMap[c.id]?.shortlisted === false)
  }

  if (search.trim()) {
    const q = search.toLowerCase()
    result = result.filter(
      (c) => c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q),
    )
  }

  return result
}
