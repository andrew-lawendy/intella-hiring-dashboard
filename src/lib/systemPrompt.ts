import type { CandidateWithDetails } from '@/hooks/useCandidates'
import type { StateMap } from '@/hooks/useCandidateState'
import type { Job } from '@/hooks/useJobs'
import { maxScore } from './scoring'
import { formatInterviewSlot } from '@/lib/interview'
import { formatSalary } from '@/lib/salary'

export function buildSystemPrompt(
  candidates: CandidateWithDetails[],
  stateMap: StateMap,
  job: Job | null = null,
  combinedScoreMap: Record<string, number> = {},
  commentsMap: Record<string, string[]> = {},
): string {
  const role = job?.name ?? 'this role'
  const max = maxScore()
  const candidateSummaries = candidates
    .map(({ candidate, profile, analysis }) => {
      const state = stateMap[candidate.id]
      const score = combinedScoreMap[candidate.id] ?? 0
      const comments = commentsMap[candidate.id] ?? []
      return [
        `**${candidate.name}** (${candidate.id})`,
        `- Slot: ${formatInterviewSlot(candidate.interview_at)} | Type: ${candidate.type} | Salary: ${formatSalary(candidate.salary_amount, candidate.salary_currency, candidate.salary_period)} | Notice: ${candidate.notice}`,
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
        ...comments.map((c, i) => `- Interviewer notes (${i + 1}): ${c}`),
      ]
        .filter(Boolean)
        .join('\n')
    })
    .join('\n\n')

  return `You are an AI assistant helping the Intella team evaluate candidates for the ${role} role.
The company is Intella, building Ziila — an AI agent platform for bank call centers.
There are ${candidates.length} candidates in this pipeline.

Here is the current state of all candidates:

${candidateSummaries}

Answer questions about the candidates, help compare them, suggest talking points for the debrief, or generate insights. Be direct and specific.`
}

export function buildDebriefPrompt(
  candidates: CandidateWithDetails[],
  stateMap: StateMap,
  job: Job | null = null,
  combinedScoreMap: Record<string, number> = {},
  commentsMap: Record<string, string[]> = {},
): string {
  const completedCandidates = candidates.filter(
    ({ candidate }) => stateMap[candidate.id]?.interview_status === 'completed',
  )

  const summaries = buildSystemPrompt(
    completedCandidates,
    stateMap,
    job,
    combinedScoreMap,
    commentsMap,
  )

  return `Based on the interview data below, generate a structured debrief summary for the Intella hiring team.

Format your response with these sections:
1. **Top Candidates** — rank the top 3-5 by combined score and explain why
2. **Consensus vs. Disagreement** — where interviewers agree/disagree on verdicts
3. **Key Trade-offs** — e.g., high AI experience but low seniority; strong B2B but no fintech
4. **Recommendation** — who to advance to next stage and why
5. **Suggested Debrief Talking Points** — 3-5 questions to discuss as a team

${summaries}`
}
