// src/components/analysis/DonutChart.tsx
import type { DonutSlice } from '@/lib/analytics'

interface DonutChartProps {
  slices: DonutSlice[]
  size?: number
  strokeWidth?: number
}

export function DonutChart({ slices, size = 120, strokeWidth = 14 }: DonutChartProps) {
  const r = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * r
  const total = slices.reduce((s, x) => s + x.value, 0) || 1

  let offset = 0
  const arcs = slices.map((slice) => {
    const pct = slice.value / total
    const dash = pct * circumference
    const arc = { ...slice, dash, gap: circumference - dash, offset }
    offset += dash
    return arc
  })

  return (
    <div className="flex items-center gap-4">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ flexShrink: 0 }}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="var(--border)"
          strokeWidth={strokeWidth}
        />
        {arcs.map((arc, i) => (
          <circle
            key={i}
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke={arc.color}
            strokeWidth={strokeWidth}
            strokeDasharray={`${arc.dash} ${arc.gap}`}
            strokeDashoffset={-arc.offset}
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
            strokeLinecap="butt"
          />
        ))}
      </svg>
      <div className="flex flex-col gap-1.5">
        {slices
          .filter((s) => s.value > 0)
          .map((slice) => (
            <div key={slice.label} className="flex items-center gap-2">
              <span
                className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                style={{ background: slice.color }}
              />
              <span className="text-[12px] text-text2">
                {slice.label}
                <span className="ml-1 font-semibold text-text">
                  ({Math.round((slice.value / total) * 100)}%)
                </span>
              </span>
            </div>
          ))}
      </div>
    </div>
  )
}
