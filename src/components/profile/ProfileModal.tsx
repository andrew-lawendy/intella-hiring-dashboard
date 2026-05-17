import { useState } from 'react'
import { ProfileOverview } from './ProfileOverview'
import { ProfileCareer } from './ProfileCareer'
import { ProfileQuestions } from './ProfileQuestions'
import { ProfileCV } from './ProfileCV'
import { ProfileHistory } from './ProfileHistory'
import type { CandidateWithDetails } from '@/hooks/useCandidates'
import type { Database } from '@/lib/database.types'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { NavTabs, NavTab } from '@/components/ui/nav-tabs'

type State = Database['public']['Tables']['interview_state']['Row']

interface ProfileModalProps {
  data: CandidateWithDetails
  state: State
  onClose: () => void
  onPhotoSave: (url: string | null) => void
}

const TABS = ['Overview', 'Career', 'Questions', 'CV', 'History'] as const
type Tab = (typeof TABS)[number]

export function ProfileModal({ data, state, onClose, onPhotoSave }: ProfileModalProps) {
  const [activeTab, setActiveTab] = useState<Tab>('Overview')
  const { candidate, profile, analysis } = data

  if (!profile) return null

  const career =
    (profile.career as { year: string; role: string; company: string; desc: string }[]) ?? []

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-[900px] p-0 overflow-hidden gap-0" showCloseButton={true}>
        <div className="px-6 pt-6 pb-0 border-b border-border">
          <DialogHeader className="mb-4">
            <DialogTitle className="text-[22px]">{candidate.name}</DialogTitle>
            <DialogDescription>
              {profile.title} · {profile.company} · {candidate.email}
            </DialogDescription>
          </DialogHeader>

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
      </DialogContent>
    </Dialog>
  )
}
