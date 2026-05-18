import { Button } from '@/components/ui/button'

interface CardActionsProps {
  isShortlisted: boolean | null
  isConfirmed: boolean
  onShortlist: () => void
  onReject: () => void
  onCVDownload: () => void
  onConfirmToggle: () => void
  auditLine?: string
}

export function CardActions({
  isShortlisted,
  isConfirmed,
  onShortlist,
  onReject,
  onCVDownload,
  onConfirmToggle,
  auditLine,
}: CardActionsProps) {
  return (
    <div className="px-4 py-2.5 border-t border-border bg-surface2 flex gap-1.5 flex-wrap items-center">
      <Button size="xs" variant="outline" onClick={onCVDownload}>
        ⬇ CV
      </Button>
      <Button
        size="xs"
        variant={isShortlisted === true ? 'success' : 'outline'}
        onClick={onShortlist}
      >
        ★ {isShortlisted === true ? 'Shortlisted' : 'Shortlist'}
      </Button>
      <Button
        size="xs"
        variant={isShortlisted === false ? 'destructive' : 'outline'}
        onClick={onReject}
      >
        ✕ Reject
      </Button>
      <Button size="xs" variant={isConfirmed ? 'success' : 'outline'} onClick={onConfirmToggle}>
        {isConfirmed ? '✓ Confirmed' : 'Confirm'}
      </Button>
      {auditLine && <span className="ml-auto text-[11px] text-text3 truncate">{auditLine}</span>}
    </div>
  )
}
