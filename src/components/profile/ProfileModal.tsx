import { useState } from 'react'
import { ProfileOverview } from './ProfileOverview'
import { ProfileCareer } from './ProfileCareer'
import { ProfileQuestions } from './ProfileQuestions'
import { ProfileCV } from './ProfileCV'
import { ProfileHistory } from './ProfileHistory'
import type { CandidateWithDetails } from '@/hooks/useCandidates'
import type { Database } from '@/lib/database.types'

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
    <div
      className="fixed inset-0 bg-black/55 backdrop-blur-[8px] z-[500] flex items-start justify-center py-8 px-8 overflow-y-auto"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="relative bg-surface rounded-[16px] w-full max-w-[900px] my-auto overflow-hidden shadow-[var(--shadow-lg)] border border-border">
        <button
          onClick={onClose}
          className="absolute top-4 right-5 w-8 h-8 rounded-full bg-surface border border-border flex items-center justify-center text-text2 hover:bg-text hover:text-bg hover:border-text cursor-pointer z-10 transition-all text-lg shadow-[var(--shadow-sm)]"
        >
          ✕
        </button>

        <div className="px-6 pt-6 pb-0 border-b border-border">
          <div className="flex items-start gap-4 mb-4">
            <div>
              <h2 className="text-[22px] font-semibold tracking-tight text-text">
                {candidate.name}
              </h2>
              <p className="text-text2 text-sm mt-0.5">
                {profile.title} · {profile.company}
              </p>
              <p className="text-text3 text-xs mt-0.5">{candidate.email}</p>
            </div>
          </div>

          <div className="flex gap-0 -mb-px">
            {TABS.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={[
                  'px-4 py-2.5 text-[13px] font-medium font-sans border-b-[1.5px] -mb-px transition-all duration-150 cursor-pointer bg-transparent border-l-0 border-r-0 border-t-0',
                  activeTab === tab
                    ? 'text-text border-b-text font-semibold'
                    : 'text-text2 border-b-transparent hover:text-text',
                ].join(' ')}
              >
                {tab}
              </button>
            ))}
          </div>
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
      </div>
    </div>
  )
}
