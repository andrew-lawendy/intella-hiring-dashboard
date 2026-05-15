import { useState } from 'react'
import type { RankingEntry } from '@/lib/analytics'
import { maxScore } from '@/lib/scoring'

interface RankingTableProps {
  entries: RankingEntry[]
  nameMap: Record<string, string>
}

const VERDICT_COLORS: Record<string, string> = {
  'strong-yes': 'var(--green)',
  yes: 'var(--blue)',
  maybe: 'var(--amber)',
  no: 'var(--red)',
}

const VERDICT_LABELS: Record<string, string> = {
  'strong-yes': '⭐ Strong Yes',
  yes: '✓ Yes',
  maybe: '? Maybe',
  no: '✗ No',
}

export function RankingTable({ entries, nameMap }: RankingTableProps) {
  type SortKey = 'rank' | 'name' | 'combined' | 'verdict'
  const [sort, setSort] = useState<SortKey>('rank')
  const max = maxScore()

  const sorted = [...entries].sort((a, b) => {
    if (sort === 'name')
      return (nameMap[a.candidateId] ?? '').localeCompare(nameMap[b.candidateId] ?? '')
    if (sort === 'combined') return b.combinedScore - a.combinedScore
    if (sort === 'verdict') return (a.verdict ?? 'z').localeCompare(b.verdict ?? 'z')
    return b.combinedScore - a.combinedScore
  })

  const thCls =
    'text-left px-3 py-2.5 bg-surface2 border-b border-border text-[10.5px] font-medium uppercase tracking-[0.06em] text-text3 whitespace-nowrap cursor-pointer select-none hover:text-text transition-colors'
  const tdCls = 'px-3 py-2.5 border-b border-border align-middle'

  return (
    <div className="overflow-x-auto rounded-[var(--radius)] border border-border shadow-[var(--shadow-sm)]">
      <table className="w-full border-collapse text-[12px]">
        <thead>
          <tr>
            {[
              { key: 'rank' as SortKey, label: '#' },
              { key: 'name' as SortKey, label: 'Candidate' },
              { key: 'combined' as SortKey, label: 'Combined Score' },
              { key: 'rank' as SortKey, label: 'Peter' },
              { key: 'rank' as SortKey, label: 'Ossama' },
              { key: 'verdict' as SortKey, label: 'Verdict' },
            ].map((col, i) => (
              <th key={i} className={thCls} onClick={() => setSort(col.key)}>
                {col.label} {sort === col.key ? '↓' : ''}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sorted.map((entry, i) => (
            <tr key={entry.candidateId} className="hover:bg-surface2 transition-colors">
              <td className={`${tdCls} font-mono text-text3 text-[11px]`}>{i + 1}</td>
              <td className={`${tdCls} font-semibold text-text`}>
                {nameMap[entry.candidateId] ?? entry.candidateId}
              </td>
              <td className={`${tdCls} font-mono font-bold text-green`}>
                {entry.combinedScore || '—'}/{max}
              </td>
              <td className={`${tdCls} font-mono text-purple`}>
                {entry.peterScore || '—'}/{max}
              </td>
              <td className={`${tdCls} font-mono text-blue`}>
                {entry.ossamaScore || '—'}/{max}
              </td>
              <td className={tdCls}>
                {entry.verdict && (
                  <span
                    className="text-[11px] font-semibold"
                    style={{ color: VERDICT_COLORS[entry.verdict] ?? 'var(--text3)' }}
                  >
                    {VERDICT_LABELS[entry.verdict] ?? entry.verdict}
                  </span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
