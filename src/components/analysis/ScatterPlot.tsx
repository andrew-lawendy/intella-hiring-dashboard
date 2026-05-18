interface ScatterPoint {
  id: string
  name: string
  x: number
  y: number
  color?: string
}
interface ScatterPlotProps {
  points: ScatterPoint[]
  xLabel: string
  yLabel: string
}

export function ScatterPlot({ points, xLabel, yLabel }: ScatterPlotProps) {
  const maxX = Math.max(...points.map((p) => p.x), 1)
  const maxY = Math.max(...points.map((p) => p.y), 1)

  return (
    <div>
      <div className="relative h-[280px] bg-gradient-to-br from-surface2 to-surface rounded-[var(--radius-sm)] overflow-hidden border border-border">
        {points.map((pt) => {
          const left = Math.round((pt.x / maxX) * 88) + 4
          const bottom = Math.round((pt.y / maxY) * 88) + 4
          return (
            <div
              key={pt.id}
              title={`${pt.name} — ${xLabel}: ${pt.x}, ${yLabel}: ${pt.y}`}
              className="absolute w-7 h-7 rounded-full flex items-center justify-center text-[8.5px] font-semibold text-white cursor-pointer transition-all duration-200 hover:scale-150 hover:z-10 border-2 border-white/40 shadow-[0_2px_8px_rgba(0,0,0,0.15)]"
              style={{
                left: `${left}%`,
                bottom: `${bottom}%`,
                background: pt.color ?? 'var(--brand)',
              }}
            >
              {pt.name
                .split(' ')
                .map((w) => w[0])
                .slice(0, 2)
                .join('')}
            </div>
          )
        })}
        <div className="absolute bottom-1 left-1/2 -translate-x-1/2 text-[12px] text-text3">
          {xLabel}
        </div>
        <div className="absolute top-1/2 left-1 -translate-y-1/2 -rotate-90 text-[12px] text-text3">
          {yLabel}
        </div>
      </div>
    </div>
  )
}
