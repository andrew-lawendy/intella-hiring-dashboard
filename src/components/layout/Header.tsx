import { ProgressRing } from './ProgressRing'
import { PipelineHealthSnapshot } from './PipelineHealthSnapshot'
import { ThemeToggle } from './ThemeToggle'
import { useAuth } from '@/hooks/useAuth'
import { usePipelineStats } from '@/hooks/usePipelineStats'

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
            className="w-[26px] h-[26px] rounded-[7px] flex-shrink-0"
            style={{
              background: 'radial-gradient(120% 100% at 0% 0%, #4c44c4, #2a2479 70%)',
              boxShadow: '0 1px 0 rgba(255,255,255,.35) inset, 0 4px 12px -4px rgba(42,36,121,.5)',
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
        <button
          onClick={onShortlist}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[var(--radius-sm)] text-xs font-medium font-sans cursor-pointer transition-all duration-150 border"
          style={{
            background: 'var(--brand-soft)',
            color: 'var(--brand)',
            borderColor: 'color-mix(in srgb, var(--brand) 25%, transparent)',
          }}
        >
          ★ Shortlist
        </button>
        <button
          onClick={onExportReport}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[var(--radius-sm)] text-xs font-medium font-sans cursor-pointer transition-all duration-150 bg-text text-bg border border-text hover:bg-text2"
        >
          Report PDF
        </button>
        <button
          onClick={onExportExcel}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[var(--radius-sm)] text-xs font-medium font-sans cursor-pointer transition-all duration-150 bg-surface border border-border text-text2 hover:bg-surface2 hover:text-text"
        >
          Export Excel
        </button>
        <button
          onClick={onPrint}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[var(--radius-sm)] text-xs font-medium font-sans cursor-pointer transition-all duration-150 bg-surface border border-border text-text2 hover:bg-surface2 hover:text-text"
        >
          Print
        </button>
        <ThemeToggle />
        <button
          onClick={signOut}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[var(--radius-sm)] text-xs font-medium font-sans cursor-pointer transition-all duration-150 text-text3 hover:text-text"
        >
          Sign out
        </button>
      </div>
    </header>
  )
}
