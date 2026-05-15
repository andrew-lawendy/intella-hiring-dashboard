import type { Database } from '@/lib/database.types'

type Candidate = Database['public']['Tables']['candidates']['Row']
type State = Database['public']['Tables']['interview_state']['Row']

const AVATAR_GRADIENTS = [
  'linear-gradient(135deg, oklch(0.72 0.12 250), oklch(0.5 0.14 270))',
  'linear-gradient(135deg, oklch(0.75 0.1 145), oklch(0.55 0.12 160))',
  'linear-gradient(135deg, oklch(0.78 0.1 25), oklch(0.58 0.14 15))',
  'linear-gradient(135deg, oklch(0.82 0.12 80), oklch(0.62 0.14 60))',
  'linear-gradient(135deg, oklch(0.72 0.12 300), oklch(0.5 0.15 290))',
  'linear-gradient(135deg, oklch(0.75 0.1 195), oklch(0.55 0.12 210))',
  'linear-gradient(135deg, oklch(0.78 0.08 90), oklch(0.55 0.1 70))',
]

function initials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase()
}

function avatarGradient(index: number): string {
  return AVATAR_GRADIENTS[index % AVATAR_GRADIENTS.length]
}

interface CardHeaderProps {
  candidate: Candidate
  state: State
  index: number
  onConfirmToggle: () => void
  onOpenProfile: () => void
}

export function CardHeader({
  candidate,
  state,
  index,
  onConfirmToggle,
  onOpenProfile,
}: CardHeaderProps) {
  return (
    <div className="px-4 pb-3 pt-3.5 border-b border-border flex items-start gap-3 bg-gradient-to-b from-surface to-[color-mix(in_srgb,var(--surface2)_30%,var(--surface))]">
      <div
        className="w-10 h-10 rounded-full flex items-center justify-center text-[13px] font-semibold text-white flex-shrink-0 cursor-pointer"
        style={{
          background: avatarGradient(index),
          boxShadow: '0 1px 0 rgba(255,255,255,.4) inset, 0 1px 2px rgba(0,0,0,.06)',
        }}
        onClick={onOpenProfile}
      >
        {state.photo_url ? (
          <img
            src={state.photo_url}
            alt={candidate.name}
            className="w-full h-full rounded-full object-cover"
          />
        ) : (
          initials(candidate.name)
        )}
      </div>

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
