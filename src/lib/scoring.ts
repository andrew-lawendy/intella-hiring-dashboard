export const DEFAULT_SCORE_CATEGORIES = [
  'Communication',
  'Technical',
  'Culture Fit',
  'Leadership',
  'Overall',
] as const

// Legacy alias — used where no round is available
export const SCORE_CATEGORIES = DEFAULT_SCORE_CATEGORIES

export type ScoreCategory = (typeof DEFAULT_SCORE_CATEGORIES)[number]
export type Scores = Record<string, number>

export function zeroScores(categories: readonly string[] = DEFAULT_SCORE_CATEGORIES): Scores {
  return Object.fromEntries(categories.map((c) => [c, 0]))
}

export const ZERO_SCORES: Scores = zeroScores()

export function maxScore(categories: readonly string[] = DEFAULT_SCORE_CATEGORIES): number {
  return categories.length * 5
}

export function sumScores(scores: Scores): number {
  return Object.values(scores).reduce((a, b) => a + b, 0)
}

export function totalScore(slotA: Scores, slotB: Scores): number {
  const sa = sumScores(slotA)
  const sb = sumScores(slotB)
  if (sa > 0 && sb > 0) return Math.round((sa + sb) / 2)
  return sa || sb
}

export function isScoreSubmitted(
  scores: Scores,
  categories: readonly string[] = DEFAULT_SCORE_CATEGORIES,
): boolean {
  return categories.every((cat) => (scores[cat] ?? 0) > 0)
}

export function fitColorFromScore(score: number | null): string {
  if (score === null) return 'var(--brand)'
  if (score >= 65) return 'var(--green)'
  if (score >= 45) return 'var(--amber)'
  return 'var(--red)'
}

export function fitLabelFromScore(score: number | null): string {
  if (score === null) return '—'
  if (score >= 85) return 'Exceptional fit'
  if (score >= 65) return 'Strong fit'
  if (score >= 55) return 'Moderate fit'
  if (score >= 45) return 'Partial fit'
  return 'Weak fit'
}
