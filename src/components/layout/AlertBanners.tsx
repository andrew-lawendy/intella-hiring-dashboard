import { useState } from 'react'

interface Alert {
  id: string
  message: string
  variant: 'amber' | 'blue'
}

const INITIAL_ALERTS: Alert[] = [
  {
    id: 'george',
    message: '⚠ George Fekry has no interview slot assigned yet.',
    variant: 'amber',
  },
  {
    id: 'aliaa',
    message: '🕒 Aliaa Elfeky confirmation still pending (Tue 19 May 16:00)',
    variant: 'blue',
  },
]

export function AlertBanners() {
  const [dismissed, setDismissed] = useState<Set<string>>(new Set())
  const visible = INITIAL_ALERTS.filter((a) => !dismissed.has(a.id))

  if (!visible.length) return null

  return (
    <div className="px-6 pt-3 flex flex-col gap-1.5">
      {visible.map((alert) => (
        <div
          key={alert.id}
          className="flex items-center justify-between px-3.5 py-2 rounded-[var(--radius-sm)] border text-[12.5px] font-sans"
          style={{
            background: alert.variant === 'amber' ? 'var(--amber-bg)' : 'var(--blue-bg)',
            borderColor: alert.variant === 'amber' ? 'var(--amber-line)' : 'var(--blue-line)',
            color: alert.variant === 'amber' ? 'var(--amber)' : 'var(--blue)',
          }}
        >
          <span>{alert.message}</span>
          <button
            onClick={() => setDismissed((prev) => new Set([...prev, alert.id]))}
            className="ml-3 opacity-60 hover:opacity-100 cursor-pointer bg-transparent border-none text-inherit text-sm"
            aria-label="Dismiss"
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  )
}
