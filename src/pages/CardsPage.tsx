import { useState } from 'react'
import { useCandidates } from '@/hooks/useCandidates'
import { useCandidateState } from '@/hooks/useCandidateState'
import { useAuth } from '@/hooks/useAuth'
import { SummaryBar } from '@/components/cards/SummaryBar'
import { InterviewTimeline } from '@/components/cards/InterviewTimeline'
import { ActionQueue } from '@/components/cards/ActionQueue'
import { FilterBar } from '@/components/cards/FilterBar'
import { CandidateCard } from '@/components/cards/CandidateCard'
import { ShortlistComparison } from '@/components/cards/ShortlistComparison'
import { ProfileModal } from '@/components/profile/ProfileModal'
import { EmailDraftModal } from '@/components/profile/EmailDraftModal'
import { filterCandidates } from '@/lib/filters'
import type { FilterType } from '@/lib/filters'
import type { Scores } from '@/lib/scoring'
import type { Database } from '@/lib/database.types'

type State = Database['public']['Tables']['interview_state']['Row']

function resolveUser(email: string | undefined): 'peter' | 'ossama' {
  return email?.startsWith('peter') ? 'peter' : 'ossama'
}

export function CardsPage() {
  const { data, loading } = useCandidates()
  const {
    stateMap,
    updateState,
    setVerdict,
    setInterviewStatus,
    setShortlisted,
    setConfirmed,
    setScores,
    setComment,
    setChecklist,
  } = useCandidateState()
  const { user } = useAuth()
  const currentUser = resolveUser(user?.email)

  const [filter, setFilter] = useState<FilterType>('all')
  const [search, setSearch] = useState('')
  const [showShortlist, setShowShortlist] = useState(false)
  const [profileId, setProfileId] = useState<string | null>(null)
  const [emailId, setEmailId] = useState<string | null>(null)

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="w-7 h-7 border-2 border-surface3 border-t-text rounded-full animate-spin" />
      </div>
    )
  }

  const candidates = data.map((d) => d.candidate)
  const profileData = profileId ? (data.find((d) => d.candidate.id === profileId) ?? null) : null
  const emailData = emailId ? (data.find((d) => d.candidate.id === emailId) ?? null) : null
  const stateMin = Object.fromEntries(
    Object.entries(stateMap).map(([id, s]) => [
      id,
      {
        shortlisted: s.shortlisted,
        verdict: s.verdict,
        interview_status: s.interview_status,
        confirmed: s.confirmed,
      },
    ]),
  )
  const filtered = filterCandidates(candidates, stateMin, filter, search)

  return (
    <div>
      <h1 className="text-[30px] font-medium tracking-[-0.025em] mb-1 leading-none text-text">
        Candidate Cards
      </h1>
      <p className="text-[13.5px] text-text2 mb-6">Senior PM · May 17–21, 2026</p>

      <InterviewTimeline candidates={candidates} stateMap={stateMap} />
      <SummaryBar total={candidates.length} stateMap={stateMap} />
      <ActionQueue candidates={candidates} stateMap={stateMap} />
      <FilterBar
        filter={filter}
        search={search}
        total={candidates.length}
        onFilterChange={setFilter}
        onSearchChange={setSearch}
      />

      <div className="flex justify-end mb-3">
        <button
          onClick={() => setShowShortlist(true)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[var(--radius-sm)] text-xs font-medium font-sans cursor-pointer transition-all border"
          style={{
            background: 'var(--brand-soft)',
            color: 'var(--brand)',
            borderColor: 'color-mix(in srgb, var(--brand) 25%, transparent)',
          }}
        >
          ★ Compare Shortlisted (
          {Object.values(stateMap).filter((s) => s.shortlisted === true).length})
        </button>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-20 text-text3 text-sm">No candidates match your filter.</div>
      ) : (
        <div
          className="grid gap-3.5"
          style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))' }}
        >
          {filtered.map((candidate, i) => {
            const state = stateMap[candidate.id]
            if (!state) return null
            return (
              <CandidateCard
                key={candidate.id}
                candidate={candidate}
                state={state}
                index={i}
                currentUser={currentUser}
                onConfirmToggle={() => setConfirmed(candidate.id, !state.confirmed)}
                onStatusChange={(s: State['interview_status']) =>
                  setInterviewStatus(candidate.id, s)
                }
                onVerdictChange={(v: NonNullable<State['verdict']>) => setVerdict(candidate.id, v)}
                onShortlist={() =>
                  setShortlisted(candidate.id, state.shortlisted === true ? null : true)
                }
                onReject={() =>
                  setShortlisted(candidate.id, state.shortlisted === false ? null : false)
                }
                onScoreChange={(scorer, scores: Scores) => setScores(candidate.id, scorer, scores)}
                onCommentChange={(scorer, comment) => setComment(candidate.id, scorer, comment)}
                onChecklistChange={(checklist) => setChecklist(candidate.id, checklist)}
                onOpenProfile={() => setProfileId(candidate.id)}
                onEmailDraft={() => setEmailId(candidate.id)}
              />
            )
          })}
        </div>
      )}

      {showShortlist && (
        <ShortlistComparison
          candidates={data}
          stateMap={stateMap}
          onClose={() => setShowShortlist(false)}
        />
      )}

      {profileData && stateMap[profileData.candidate.id] && (
        <ProfileModal
          data={profileData}
          state={stateMap[profileData.candidate.id]}
          onClose={() => setProfileId(null)}
          onPhotoSave={(url) => updateState(profileData.candidate.id, { photo_url: url })}
        />
      )}

      {emailData && stateMap[emailData.candidate.id] && (
        <EmailDraftModal
          candidate={emailData.candidate}
          state={stateMap[emailData.candidate.id]}
          domains={(emailData.analysis?.domains ?? []) as string[]}
          onClose={() => setEmailId(null)}
        />
      )}
    </div>
  )
}
