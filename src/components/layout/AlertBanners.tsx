import { useState } from 'react'
import { TriangleAlertIcon, ClockIcon, XIcon } from 'lucide-react'
import { Alert } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'

interface AlertItem {
  id: string
  message: string
  variant: 'warning' | 'info'
  icon: React.ReactNode
}

const INITIAL_ALERTS: AlertItem[] = [
  {
    id: 'george',
    message: 'George Fekry has no interview slot assigned yet.',
    variant: 'warning',
    icon: <TriangleAlertIcon className="size-4" />,
  },
  {
    id: 'aliaa',
    message: 'Aliaa Elfeky confirmation still pending (Tue 19 May 16:00)',
    variant: 'info',
    icon: <ClockIcon className="size-4" />,
  },
]

export function AlertBanners() {
  const [dismissed, setDismissed] = useState<Set<string>>(new Set())
  const visible = INITIAL_ALERTS.filter((a) => !dismissed.has(a.id))

  if (!visible.length) return null

  return (
    <div className="px-6 pt-3 flex flex-col gap-1.5">
      {visible.map((item) => (
        <Alert key={item.id} variant={item.variant} className="py-2 text-[12.5px]">
          {item.icon}
          <div className="flex items-center justify-between col-start-2">
            <span>{item.message}</span>
            <Button
              size="icon-xs"
              variant="ghost"
              onClick={() => setDismissed((prev) => new Set([...prev, item.id]))}
              aria-label="Dismiss"
              className="ml-3 opacity-60 hover:opacity-100"
            >
              <XIcon className="size-3.5" />
            </Button>
          </div>
        </Alert>
      ))}
    </div>
  )
}
