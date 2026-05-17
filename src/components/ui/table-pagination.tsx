import { useMemo } from 'react'
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Ellipsis } from 'lucide-react'

import { cn } from '@/lib/utils'
import { buttonVariants } from '@/components/ui/button'

interface TablePaginationProps {
  page: number
  pageSize: number
  total: number
  onChange: (page: number) => void
  className?: string
}

function buildPageRange(currentPage: number, totalPages: number): (number | 'ellipsis')[] {
  if (totalPages <= 5) {
    return Array.from({ length: totalPages }, (_, i) => i + 1)
  }

  const range = new Set([1, totalPages])
  for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
    range.add(i)
  }

  const sorted = [...range].sort((a, b) => a - b)
  const result: (number | 'ellipsis')[] = []
  sorted.forEach((p, idx) => {
    if (idx > 0 && p - sorted[idx - 1] > 1) result.push('ellipsis')
    result.push(p)
  })
  return result
}

function PaginationBtn({
  onClick,
  disabled,
  isActive,
  children,
  'aria-label': ariaLabel,
}: {
  onClick: () => void
  disabled: boolean
  isActive?: boolean
  children: React.ReactNode
  'aria-label'?: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      aria-current={isActive ? 'page' : undefined}
      className={cn(
        buttonVariants({ variant: isActive ? 'default' : 'outline', size: 'xs' }),
        'rounded-sm',
        disabled && 'pointer-events-none opacity-40',
      )}
    >
      {children}
    </button>
  )
}

function TablePagination({ page, pageSize, total, onChange, className }: TablePaginationProps) {
  const totalPages = Math.ceil(total / pageSize)

  const pages = useMemo(() => buildPageRange(page, totalPages), [page, totalPages])

  if (totalPages <= 1) return null

  const from = (page - 1) * pageSize + 1
  const to = Math.min(page * pageSize, total)

  return (
    <nav
      role="navigation"
      aria-label="pagination"
      className={cn(
        'flex items-center justify-between border-t border-border pt-3 mt-2',
        className,
      )}
    >
      <span className="text-[11px] text-muted-foreground font-mono">
        {from}–{to} of {total}
      </span>

      <ul className="flex flex-row items-center gap-1">
        <li>
          <PaginationBtn
            onClick={() => onChange(1)}
            disabled={page === 1}
            aria-label="Go to first page"
          >
            <ChevronsLeft className="size-3" />
          </PaginationBtn>
        </li>
        <li>
          <PaginationBtn
            onClick={() => onChange(page - 1)}
            disabled={page === 1}
            aria-label="Go to previous page"
          >
            <ChevronLeft className="size-3" />
          </PaginationBtn>
        </li>

        {pages.map((p, i) =>
          p === 'ellipsis' ? (
            <li key={`ellipsis-${i}`}>
              <span className="flex size-6 items-center justify-center">
                <Ellipsis className="size-3 text-muted-foreground" />
              </span>
            </li>
          ) : (
            <li key={p}>
              <PaginationBtn onClick={() => onChange(p)} disabled={false} isActive={p === page}>
                {p}
              </PaginationBtn>
            </li>
          ),
        )}

        <li>
          <PaginationBtn
            onClick={() => onChange(page + 1)}
            disabled={page === totalPages}
            aria-label="Go to next page"
          >
            <ChevronRight className="size-3" />
          </PaginationBtn>
        </li>
        <li>
          <PaginationBtn
            onClick={() => onChange(totalPages)}
            disabled={page === totalPages}
            aria-label="Go to last page"
          >
            <ChevronsRight className="size-3" />
          </PaginationBtn>
        </li>
      </ul>
    </nav>
  )
}

export { TablePagination }
