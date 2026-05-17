import { useState } from 'react'
import {
  type ColumnDef,
  type SortingState,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table'
import { ChevronDown, ChevronUp, ChevronsUpDown } from 'lucide-react'

import { cn } from '@/lib/utils'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { TablePagination } from '@/components/ui/table-pagination'

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  pageSize?: number
  loading?: boolean
  emptyMessage?: string
  sortable?: boolean
  onRowClick?: (row: TData) => void
  rowClassName?: (row: TData) => string
  className?: string
}

export function DataTable<TData, TValue>({
  columns,
  data,
  pageSize = 20,
  loading = false,
  emptyMessage = 'No results found.',
  sortable = false,
  onRowClick,
  rowClassName,
  className,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = useState<SortingState>([])
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize })

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: sortable ? getSortedRowModel() : undefined,
    enableSorting: sortable,
    onSortingChange: setSorting,
    onPaginationChange: setPagination,
    state: { sorting, pagination },
  })

  return (
    <div className={cn('flex flex-col gap-3', className)}>
      <div className="bg-muted rounded-lg overflow-x-auto">
        <Table className="w-full shrink-0">
          <TableHeader>
            {table.getHeaderGroups().map((hg) => (
              <TableRow key={hg.id} className="border-none hover:bg-transparent">
                {hg.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    className={cn(
                      'text-muted-foreground px-4 py-3 text-sm font-semibold group',
                      header.column.getCanSort() && 'cursor-pointer select-none hover:bg-muted/80',
                    )}
                    onClick={header.column.getToggleSortingHandler()}
                    style={{ width: header.getSize() !== 150 ? header.getSize() : undefined }}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span>
                        {header.isPlaceholder
                          ? null
                          : flexRender(header.column.columnDef.header, header.getContext())}
                      </span>
                      {header.column.getCanSort() && (
                        <span className="inline-flex opacity-0 transition-opacity group-hover:opacity-100">
                          {header.column.getIsSorted() === 'desc' ? (
                            <ChevronDown className="size-4" />
                          ) : header.column.getIsSorted() === 'asc' ? (
                            <ChevronUp className="size-4" />
                          ) : (
                            <ChevronsUpDown className="size-4 text-muted-foreground/50" />
                          )}
                        </span>
                      )}
                    </div>
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
        </Table>

        <div className="rounded-t-3xl bg-white dark:bg-card overflow-y-auto">
          <Table className="w-full">
            <TableBody>
              {loading ? (
                Array.from({ length: pageSize }).map((_, i) => (
                  <TableRow key={i} className="hover:bg-transparent">
                    {columns.map((_, ci) => (
                      <TableCell key={ci} className="px-4 py-3">
                        <div className="bg-muted h-8 w-full animate-pulse rounded" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : table.getRowModel().rows.length > 0 ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    className={cn(
                      'transition-colors',
                      onRowClick && 'cursor-pointer',
                      rowClassName?.(row.original),
                    )}
                    onClick={() => onRowClick?.(row.original)}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell
                        key={cell.id}
                        className="px-4 py-3 text-sm"
                        style={{
                          width: cell.column.getSize() !== 150 ? cell.column.getSize() : undefined,
                        }}
                      >
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow className="hover:bg-transparent">
                  <TableCell
                    colSpan={columns.length}
                    className="px-4 py-8 text-center text-sm text-muted-foreground"
                  >
                    {emptyMessage}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <TablePagination
        page={pagination.pageIndex + 1}
        pageSize={pageSize}
        total={data.length}
        onChange={(p) => setPagination((prev) => ({ ...prev, pageIndex: p - 1 }))}
      />
    </div>
  )
}

export type { DataTableProps }
