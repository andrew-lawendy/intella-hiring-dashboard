export const SCORE_CATEGORIES = [
  'Communication',
  'Technical',
  'Culture Fit',
  'Leadership',
  'Overall',
] as const

export type ScoreCategory = (typeof SCORE_CATEGORIES)[number]
export type Scores = Record<ScoreCategory, number>

export const ZERO_SCORES: Scores = {
  Communication: 0,
  Technical: 0,
  'Culture Fit': 0,
  Leadership: 0,
  Overall: 0,
}

export function maxScore(): number {
  return SCORE_CATEGORIES.length * 5
}

export function sumScores(scores: Scores): number {
  return Object.values(scores).reduce((a, b) => a + b, 0)
}

export function totalScore(peter: Scores, ossama: Scores): number {
  const ps = sumScores(peter)
  const os = sumScores(ossama)
  if (ps > 0 && os > 0) return Math.round((ps + os) / 2)
  return ps || os
}

export function isScoreSubmitted(scores: Scores): boolean {
  return SCORE_CATEGORIES.every((cat) => scores[cat] > 0)
}
