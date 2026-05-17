import { CardHeader } from './CardHeader'
import { CardBody } from './CardBody'
import { CardActions } from './CardActions'
import { VERDICT_MAP } from '@/lib/verdicts'
import type { Database } from '@/lib/database.types'
import type { Scores } from '@/lib/scoring'
import { cn } from '@/lib/utils'

type Candidate = Database['public']['Tables']['candidates']['Row']
type State = Database['public']['Tables']['interview_state']['Row']

interface CandidateCardProps {
  candidate: Candidate
  state: State
  myScores: Scores
  coScores: Scores
  checklistItems?: string[]
  onConfirmToggle: () => void
  onShortlist: () => void
  onReject: () => void
  onCVDownload: () => void
  onOpenProfile: () => void
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
  myScores,
  coScores,
  checklistItems,
  onConfirmToggle,
  onShortlist,
  onReject,
  onCVDownload,
  onOpenProfile,
  auditLine,
}: CandidateCardProps) {
  const bannerKey =
    state.shortlisted === true
      ? 'shortlisted'
      : state.shortlisted === false
        ? 'rejected'
        : 'pending'
  const banner = STATUS_BANNER[bannerKey]

  // Combined score from both slots
  const allScores = { ...myScores, ...coScores }
  const totalRaw = Object.values(allScores).reduce((a: number, b) => a + (b as number), 0)
  const scoreCount = Object.values(allScores).filter((v) => (v as number) > 0).length
  const combined = scoreCount > 0 ? Math.round(totalRaw / 2) : 0
  const maxScore = (checklistItems?.length ?? 5) * 5 * 2
  const hasScore = combined > 0

  // Checklist progress
  const checklist = state.checklist as Record<string, boolean>
  const checklistItems_ = checklistItems ?? [
    'CV reviewed',
    'LinkedIn checked',
    'Questions prepared',
    'Salary discussed',
    'Notice period confirmed',
  ]
  const checksTotal = checklistItems_.length
  const checksDone = checklistItems_.filter((item) => checklist?.[item]).length

  const verdict = state.verdict
  const verdictInfo = verdict ? VERDICT_MAP[verdict] : null

  return (
    <div
      className={cn(
        'bg-surface border rounded-[var(--radius)] overflow-hidden flex flex-col transition-all duration-150 shadow-[var(--shadow-sm)]',
        'hover:-translate-y-0.5 hover:shadow-[var(--shadow-md)] hover:border-border-strong',
        state.shortlisted === true
          ? 'border-[var(--green-line)] shadow-[0_0_0_1px_var(--green-line),var(--shadow-sm)]'
          : 'border-border',
        state.shortlisted === false ? 'opacity-70 hover:opacity-95' : '',
      )}
    >
      {banner && (
        <div
          className={`px-4 py-1.5 text-[10.5px] font-semibold uppercase tracking-[0.08em] flex items-center gap-1.5 ${banner.cls}`}
        >
          {banner.label}
        </div>
      )}

      <CardHeader
        candidate={candidate}
        state={state}
        onConfirmToggle={onConfirmToggle}
        onOpenProfile={onOpenProfile}
      />
      <CardBody candidate={candidate} />

      <CardActions
        isShortlisted={state.shortlisted}
        isConfirmed={state.confirmed}
        onShortlist={onShortlist}
        onReject={onReject}
        onCVDownload={onCVDownload}
        onConfirmToggle={onConfirmToggle}
        auditLine={auditLine}
      />

      {/* Compact footer — entry point to full profile */}
      <button
        type="button"
        onClick={onOpenProfile}
        className="flex items-center justify-between gap-2.5 w-full px-4 py-3 bg-muted/50 border-t border-border text-left cursor-pointer hover:bg-muted transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
      >
        <span className="flex items-center gap-2 flex-wrap text-[11.5px] font-medium text-muted-foreground">
          {hasScore ? (
            <span className="flex items-center gap-1 text-foreground">
              <span className="text-[var(--amber)]">★</span>
              {combined}/{maxScore}
            </span>
          ) : (
            <span className="italic text-muted-foreground/70 font-normal">Not scored</span>
          )}
          <span className="w-1 h-1 rounded-full bg-border flex-shrink-0" aria-hidden="true" />
          <span>
            {checksDone}/{checksTotal} checks
          </span>
          {verdictInfo && (
            <>
              <span className="w-1 h-1 rounded-full bg-border flex-shrink-0" aria-hidden="true" />
              <span
                className="text-[10.5px] font-semibold uppercase tracking-[0.05em] px-2 py-0.5 rounded-full"
                style={{
                  background: `color-mix(in srgb, ${verdictInfo.color} 12%, transparent)`,
                  color: verdictInfo.color,
                }}
              >
                {verdictInfo.label}
              </span>
            </>
          )}
        </span>
        <span className="flex items-center gap-1 text-[11.5px] font-medium text-primary flex-shrink-0">
          Open profile
          <span className="inline-block transition-transform group-hover:translate-x-0.5">→</span>
        </span>
      </button>
    </div>
  )
}
