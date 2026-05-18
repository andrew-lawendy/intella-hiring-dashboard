import { useQueryState, parseAsInteger } from 'nuqs'
import { ProgressRing } from './ProgressRing'
import { PipelineHealthSnapshot } from './PipelineHealthSnapshot'
import { useAuth } from '@/hooks/useAuth'
import { useProfile } from '@/hooks/useProfile'
import { formatRoundDateRange } from '@/hooks/useHiringRound'
import { useJobOpenings } from '@/hooks/useJobOpenings'
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
  const [jobId, setJobId] = useQueryState('job', parseAsInteger)
  const { user } = useAuth()
  const stats = usePipelineStats()
  const { data: profile } = useProfile(user?.id)
  const { data: jobs = [] } = useJobOpenings()

  const activeRoundId = jobs.find((j) => j.is_active)?.id
  const selectedId = jobId ?? activeRoundId
  const selectedRound = jobs.find((j) => j.id === selectedId)

  function handleJobChange(value: string) {
    const id = parseInt(value)
    const isActive = jobs.find((j) => j.id === id)?.is_active
    void setJobId(isActive ? null : id)
  }

  const displayName = profile?.first_name
    ? `${profile.first_name}${profile.last_name ? ' ' + profile.last_name[0] + '.' : ''}`
    : (user?.email?.split('@')[0] ?? '')

  const avatarInitials = profile?.first_name
    ? ((profile.first_name[0] ?? '') + (profile.last_name?.[0] ?? '')).toUpperCase()
    : (user?.email?.[0] ?? '?').toUpperCase()

  return (
    <header
      className="sticky top-0 z-[100] flex items-center justify-between gap-4 flex-wrap px-6 py-3.5 border-b border-border"
      style={{
        background: 'color-mix(in srgb, var(--surface) 80%, transparent)',
        backdropFilter: 'blur(20px) saturate(160%)',
        WebkitBackdropFilter: 'blur(20px) saturate(160%)',
      }}
    >
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
          <PipelineHealthSnapshot />
        </div>
      </div>

      <div className="flex items-center gap-1.5 flex-wrap">
        <Select value={selectedId?.toString() ?? ''} onValueChange={handleJobChange}>
          <SelectTrigger className="hidden lg:flex h-auto px-3 py-1.5 rounded-full border border-border text-[11.5px] font-medium text-text2 bg-[var(--surface)] gap-1.5 shadow-none mr-1 focus-visible:ring-0 focus-visible:border-border [&>svg]:size-3 [&>svg]:opacity-60">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--green)] flex-shrink-0" />
            <SelectValue>
              {selectedRound
                ? `${selectedRound.role_short} · ${formatRoundDateRange(selectedRound.start_date, selectedRound.end_date)}`
                : 'Select round'}
            </SelectValue>
          </SelectTrigger>
          <SelectContent align="start">
            {jobs.map((job) => (
              <SelectItem key={job.id} value={job.id.toString()} className="text-[12.5px]">
                <span className="font-medium">{job.role_short}</span>
                <span className="text-muted-foreground ml-1.5">
                  · {formatRoundDateRange(job.start_date, job.end_date)},{' '}
                  {new Date(job.start_date).getFullYear()}
                </span>
                {job.is_active && (
                  <span className="ml-1.5 text-[10px] font-medium text-[var(--green)] uppercase tracking-wide">
                    active
                  </span>
                )}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
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
    </header>
  )
}
