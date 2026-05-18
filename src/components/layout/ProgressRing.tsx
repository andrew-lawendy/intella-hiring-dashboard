interface ProgressRingProps {
  done: number
  total: number
}

export function ProgressRing({ done, total }: ProgressRingProps) {
  const pct = total > 0 ? Math.round((done / total) * 100) : 0
  const r = 18
  const circ = 2 * Math.PI * r
  const offset = circ - (pct / 100) * circ

  return (
    <div className="flex items-center gap-2" title={`${done}/${total} interviews completed`}>
      <svg width="44" height="44" viewBox="0 0 44 44">
        <circle cx="22" cy="22" r={r} fill="none" stroke="var(--border)" strokeWidth="4" />
        <circle
          cx="22"
          cy="22"
          r={r}
          fill="none"
          stroke="var(--green)"
          strokeWidth="4"
          strokeLinecap="round"
          transform="rotate(-90 22 22)"
          style={{
            strokeDasharray: circ,
            strokeDashoffset: offset,
            transition: 'stroke-dashoffset 0.5s',
          }}
        />
        <text
          x="22"
          y="26"
          textAnchor="middle"
          fontSize="9"
          fontWeight="700"
          fill="var(--text)"
          fontFamily="DM Mono, monospace"
        >
          {pct}%
        </text>
      </svg>
      <div className="text-[12px] text-text2 leading-tight">
        <div className="font-semibold text-text">
          {done}/{total}
        </div>
        <div>done</div>
      </div>
    </div>
  )
}
