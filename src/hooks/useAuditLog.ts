import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import type { Database } from '@/lib/database.types'

type AuditEntry = Database['public']['Tables']['audit_log']['Row']

const PAGE_SIZE = 20

const FIELD_LABELS: Record<string, string> = {
  verdict: 'Verdict',
  shortlisted: 'Shortlisted',
  interview_status: 'Status',
  confirmed: 'Confirmation',
  peter_scores: 'Peter scores',
  ossama_scores: 'Ossama scores',
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
  const [entries, setEntries] = useState<AuditEntry[]>([])
  const [loading, setLoading] = useState(false)
  const [hasMore, setHasMore] = useState(false)

  useEffect(() => {
    if (!candidateId) {
      setEntries([])
      setHasMore(false)
      return
    }

    setLoading(true)

    supabase
      .from('audit_log')
      .select('*')
      .eq('candidate_id', candidateId)
      .order('created_at', { ascending: false })
      .limit(PAGE_SIZE)
      .then(({ data }) => {
        const rows = data ?? []
        setEntries(rows)
        setHasMore(rows.length === PAGE_SIZE)
        setLoading(false)
      })
  }, [candidateId])

  const loadMore = useCallback(() => {
    const cursor = entries[entries.length - 1]?.created_at
    if (!cursor || !candidateId) return

    setLoading(true)

    supabase
      .from('audit_log')
      .select('*')
      .eq('candidate_id', candidateId)
      .order('created_at', { ascending: false })
      .lt('created_at', cursor)
      .limit(PAGE_SIZE)
      .then(({ data }) => {
        const rows = data ?? []
        setEntries((prev) => [...prev, ...rows])
        setHasMore(rows.length === PAGE_SIZE)
        setLoading(false)
      })
  }, [candidateId, entries])

  return { entries, loading, hasMore, loadMore }
}
