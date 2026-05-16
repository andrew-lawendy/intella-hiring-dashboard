interface PaginationProps {
  page: number
  pageSize: number
  total: number
  onChange: (page: number) => void
}

export function Pagination({ page, pageSize, total, onChange }: PaginationProps) {
  const totalPages = Math.ceil(total / pageSize)
  if (totalPages <= 1) return null

  const from = (page - 1) * pageSize + 1
  const to = Math.min(page * pageSize, total)

  return (
    <div className="flex items-center justify-between mt-6 px-1">
      <span className="text-[12px] text-text3">
        {from}–{to} of {total}
      </span>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onChange(page - 1)}
          disabled={page <= 1}
          className="px-3 py-1.5 rounded-[var(--radius-xs)] border border-border text-[12px] text-text2 bg-surface hover:bg-surface2 hover:text-text transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
        >
          ← Prev
        </button>
        {Array.from({ length: totalPages }, (_, i) => i + 1)
          .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
          .reduce<(number | '…')[]>((acc, p, idx, arr) => {
            if (idx > 0 && p - (arr[idx - 1] as number) > 1) acc.push('…')
            acc.push(p)
            return acc
          }, [])
          .map((p, i) =>
            p === '…' ? (
              <span key={`ellipsis-${i}`} className="px-2 text-text3 text-[12px]">
                …
              </span>
            ) : (
              <button
                key={p}
                onClick={() => onChange(p as number)}
                className={[
                  'w-8 h-8 rounded-[var(--radius-xs)] text-[12px] border transition-colors cursor-pointer',
                  p === page
                    ? 'bg-text text-bg border-text font-semibold'
                    : 'bg-surface border-border text-text2 hover:bg-surface2 hover:text-text',
                ].join(' ')}
              >
                {p}
              </button>
            ),
          )}
        <button
          onClick={() => onChange(page + 1)}
          disabled={page >= totalPages}
          className="px-3 py-1.5 rounded-[var(--radius-xs)] border border-border text-[12px] text-text2 bg-surface hover:bg-surface2 hover:text-text transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
        >
          Next →
        </button>
      </div>
    </div>
  )
}
