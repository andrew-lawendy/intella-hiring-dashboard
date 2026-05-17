import { useState } from 'react'
import { Scorecard } from '@/components/cards/Scorecard'
import { Comments } from '@/components/cards/Comments'
import { StatusVerdictButtons } from '@/components/cards/StatusVerdictButtons'
import { Checklist } from '@/components/cards/Checklist'
import { cn } from '@/lib/utils'
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

type SubTab = 'scores' | 'summary'

export function ProfileScore({
  state,
  candidateId,
  scoreCategories,
  checklistItems,
  onChecklistChange,
  onVerdictChange,
  onStatusChange,
}: ProfileScoreProps) {
  const [subTab, setSubTab] = useState<SubTab>('scores')

  return (
    <div className="divide-y divide-border">
      {/* Status & Verdict */}
      {onStatusChange && onVerdictChange && (
        <StatusVerdictButtons
          status={state.interview_status}
          verdict={state.verdict}
          onStatusChange={onStatusChange}
          onVerdictChange={onVerdictChange}
        />
      )}

      {/* Scorecard with sub-tabs */}
      <div>
        {/* Sub-tab strip */}
        <div className="flex border-b border-border px-4">
          {(['scores', 'summary'] as SubTab[]).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setSubTab(t)}
              className={cn(
                'px-3 py-2.5 text-[12.5px] font-medium capitalize border-b-2 -mb-px transition-colors cursor-pointer',
                subTab === t
                  ? 'text-primary border-primary'
                  : 'text-muted-foreground border-transparent hover:text-foreground',
              )}
            >
              {t}
            </button>
          ))}
        </div>

        <Scorecard
          candidateId={candidateId}
          scoreCategories={scoreCategories}
          activeSubTab={subTab}
        />
      </div>

      {/* Checklist */}
      <Checklist
        candidateId={candidateId}
        checklist={state.checklist as Record<string, boolean>}
        items={checklistItems}
        onChange={onChecklistChange ?? (() => {})}
      />

      {/* Comments */}
      <Comments candidateId={candidateId} />
    </div>
  )
}
