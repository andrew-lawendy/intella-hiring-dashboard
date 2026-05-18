interface BarItem {
  label: string
  value: number
  color?: string
}
interface HorizontalBarProps {
  data: BarItem[]
  maxVal?: number
  unit?: string
}

export function HorizontalBar({ data, maxVal, unit = '' }: HorizontalBarProps) {
  const max = maxVal ?? Math.max(...data.map((d) => d.value), 1)
  return (
    <div>
      {data.map((item, i) => (
        <div key={item.label} className="flex items-center gap-2.5 mb-2 last:mb-0">
          <span className="text-[11.5px] text-text w-36 flex-shrink-0 overflow-hidden text-ellipsis whitespace-nowrap font-medium">
            {item.label}
          </span>
          <div className="flex-1 h-5 bg-surface2 rounded-[6px] overflow-hidden relative border border-border">
            <div
              className="h-full rounded-[5px] transition-[width] duration-500"
              style={{
                width: `${Math.round((item.value / max) * 100)}%`,
                background: item.color ?? `oklch(0.55 0.12 ${(i * 40) % 360})`,
              }}
            />
            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[12px] font-semibold font-mono text-text2">
              {item.value}
              {unit}
            </span>
          </div>
        </div>
      ))}
    </div>
  )
}
