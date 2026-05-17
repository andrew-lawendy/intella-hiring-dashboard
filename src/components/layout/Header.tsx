import { ProgressRing } from './ProgressRing'
import { PipelineHealthSnapshot } from './PipelineHealthSnapshot'
import { ThemeToggle } from './ThemeToggle'
import { useAuth } from '@/hooks/useAuth'
import { usePipelineStats } from '@/hooks/usePipelineStats'
import { Button } from '@/components/ui/button'

interface HeaderProps {
  onShortlist?: () => void
  onExportReport?: () => void
  onExportExcel?: () => void
  onPrint?: () => void
}

export function Header({ onShortlist, onExportReport, onExportExcel, onPrint }: HeaderProps) {
  const { signOut } = useAuth()
  const stats = usePipelineStats()

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
          <div
            className="w-[26px] h-[26px] rounded-[7px] flex-shrink-0 bg-primary"
            style={{
              boxShadow: '0 1px 0 rgba(255,255,255,.25) inset, 0 4px 12px -4px rgba(25,95,107,.5)',
            }}
          />
          <span className="text-[17px] font-semibold tracking-tight text-text font-sans">
            Intella{' '}
            <span className="text-text2 font-normal text-[14px]">/ Interview Dashboard</span>
          </span>
        </div>
        <div className="flex items-center gap-3 ml-2">
          <ProgressRing done={stats?.completedCount ?? 0} total={stats?.totalCount ?? 0} />
          <PipelineHealthSnapshot />
        </div>
      </div>

      <div className="flex items-center gap-1.5 flex-wrap">
        <div
          className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-border text-[11.5px] font-medium text-text2 mr-1"
          style={{ background: 'var(--surface)' }}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-[var(--green)]" />
          Senior PM · May 17–21
        </div>
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
        <ThemeToggle />
        <Button size="sm" variant="ghost" onClick={signOut} className="text-muted-foreground">
          Sign out
        </Button>
      </div>
    </header>
  )
}
