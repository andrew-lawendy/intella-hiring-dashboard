interface CardActionsProps {
  isShortlisted: boolean | null
  onShortlist: () => void
  onReject: () => void
  onViewProfile: () => void
  onEmailDraft: () => void
  auditLine?: string
}

export function CardActions({
  isShortlisted,
  onShortlist,
  onReject,
  onViewProfile,
  onEmailDraft,
  auditLine,
}: CardActionsProps) {
  return (
    <div className="px-4 py-2.5 border-t border-border bg-surface2 flex gap-1.5 flex-wrap items-center">
      <button
        onClick={onShortlist}
        className="text-[11.5px] font-medium px-2.5 py-1 rounded-[var(--radius-sm)] border border-[var(--green-line)] text-[var(--green)] bg-surface cursor-pointer hover:bg-[var(--green)] hover:text-white hover:border-[var(--green)] transition-all"
      >
        {isShortlisted ? '★ Shortlisted' : 'Shortlist'}
      </button>
      <button
        onClick={onReject}
        className="text-[11.5px] font-medium px-2.5 py-1 rounded-[var(--radius-sm)] border border-[var(--red-line)] text-[var(--red)] bg-surface cursor-pointer hover:bg-[var(--red)] hover:text-white hover:border-[var(--red)] transition-all"
      >
        Reject
      </button>
      <button
        onClick={onViewProfile}
        className="text-[11.5px] font-medium px-2.5 py-1 rounded-[var(--radius-sm)] border border-border text-text bg-surface cursor-pointer hover:bg-text hover:text-bg hover:border-text transition-all"
      >
        Profile
      </button>
      <button
        onClick={onEmailDraft}
        className="text-[11.5px] font-medium px-2.5 py-1 rounded-[var(--radius-sm)] border border-border text-text2 bg-transparent cursor-pointer hover:bg-surface3 hover:text-text transition-all"
      >
        Email
      </button>
      {auditLine && <span className="ml-auto text-[10px] text-text3 truncate">{auditLine}</span>}
    </div>
  )
}
