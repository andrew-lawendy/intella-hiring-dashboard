import { Scorecard } from '@/components/cards/Scorecard'
import { Checklist } from '@/components/cards/Checklist'
import { Comments } from '@/components/cards/Comments'
import { StatusVerdictButtons } from '@/components/cards/StatusVerdictButtons'
import type { Scores } from '@/lib/scoring'
import type { Database } from '@/lib/database.types'

type State = Database['public']['Tables']['interview_state']['Row']

interface ProfileScoreProps {
  state: State
  candidateId: string
  myName: string
  coName: string
  myScores: Scores
  coScores: Scores
  myComment: string
  coComment: string
  scoreCategories?: readonly string[]
  checklistItems?: string[]
  onMyScoreChange?: (scores: Scores) => void
  onMyCommentSave?: (comment: string) => void
  onChecklistChange?: (checklist: Record<string, boolean>) => void
  onVerdictChange?: (v: NonNullable<State['verdict']>) => void
  onStatusChange?: (s: State['interview_status']) => void
}

export function ProfileScore({
  state,
  candidateId,
  myName,
  coName,
  myScores,
  coScores,
  myComment,
  coComment,
  scoreCategories,
  checklistItems,
  onMyScoreChange,
  onMyCommentSave,
  onChecklistChange,
  onVerdictChange,
  onStatusChange,
}: ProfileScoreProps) {
  return (
    <div className="divide-y divide-border">
      {onStatusChange && onVerdictChange && (
        <StatusVerdictButtons
          status={state.interview_status}
          verdict={state.verdict}
          onStatusChange={onStatusChange}
          onVerdictChange={onVerdictChange}
        />
      )}

      {onMyScoreChange && (
        <Scorecard
          myName={myName}
          coName={coName}
          myScores={myScores}
          coScores={coScores}
          scoreCategories={scoreCategories}
          onMyScoreChange={onMyScoreChange}
        />
      )}

      <Checklist
        candidateId={candidateId}
        checklist={state.checklist as Record<string, boolean>}
        items={checklistItems}
        onChange={onChecklistChange ?? (() => {})}
      />

      {onMyCommentSave && (
        <Comments
          candidateId={candidateId}
          myComment={myComment}
          coComment={coComment}
          myLabel={myName}
          coLabel={coName}
          onMySave={onMyCommentSave}
        />
      )}
    </div>
  )
}
