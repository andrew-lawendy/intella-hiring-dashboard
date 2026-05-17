import { useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'

const TOTAL_SECONDS = 3600

export function InterviewTimer() {
  const [seconds, setSeconds] = useState(TOTAL_SECONDS)
  const [running, setRunning] = useState(false)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (running && seconds > 0) {
      intervalRef.current = setInterval(() => setSeconds((s) => s - 1), 1000)
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [running, seconds])

  const fmt = (s: number) => {
    const m = Math.floor(s / 60)
    const sec = s % 60
    return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
  }

  const color = seconds < 300 ? 'var(--red)' : seconds < 600 ? 'var(--amber)' : 'var(--green)'
  const circ = 2 * Math.PI * 52
  const offset = circ * (1 - seconds / TOTAL_SECONDS)

  return (
    <div className="flex items-center gap-4">
      <div className="relative w-16 h-16">
        <svg width="64" height="64" viewBox="0 0 120 120">
          <circle cx="60" cy="60" r="52" fill="none" stroke="var(--surface3)" strokeWidth="8" />
          <circle
            cx="60"
            cy="60"
            r="52"
            fill="none"
            stroke={color}
            strokeWidth="8"
            strokeLinecap="round"
            transform="rotate(-90 60 60)"
            style={{
              strokeDasharray: circ,
              strokeDashoffset: offset,
              transition: 'stroke-dashoffset 1s linear',
            }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="font-mono text-[13px] font-semibold" style={{ color }}>
            {fmt(seconds)}
          </span>
        </div>
      </div>
      <div className="flex gap-1.5">
        <Button size="xs" variant="outline" onClick={() => setRunning((r) => !r)}>
          {running ? 'Pause' : seconds < TOTAL_SECONDS ? 'Resume' : 'Start'}
        </Button>
        <Button
          size="xs"
          variant="outline"
          onClick={() => {
            setRunning(false)
            setSeconds(TOTAL_SECONDS)
          }}
        >
          Reset
        </Button>
      </div>
    </div>
  )
}
