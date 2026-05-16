import { CardHeader } from './CardHeader'
import { CardBody } from './CardBody'
import { Scorecard } from './Scorecard'
import { Checklist } from './Checklist'
import { Comments } from './Comments'
import { StatusVerdictButtons } from './StatusVerdictButtons'
import { CardActions } from './CardActions'
import type { Database } from '@/lib/database.types'
import type { Scores } from '@/lib/scoring'

type Candidate = Database['public']['Tables']['candidates']['Row']
type State = Database['public']['Tables']['interview_state']['Row']

interface CandidateCardProps {
  candidate: Candidate
  state: State
  index: number
  currentUser: 'peter' | 'ossama'
  onConfirmToggle: () => void
  onStatusChange: (s: State['interview_status']) => void
  onVerdictChange: (v: NonNullable<State['verdict']>) => void
  onShortlist: () => void
  onReject: () => void
  onScoreChange: (scorer: 'peter' | 'ossama', scores: Scores) => void
  onCommentChange: (scorer: 'peter' | 'ossama', comment: string) => void
  onChecklistChange: (checklist: Record<string, boolean>) => void
  onOpenProfile: () => void
  onEmailDraft: () => void
  auditLine?: string
}

const STATUS_BANNER: Record<string, { label: string; cls: string }> = {
  shortlisted: {
    label: '★ Shortlisted',
    cls: 'bg-gradient-to-r from-[var(--green-bg)] to-transparent text-[var(--green)] border-b border-[var(--green-line)]',
  },
  rejected: {
    label: '✕ Rejected',
    cls: 'bg-[var(--red-bg)] text-[var(--red)] border-b border-[var(--red-line)]',
  },
  pending: {
    label: '— Decision Pending',
    cls: 'bg-surface2 text-text3 border-b border-border',
  },
}

export function CandidateCard({
  candidate,
  state,
  index,
  currentUser,
  onConfirmToggle,
  onStatusChange,
  onVerdictChange,
  onShortlist,
  onReject,
  onScoreChange,
  onCommentChange,
  onChecklistChange,
  onOpenProfile,
  onEmailDraft,
  auditLine,
}: CandidateCardProps) {
  const overdueWarning =
    state.interview_status === 'completed' &&
    Object.values(state.peter_scores as Scores).every((v) => v === 0) &&
    Object.values(state.ossama_scores as Scores).every((v) => v === 0)

  const bannerKey =
    state.shortlisted === true
      ? 'shortlisted'
      : state.shortlisted === false
        ? 'rejected'
        : 'pending'
  const banner = STATUS_BANNER[bannerKey]

  return (
    <div
      className={[
        'bg-surface border rounded-[var(--radius)] overflow-hidden flex flex-col transition-all duration-150 shadow-[var(--shadow-sm)]',
        'hover:-translate-y-0.5 hover:shadow-[var(--shadow-md)] hover:border-border-strong',
        state.shortlisted === true
          ? 'border-[var(--green-line)] shadow-[0_0_0_1px_var(--green-line),var(--shadow-sm)]'
          : 'border-border',
        state.shortlisted === false ? 'opacity-70 hover:opacity-95' : '',
      ].join(' ')}
    >
      {banner && (
        <div
          className={`px-4 py-1.5 text-[10.5px] font-semibold uppercase tracking-[0.08em] flex items-center gap-1.5 ${banner.cls}`}
        >
          {banner.label}
        </div>
      )}

      {overdueWarning && (
        <div className="px-4 py-1.5 text-[10.5px] font-semibold uppercase tracking-[0.08em] bg-[var(--amber-bg)] text-[var(--amber)] border-b border-[var(--amber-line)]">
          ⚠ Scorecard overdue
        </div>
      )}

      <CardHeader
        candidate={candidate}
        state={state}
        index={index}
        onConfirmToggle={onConfirmToggle}
        onOpenProfile={onOpenProfile}
      />
      <CardBody candidate={candidate} />
      <StatusVerdictButtons
        status={state.interview_status}
        verdict={state.verdict}
        onStatusChange={onStatusChange}
        onVerdictChange={onVerdictChange}
      />
      <Scorecard
        currentUser={currentUser}
        peterScores={state.peter_scores as Scores}
        ossamaScores={state.ossama_scores as Scores}
        onPeterChange={(scores) => onScoreChange('peter', scores)}
        onOssamaChange={(scores) => onScoreChange('ossama', scores)}
      />
      <Checklist
        candidateId={candidate.id}
        checklist={state.checklist as Record<string, boolean>}
        onChange={onChecklistChange}
      />
      <Comments
        candidateId={candidate.id}
        peterComment={state.peter_comment}
        ossamaComment={state.ossama_comment}
        onSavePeter={(c) => onCommentChange('peter', c)}
        onSaveOssama={(c) => onCommentChange('ossama', c)}
      />
      <CardActions
        isShortlisted={state.shortlisted}
        onShortlist={onShortlist}
        onReject={onReject}
        onViewProfile={onOpenProfile}
        onEmailDraft={onEmailDraft}
        auditLine={auditLine}
      />
    </div>
  )
}
