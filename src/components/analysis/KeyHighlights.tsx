// src/components/analysis/KeyHighlights.tsx
import type { Highlight } from '@/lib/analytics'

interface KeyHighlightsProps {
  highlights: Highlight[]
}

export function KeyHighlights({ highlights }: KeyHighlightsProps) {
  return (
    <div
      className="grid gap-3"
      style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}
    >
      {highlights.map((h) => (
        <div
          key={h.title}
          className="bg-surface border border-border rounded-[var(--radius)] p-4 shadow-[var(--shadow-sm)]"
        >
          <p className="text-[11.5px] font-semibold uppercase tracking-[0.06em] text-text3 mb-1">
            {h.title}
          </p>
          <p className="text-[15px] font-semibold text-text leading-tight">{h.value}</p>
          {h.sub && <p className="text-[12px] text-text2 mt-1">{h.sub}</p>}
        </div>
      ))}
    </div>
  )
}
