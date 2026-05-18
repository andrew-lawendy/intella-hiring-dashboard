import { useQueryState, parseAsString } from 'nuqs'
import { ProgressRing } from './ProgressRing'
import { PipelineHealthSnapshot } from './PipelineHealthSnapshot'
import { NotificationBell } from './NotificationBell'
import { useAuth } from '@/hooks/useAuth'
import { useProfile } from '@/hooks/useProfile'
import { useJobs } from '@/hooks/useJobs'
import { usePipelineStats } from '@/hooks/usePipelineStats'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface HeaderProps {
  onAddCandidate?: () => void
  onOpenProfile?: () => void
  onShortlist?: () => void
  onExportReport?: () => void
  onExportExcel?: () => void
  onPrint?: () => void
}

export function Header({
  onAddCandidate,
  onOpenProfile,
  onShortlist,
  onExportReport,
  onExportExcel,
  onPrint,
}: HeaderProps) {
  const [jobSlug, setJobSlug] = useQueryState('job', parseAsString)
  const { user } = useAuth()
  const { data: profile } = useProfile(user?.id)
  const { data: jobs = [] } = useJobs()

  const selectedJob = jobs.find((j) => j.slug === jobSlug)
  const stats = usePipelineStats(selectedJob?.id ?? null)

  function handleJobChange(value: string) {
    void setJobSlug(value === 'all' ? null : value)
  }

  const displayName = profile?.first_name
    ? `${profile.first_name}${profile.last_name ? ' ' + profile.last_name[0] + '.' : ''}`
    : (user?.email?.split('@')[0] ?? '')

  const avatarInitials = profile?.first_name
    ? ((profile.first_name[0] ?? '') + (profile.last_name?.[0] ?? '')).toUpperCase()
    : (user?.email?.[0] ?? '?').toUpperCase()

  return (
    <header
      className="sticky top-0 z-[100] border-b border-border"
      style={{
        background: 'color-mix(in srgb, var(--surface) 80%, transparent)',
        backdropFilter: 'blur(20px) saturate(160%)',
        WebkitBackdropFilter: 'blur(20px) saturate(160%)',
      }}
    >
      <div className="max-w-[1480px] mx-auto px-6 py-3.5 flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2.5">
            <img
              src="/assets/images/intella-logo.webp"
              alt="Intella"
              className="h-[22px] w-auto block flex-shrink-0 dark:brightness-0 dark:invert"
            />
            <span className="w-px h-[18px] bg-border opacity-70 flex-shrink-0" />
            <span className="text-[13px] font-normal tracking-[-0.005em] text-text2">
              Interview Dashboard
            </span>
          </div>
          <div className="flex items-center gap-3 ml-2">
            <ProgressRing done={stats?.completedCount ?? 0} total={stats?.totalCount ?? 0} />
            <PipelineHealthSnapshot stats={stats} />
          </div>
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          <Select value={jobSlug ?? 'all'} onValueChange={handleJobChange}>
            <SelectTrigger className="hidden lg:flex h-auto px-3 py-1.5 rounded-full border border-border text-[11.5px] font-medium text-text2 bg-[var(--surface)] gap-1.5 shadow-none mr-1 focus-visible:ring-0 focus-visible:border-border [&>svg]:size-3 [&>svg]:opacity-60">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--green)] flex-shrink-0" />
              <SelectValue>{selectedJob ? selectedJob.name : 'All roles'}</SelectValue>
            </SelectTrigger>
            <SelectContent align="start" position="popper" sideOffset={6}>
              <SelectItem value="all" className="text-[12.5px]">
                <span className="text-muted-foreground">All roles</span>
              </SelectItem>
              {jobs.map((job) => (
                <SelectItem key={job.id} value={job.slug} className="text-[12.5px]">
                  <span className="font-medium">{job.name}</span>
                  {job.department && (
                    <span className="text-muted-foreground ml-1.5">· {job.department}</span>
                  )}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <NotificationBell />
          <Button size="sm" variant="default" onClick={onAddCandidate}>
            + Add candidate
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={onShortlist}
            className="bg-primary/10 text-primary border-primary/25 hover:bg-primary/15"
          >
            ★ Shortlist
          </Button>
          <Button size="sm" variant="default" onClick={onExportReport}>
            Report PDF
          </Button>
          <Button size="sm" variant="outline" onClick={onExportExcel}>
            Export Excel
          </Button>
          <Button size="sm" variant="outline" onClick={onPrint}>
            Print
          </Button>
          <button
            type="button"
            onClick={onOpenProfile}
            aria-label="Open profile settings"
            className="flex items-center gap-2 px-2.5 py-1.5 rounded-full border border-border hover:bg-muted transition-colors text-[12.5px] font-medium text-text2 cursor-pointer"
            style={{ background: 'var(--surface)' }}
          >
            <span className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px] font-bold flex-shrink-0 overflow-hidden">
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
              ) : (
                avatarInitials
              )}
            </span>
            <span className="hidden sm:inline">{displayName}</span>
          </button>
        </div>
      </div>
    </header>
  )
}
