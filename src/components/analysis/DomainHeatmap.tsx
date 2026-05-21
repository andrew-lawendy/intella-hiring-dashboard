// src/components/analysis/DomainHeatmap.tsx
import type { HeatmapData } from '@/lib/analytics'

interface DomainHeatmapProps {
  data: HeatmapData
}

export function DomainHeatmap({ data }: DomainHeatmapProps) {
  if (data.domains.length === 0) {
    return <p className="text-[12px] text-text3">No domain data available.</p>
  }

  return (
    <div className="overflow-x-auto">
      <table className="text-[11px] border-collapse">
        <thead>
          <tr>
            <th className="text-left font-medium text-text3 pr-3 pb-1 whitespace-nowrap w-28">
              Candidate
            </th>
            {data.domains.map((dom) => (
              <th
                key={dom}
                className="font-medium text-text3 pb-1 px-1 whitespace-nowrap"
                style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)', maxWidth: 20 }}
              >
                {dom}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.candidateNames.map((name, ri) => (
            <tr key={name} className="group">
              <td className="pr-3 py-0.5 text-text2 font-medium whitespace-nowrap group-hover:text-text transition-colors">
                {name}
              </td>
              {data.grid[ri].map((covered, ci) => (
                <td key={ci} className="px-0.5 py-0.5">
                  <div
                    className="w-4 h-4 rounded-[3px] transition-opacity"
                    style={{
                      background: covered ? 'var(--brand)' : 'var(--surface2)',
                      opacity: covered ? 1 : 0.4,
                    }}
                    title={covered ? `${name} · ${data.domains[ci]}` : undefined}
                  />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
