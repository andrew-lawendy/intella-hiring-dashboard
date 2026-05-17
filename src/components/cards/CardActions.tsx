import { Button } from '@/components/ui/button'

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
      <Button size="sm" variant="default" onClick={onViewProfile}>
        📄 View Profile
      </Button>
      <Button size="sm" variant="outline" onClick={onEmailDraft}>
        ⬇ CV
      </Button>
      <Button
        size="sm"
        variant={isShortlisted === true ? 'success' : 'outline'}
        onClick={onShortlist}
      >
        ★ {isShortlisted === true ? 'Shortlisted' : 'Shortlist'}
      </Button>
      <Button
        size="sm"
        variant={isShortlisted === false ? 'destructive' : 'outline'}
        onClick={onReject}
      >
        ✕ Reject
      </Button>
      {auditLine && <span className="ml-auto text-[10px] text-text3 truncate">{auditLine}</span>}
    </div>
  )
}
