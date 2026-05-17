import type { CandidateWithDetails } from '@/hooks/useCandidates'
import type { StateMap } from '@/hooks/useCandidateState'
import type { HiringRound } from '@/hooks/useHiringRound'
import { formatRoundDateRange, formatRoundYear } from '@/hooks/useHiringRound'
import { totalScore, maxScore } from './scoring'
import type { Scores } from './scoring'

export function buildSystemPrompt(
  candidates: CandidateWithDetails[],
  stateMap: StateMap,
  round: HiringRound | null = null,
): string {
  const role = round?.role ?? 'Senior Product Manager'
  const dateRange = round
    ? `${formatRoundDateRange(round.start_date, round.end_date)} ${formatRoundYear(round.start_date)}`
    : 'this period'
  const max = maxScore()
  const candidateSummaries = candidates
    .map(({ candidate, profile, analysis }) => {
      const state = stateMap[candidate.id]
      const score = state
        ? totalScore(state.peter_scores as Scores, state.ossama_scores as Scores)
        : 0
      return [
        `**${candidate.name}** (${candidate.id})`,
        `- Slot: ${candidate.slot} | Type: ${candidate.type} | Salary: ${candidate.salary} | Notice: ${candidate.notice}`,
        profile
          ? `- Title: ${profile.title} at ${profile.company} | Fit: ${profile.fit_score}% (${profile.fit_label})`
          : '',
        profile
          ? `- AI Score: ${profile.ai_score}/5 | B2B: ${profile.b2b_score}/5 | Fintech: ${profile.fintech_score}/5`
          : '',
        analysis
          ? `- Exp: ${analysis.total_exp}y total, ${analysis.pm_exp}y PM | AI exp: ${analysis.ai_exp} | Domains: ${(analysis.domains ?? []).join(', ')}`
          : '',
        state
          ? `- Combined score: ${score}/${max} | Status: ${state.interview_status} | Verdict: ${state.verdict ?? 'none'}`
          : '',
        state?.peter_comment ? `- Interviewer notes (A): ${state.peter_comment}` : '',
        state?.ossama_comment ? `- Interviewer notes (B): ${state.ossama_comment}` : '',
      ]
        .filter(Boolean)
        .join('\n')
    })
    .join('\n\n')

  return `You are an AI assistant helping the Intella team evaluate candidates for the ${role} role.
The company is Intella, building Ziila — an AI agent platform for bank call centers.
The hiring round covers ${candidates.length} candidates interviewing ${dateRange}.

Key requirements for the role:
- B2B enterprise experience (banking clients preferred)
- AI/LLM product experience
- 5+ years PM experience
- Strong stakeholder management

Here is the current state of all candidates:

${candidateSummaries}

Answer questions about the candidates, help compare them, suggest talking points for the debrief, or generate insights about the hiring round. Be direct and specific.`
}

export function buildDebriefPrompt(
  candidates: CandidateWithDetails[],
  stateMap: StateMap,
  round: HiringRound | null = null,
): string {
  const completedCandidates = candidates.filter(
    ({ candidate }) => stateMap[candidate.id]?.interview_status === 'completed',
  )

  const summaries = buildSystemPrompt(completedCandidates, stateMap, round)

  return `Based on the interview data below, generate a structured debrief summary for the Intella hiring team.

Format your response with these sections:
1. **Top Candidates** — rank the top 3-5 by combined score and explain why
2. **Consensus vs. Disagreement** — where Peter and Ossama agree/disagree on verdicts
3. **Key Trade-offs** — e.g., high AI experience but low seniority; strong B2B but no fintech
4. **Recommendation** — who to advance to next stage and why
5. **Suggested Debrief Talking Points** — 3-5 questions to discuss as a team

${summaries}`
}
