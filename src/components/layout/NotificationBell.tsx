import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQueryState, parseAsString } from 'nuqs'
import { BellIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { useNotifications } from '@/hooks/useNotifications'
import { useJobs } from '@/hooks/useJobs'
import { TYPE_COLORS, type ActionItemType } from '@/lib/actionQueue'

function getEndOfDay(): Date {
  const d = new Date()
  d.setHours(23, 59, 59, 999)
  return d
}

function useCookieSet(cookieName: string) {
  const [state, setState] = useState<Set<string>>(() => {
    try {
      const match = document.cookie.split('; ').find((r) => r.startsWith(cookieName + '='))
      if (!match) return new Set<string>()
      return new Set<string>(JSON.parse(decodeURIComponent(match.split('=')[1])) as string[])
    } catch {
      return new Set<string>()
    }
  })

  function update(updater: (prev: Set<string>) => Set<string>) {
    setState((prev) => {
      const next = updater(prev)
      try {
        document.cookie = `${cookieName}=${encodeURIComponent(JSON.stringify([...next]))}; expires=${getEndOfDay().toUTCString()}; path=/; SameSite=Lax`
      } catch {
        // cookie write failed
      }
      return next
    })
  }

  return [state, update] as const
}

export function NotificationBell() {
  const [jobSlug] = useQueryState('job', parseAsString)
  const { data: jobs = [] } = useJobs()
  const selectedJobId = jobs.find((j) => j.slug === jobSlug)?.id ?? null
  const items = useNotifications(selectedJobId)
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [read, setRead] = useCookieSet('notif_read')

  const unreadCount = items.filter((item) => !read.has(`${item.candidateId}:${item.type}`)).length

  function handleRowClick(candidateId: string, jobId: number, type: ActionItemType) {
    setRead((prev) => new Set([...prev, `${candidateId}:${type}`]))
    const job = jobs.find((j) => j.id === jobId)
    const params = new URLSearchParams()
    if (job) params.set('job', job.slug)
    params.set('profile', candidateId)
    navigate(`/cards?${params.toString()}`)
    setOpen(false)
  }

  function handleMarkAllRead() {
    setRead((prev) => new Set([...prev, ...items.map((i) => `${i.candidateId}:${i.type}`)]))
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon-xs"
          aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
          className="relative"
        >
          <BellIcon className="size-4" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 rounded-full bg-[var(--red)] text-white text-[9px] font-bold flex items-center justify-center tabular-nums leading-none">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" sideOffset={8} className="w-[360px] p-0">
        <div className="px-4 py-2.5 border-b border-border flex items-center justify-between">
          <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
            Notifications
          </p>
          {unreadCount > 0 && (
            <button
              type="button"
              onClick={handleMarkAllRead}
              className="text-[12px] text-muted-foreground hover:text-foreground transition-colors"
            >
              Mark all read
            </button>
          )}
        </div>
        <div className="max-h-[400px] overflow-y-auto">
          {items.length === 0 ? (
            <div className="px-4 py-8 text-center text-[13px] text-muted-foreground">
              All caught up
            </div>
          ) : (
            <div className="divide-y divide-border">
              {items.map((item) => {
                const key = `${item.candidateId}:${item.type}`
                const isRead = read.has(key)
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => handleRowClick(item.candidateId, item.jobId, item.type)}
                    className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-muted/50 cursor-pointer transition-colors text-left"
                    aria-label={`Go to ${item.candidateName}: ${item.message}`}
                  >
                    <span
                      className="w-1.5 h-1.5 rounded-full flex-shrink-0"
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
                )
              })}
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}
