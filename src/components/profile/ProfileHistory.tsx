import { useAuditLog, formatAuditEntry } from '@/hooks/useAuditLog'
import { Button } from '@/components/ui/button'

interface ProfileHistoryProps {
  candidateId: string
}

export function ProfileHistory({ candidateId }: ProfileHistoryProps) {
  const { entries, loading, loadingMore, hasMore, loadMore } = useAuditLog(candidateId)

  if (loading && entries.length === 0) {
    return <div className="p-6 text-text3 text-sm">Loading history...</div>
  }

  if (!entries.length) {
    return <div className="p-6 text-text3 text-sm">No changes recorded yet.</div>
  }

  return (
    <div className="p-6 overflow-y-auto max-h-[calc(80vh-120px)]">
      <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-text3 mb-4">
        Decision History
      </p>
      <div className="flex flex-col gap-2">
        {entries.map((entry) => (
          <div
            key={entry.id}
            className="flex items-start gap-3 text-xs py-2.5 border-b border-border last:border-b-0"
          >
            <div className="w-1.5 h-1.5 rounded-full bg-brand mt-1.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-text">{formatAuditEntry(entry)}</p>
              <p className="text-text3 mt-0.5 font-mono text-[11px]">
                {new Date(entry.created_at).toLocaleString()}
              </p>
            </div>
          </div>
        ))}
      </div>

      {hasMore && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => loadMore()}
          disabled={loadingMore}
          className="mt-4 w-full"
        >
          {loadingMore ? 'Loading…' : 'Load more'}
        </Button>
      )}
    </div>
  )
}
