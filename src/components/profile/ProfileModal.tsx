import { useState, useEffect, useCallback } from 'react'
import { ProfileOverview } from './ProfileOverview'
import { ProfileCareer } from './ProfileCareer'
import { ProfileQuestions } from './ProfileQuestions'
import { ProfileCV } from './ProfileCV'
import { ProfileHistory } from './ProfileHistory'
import type { CandidateWithDetails } from '@/hooks/useCandidates'
import type { Database } from '@/lib/database.types'
import { Dialog as DialogPrimitive } from 'radix-ui'
import { NavTabs, NavTab } from '@/components/ui/nav-tabs'
import { XIcon, ChevronLeftIcon, ChevronRightIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

type State = Database['public']['Tables']['interview_state']['Row']

interface ProfileModalProps {
  data: CandidateWithDetails
  state: State
  onClose: () => void
  onPhotoSave: (url: string | null) => void
  // Prev/next navigation
  currentIndex?: number
  total?: number
  onPrev?: () => void
  onNext?: () => void
}

const TABS = ['Overview', 'Career', 'Questions', 'CV', 'History'] as const
type Tab = (typeof TABS)[number]

export function ProfileModal({
  data,
  state,
  onClose,
  onPhotoSave,
  currentIndex,
  total,
  onPrev,
  onNext,
}: ProfileModalProps) {
  const [activeTab, setActiveTab] = useState<Tab>('Overview')
  const { candidate, profile, analysis } = data

  // Reset tab when candidate changes
  useEffect(() => {
    setActiveTab('Overview')
  }, [candidate.id])

  // Keyboard navigation
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return
      if (e.key === 'ArrowLeft') onPrev?.()
      else if (e.key === 'ArrowRight') onNext?.()
    },
    [onPrev, onNext],
  )

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  if (!profile) return null

  const career =
    (profile.career as { year: string; role: string; company: string; desc: string }[]) ?? []

  const hasPrev = onPrev && currentIndex !== undefined && currentIndex > 0
  const hasNext =
    onNext && currentIndex !== undefined && total !== undefined && currentIndex < total - 1

  return (
    <DialogPrimitive.Root open onOpenChange={(open) => !open && onClose()}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-[200] bg-black/40 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 duration-200" />
        <DialogPrimitive.Content
          className={cn(
            'fixed inset-y-0 right-0 z-[200] flex flex-col w-full sm:max-w-[880px]',
            'bg-background border-l border-border shadow-xl outline-none',
            'data-[state=open]:animate-in data-[state=closed]:animate-out duration-300',
            'data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right',
          )}
          aria-labelledby="profile-modal-title"
        >
          {/* Navigation strip */}
          <div className="flex-shrink-0 flex items-center justify-between px-5 py-2.5 border-b border-border bg-muted/40">
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={onPrev}
                disabled={!hasPrev}
                aria-label="Previous candidate"
                className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors disabled:opacity-30 disabled:pointer-events-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <ChevronLeftIcon className="size-4" />
              </button>
              {currentIndex !== undefined && total !== undefined && (
                <span className="text-[12px] font-medium text-muted-foreground tabular-nums px-1">
                  {currentIndex + 1} / {total}
                </span>
              )}
              <button
                type="button"
                onClick={onNext}
                disabled={!hasNext}
                aria-label="Next candidate"
                className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors disabled:opacity-30 disabled:pointer-events-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <ChevronRightIcon className="size-4" />
              </button>
              <span className="text-[11px] text-muted-foreground/50 ml-1 hidden sm:inline">
                ← → to navigate
              </span>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <XIcon className="size-4" />
            </button>
          </div>

          {/* Header */}
          <div className="flex-shrink-0 px-6 pt-5 pb-0 border-b border-border">
            <div className="mb-4">
              <h2
                id="profile-modal-title"
                className="text-[22px] font-semibold tracking-[-0.02em] text-foreground"
              >
                {candidate.name}
              </h2>
              <p className="text-[13.5px] text-muted-foreground mt-0.5">
                {[profile.title, profile.company, candidate.email].filter(Boolean).join(' · ')}
              </p>
            </div>
            <NavTabs
              aria-label="Profile sections"
              variant="underline"
              value={activeTab}
              onValueChange={(v) => setActiveTab(v as Tab)}
            >
              {TABS.map((tab) => (
                <NavTab key={tab} value={tab}>
                  {tab}
                </NavTab>
              ))}
            </NavTabs>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto">
            {activeTab === 'Overview' && <ProfileOverview profile={profile} analysis={analysis} />}
            {activeTab === 'Career' && <ProfileCareer career={career} />}
            {activeTab === 'Questions' && (
              <ProfileQuestions questions={(profile.custom_questions ?? []) as string[]} />
            )}
            {activeTab === 'CV' && (
              <ProfileCV
                candidateId={candidate.id}
                photoUrl={state.photo_url}
                onPhotoSave={onPhotoSave}
              />
            )}
            {activeTab === 'History' && <ProfileHistory candidateId={candidate.id} />}
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}
