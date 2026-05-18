import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { BellIcon, XIcon } from 'lucide-react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { useNotifications } from '@/hooks/useNotifications'
import { useJobs } from '@/hooks/useJobs'
import { TYPE_COLORS, type ActionItemType } from '@/lib/actionQueue'

function useSessionSet(storageKey: string) {
  const [state, setState] = useState<Set<string>>(() => {
    try {
      const raw = sessionStorage.getItem(storageKey)
      return raw ? new Set<string>(JSON.parse(raw) as string[]) : new Set<string>()
    } catch {
      return new Set<string>()
    }
  })

  function update(updater: (prev: Set<string>) => Set<string>) {
    setState((prev) => {
      const next = updater(prev)
      try {
        sessionStorage.setItem(storageKey, JSON.stringify([...next]))
      } catch {
        // sessionStorage unavailable (private browsing, quota exceeded)
      }
      return next
    })
  }

  return [state, update] as const
}

export function NotificationBell() {
  const items = useNotifications()
  const { data: jobs = [] } = useJobs()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [dismissed, setDismissed] = useSessionSet('notifications:dismissed')
  const [read, setRead] = useSessionSet('notifications:read')

  const visible = items.filter((item) => !dismissed.has(`${item.candidateId}:${item.type}`))
  const unreadCount = visible.filter((item) => !read.has(`${item.candidateId}:${item.type}`)).length

  function handleRowClick(candidateId: string, jobId: number, type: ActionItemType) {
    setRead((prev) => new Set([...prev, `${candidateId}:${type}`]))
    const job = jobs.find((j) => j.id === jobId)
    const params = new URLSearchParams()
    if (job) params.set('job', job.slug)
    params.set('profile', candidateId)
    navigate(`/cards?${params.toString()}`)
    setOpen(false)
  }

  function handleDismiss(e: React.MouseEvent, candidateId: string, type: ActionItemType) {
    e.stopPropagation()
    setDismissed((prev) => new Set([...prev, `${candidateId}:${type}`]))
  }

  function handleMarkAllRead() {
    setRead((prev) => new Set([...prev, ...visible.map((i) => `${i.candidateId}:${i.type}`)]))
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
          className="relative p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <BellIcon className="size-4" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 rounded-full bg-[var(--red)] text-white text-[9px] font-bold flex items-center justify-center tabular-nums leading-none">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" sideOffset={8} className="w-[360px] p-0">
        <div className="px-4 py-2.5 border-b border-border flex items-center justify-between">
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
            Notifications
          </p>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllRead}
                className="text-[11px] text-muted-foreground hover:text-foreground transition-colors"
              >
                Mark all read
              </button>
            )}
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close notifications"
              className="p-0.5 rounded text-muted-foreground hover:text-foreground transition-colors"
            >
              <XIcon className="size-3.5" />
            </button>
          </div>
        </div>
        <div className="max-h-[400px] overflow-y-auto">
          {visible.length === 0 ? (
            <div className="px-4 py-8 text-center text-[13px] text-muted-foreground">
              All caught up
            </div>
          ) : (
            <div className="divide-y divide-border">
              {visible.map((item) => {
                const key = `${item.candidateId}:${item.type}`
                const isRead = read.has(key)
                return (
                  <div
                    key={key}
                    className="flex items-center gap-3 px-4 py-2.5 hover:bg-muted/50 transition-colors group relative"
                  >
                    <button
                      type="button"
                      onClick={() => handleRowClick(item.candidateId, item.jobId, item.type)}
                      className="flex items-center gap-3 flex-1 min-w-0 text-left cursor-pointer"
                      aria-label={`Go to ${item.candidateName}: ${item.message}`}
                    >
                      <span
                        className="w-1.5 h-1.5 rounded-full flex-shrink-0 transition-opacity"
                        style={{
                          background: isRead ? 'var(--muted-foreground)' : TYPE_COLORS[item.type],
                          opacity: isRead ? 0.4 : 1,
                        }}
                      />
                      <div className={`flex-1 min-w-0 text-[12.5px] ${isRead ? 'opacity-50' : ''}`}>
                        <span className="font-semibold text-foreground">{item.candidateName}</span>
                        <span className="text-muted-foreground ml-1.5">{item.message}</span>
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={(e) => handleDismiss(e, item.candidateId, item.type)}
                      aria-label={`Dismiss notification for ${item.candidateName}`}
                      className="opacity-0 group-hover:opacity-50 hover:!opacity-100 p-0.5 rounded transition-opacity flex-shrink-0 text-muted-foreground"
                    >
                      <XIcon className="size-3" />
                    </button>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}
