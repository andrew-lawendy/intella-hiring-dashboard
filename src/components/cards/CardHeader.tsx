import type { Database } from '@/lib/database.types'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'

type Candidate = Database['public']['Tables']['candidates']['Row']
type State = Database['public']['Tables']['interview_state']['Row']

interface CardHeaderProps {
  candidate: Candidate
  state: State
  onConfirmToggle: () => void
  onOpenProfile: () => void
}

export function CardHeader({ candidate, state, onConfirmToggle, onOpenProfile }: CardHeaderProps) {
  return (
    <div className="px-4 pb-3 pt-3.5 border-b border-border flex items-start gap-3 bg-gradient-to-b from-surface to-[color-mix(in_srgb,var(--surface2)_30%,var(--surface))]">
      <Avatar size="sm" className="flex-shrink-0 cursor-pointer" onClick={onOpenProfile}>
        {state.photo_url && <AvatarImage src={state.photo_url} alt={candidate.name} />}
        <AvatarFallback name={candidate.name} />
      </Avatar>

      <div className="flex-1 min-w-0">
        <button
          className="text-[14.5px] font-semibold tracking-[-0.015em] text-text text-left hover:text-brand transition-colors cursor-pointer bg-transparent border-none p-0"
          onClick={onOpenProfile}
        >
          {candidate.name}
        </button>
        <p className="text-[11.5px] text-text2 mt-0.5 truncate">{candidate.email}</p>
        <div className="flex gap-1 flex-wrap mt-1.5">
          <span
            className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${state.confirmed ? 'bg-[var(--green-bg)] text-[var(--green)] border-[var(--green-line)]' : 'bg-[var(--amber-bg)] text-[var(--amber)] border-[var(--amber-line)]'}`}
          >
            {state.confirmed ? 'Confirmed' : 'Pending'}
          </span>
          {candidate.type === 'Remote' && (
            <span className="text-[10px] font-medium px-2 py-0.5 rounded-full border bg-[var(--blue-bg)] text-[var(--blue)] border-[var(--blue-line)]">
              Remote
            </span>
          )}
        </div>
      </div>

      <button
        onClick={onConfirmToggle}
        className={`text-[11px] font-medium px-2.5 py-1 rounded-full border cursor-pointer transition-all duration-150 flex-shrink-0 ${
          state.confirmed
            ? 'bg-[var(--green-bg)] text-[var(--green)] border-[var(--green-line)] hover:bg-[var(--red-bg)] hover:text-[var(--red)] hover:border-[var(--red-line)]'
            : 'bg-[var(--amber-bg)] text-[var(--amber)] border-[var(--amber-line)] hover:bg-[var(--amber)] hover:text-white hover:border-[var(--amber)]'
        }`}
      >
        {state.confirmed ? 'Confirmed' : 'Pending'}
      </button>
    </div>
  )
}
