import { useInfiniteQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Database } from '@/lib/database.types'

type AuditEntry = Database['public']['Tables']['audit_log']['Row']

const PAGE_SIZE = 20

const FIELD_LABELS: Record<string, string> = {
  verdict: 'Verdict',
  shortlisted: 'Shortlisted',
  interview_status: 'Status',
  confirmed: 'Confirmation',
}

export function formatAuditEntry(
  entry: Pick<AuditEntry, 'field' | 'old_value' | 'new_value' | 'changed_by' | 'created_at'>,
): string {
  const label = FIELD_LABELS[entry.field] ?? entry.field
  const by = entry.changed_by.split('@')[0]
  const val = entry.new_value ?? 'cleared'
  return `${label} set to "${val}" by ${by}`
}

export function useAuditLog(candidateId: string | null) {
  const {
    data,
    isLoading: loading,
    isFetchingNextPage,
    hasNextPage: hasMore,
    fetchNextPage: loadMore,
  } = useInfiniteQuery({
    queryKey: ['audit-log', candidateId],
    queryFn: async ({ pageParam }) => {
      let query = supabase
        .from('audit_log')
        .select('*')
        .eq('candidate_id', candidateId!)
        .order('created_at', { ascending: false })
        .limit(PAGE_SIZE)

      if (pageParam) {
        query = query.lt('created_at', pageParam)
      }

      const { data: rows } = await query
      return (rows ?? []) as AuditEntry[]
    },
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => {
      if (lastPage.length < PAGE_SIZE) return undefined
      return lastPage[lastPage.length - 1].created_at
    },
    enabled: !!candidateId,
  })

  const entries = data?.pages.flat() ?? []

  return { entries, loading, loadingMore: isFetchingNextPage, hasMore: !!hasMore, loadMore }
}
