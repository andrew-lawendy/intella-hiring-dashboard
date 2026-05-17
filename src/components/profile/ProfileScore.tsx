import { useAuth } from '@/hooks/useAuth'
import { useAllScores } from '@/hooks/useAllScores'
import { useAllComments } from '@/hooks/useAllComments'
import { useInterviewerNames } from '@/hooks/useInterviewerNames'
import { Scorecard } from '@/components/cards/Scorecard'
import { Checklist } from '@/components/cards/Checklist'
import { Comments } from '@/components/cards/Comments'
import { StatusVerdictButtons } from '@/components/cards/StatusVerdictButtons'
import type { Database } from '@/lib/database.types'

type State = Database['public']['Tables']['interview_state']['Row']

interface ProfileScoreProps {
  state: State
  candidateId: string
  scoreCategories?: readonly string[]
  checklistItems?: string[]
  onChecklistChange?: (checklist: Record<string, boolean>) => void
  onVerdictChange?: (v: NonNullable<State['verdict']>) => void
  onStatusChange?: (s: State['interview_status']) => void
}

export function ProfileScore({
  state,
  candidateId,
  scoreCategories,
  checklistItems,
  onChecklistChange,
  onVerdictChange,
  onStatusChange,
}: ProfileScoreProps) {
  const { user } = useAuth()
  const getInterviewerName = useInterviewerNames()

  const { myScoresFor, coScoresFor, setMyScores } = useAllScores(user?.id)
  const { myCommentFor, coCommentsFor, setMyComment } = useAllComments(user?.id)

  const mySlot = user?.email?.split('@')[0] ?? 'you'
  const myName = getInterviewerName(mySlot)

  const coComments = coCommentsFor(candidateId)

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

      <Scorecard
        myName={myName}
        coName="Co-scorer"
        myScores={myScoresFor(candidateId)}
        coScores={coScoresFor(candidateId)}
        scoreCategories={scoreCategories}
        onMyScoreChange={(scores) => setMyScores(candidateId, scores)}
      />

      <Checklist
        candidateId={candidateId}
        checklist={state.checklist as Record<string, boolean>}
        items={checklistItems}
        onChange={onChecklistChange ?? (() => {})}
      />

      <Comments
        candidateId={candidateId}
        myComment={myCommentFor(candidateId)}
        coComment={coComments[0] ?? ''}
        myLabel={myName}
        coLabel="Co-scorer"
        onMySave={(body) => setMyComment(candidateId, body)}
      />
    </div>
  )
}
