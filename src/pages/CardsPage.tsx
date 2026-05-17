import { useState, useMemo } from 'react'
import { useCandidateMeta } from '@/hooks/useCandidateMeta'
import { useDebounce } from '@/hooks/useDebounce'
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
import { Pagination } from '@/components/ui/Pagination'
import { Spinner } from '@/components/ui/spinner'
import { Button } from '@/components/ui/button'
import { filterCandidates } from '@/lib/filters'
import type { FilterType } from '@/lib/filters'
import type { Scores } from '@/lib/scoring'
import type { Database } from '@/lib/database.types'

type State = Database['public']['Tables']['interview_state']['Row']

const PAGE_SIZE = 24

function resolveUser(email: string | undefined): 'peter' | 'ossama' {
  return email?.startsWith('peter') ? 'peter' : 'ossama'
}

export function CardsPage() {
  const { candidates: allMeta, loading: metaLoading } = useCandidateMeta()
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
  const [page, setPage] = useState(1)
  const [showShortlist, setShowShortlist] = useState(false)
  const [profileId, setProfileId] = useState<string | null>(null)
  const [emailId, setEmailId] = useState<string | null>(null)

  const handleFilterChange = (f: FilterType) => {
    setFilter(f)
    setPage(1)
  }
  const handleSearchChange = (s: string) => {
    setSearch(s)
    setPage(1)
  }

  const stateMin = useMemo(
    () =>
      Object.fromEntries(
        Object.entries(stateMap).map(([id, s]) => [
          id,
          {
            shortlisted: s.shortlisted,
            verdict: s.verdict,
            interview_status: s.interview_status,
            confirmed: s.confirmed,
          },
        ]),
      ),
    [stateMap],
  )

  const debouncedSearch = useDebounce(search, 300)

  const filteredMeta = useMemo(
    () => filterCandidates(allMeta, stateMin, filter, debouncedSearch),
    [allMeta, stateMin, filter, debouncedSearch],
  )

  const pageIds = useMemo(
    () => filteredMeta.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE).map((m) => m.id),
    [filteredMeta, page],
  )

  const shortlistedIds = useMemo(
    () =>
      Object.entries(stateMap)
        .filter(([, s]) => s.shortlisted === true)
        .map(([id]) => id),
    [stateMap],
  )

  // Fetch full data (profile + analysis) for current page only
  const { data: pageData, loading: cardsLoading } = useCandidates({ ids: pageIds })

  // Profile and email modals only open from cards on the current page
  const profileData = profileId
    ? (pageData.find((d) => d.candidate.id === profileId) ?? null)
    : null
  const emailData = emailId ? (pageData.find((d) => d.candidate.id === emailId) ?? null) : null

  if (metaLoading) {
    return (
      <div className="flex justify-center py-20">
        <Spinner className="size-7" />
      </div>
    )
  }

  return (
    <div>
      <h1 className="text-[30px] font-medium tracking-[-0.025em] mb-1 leading-none text-text">
        Candidate Cards
      </h1>
      <p className="text-[13.5px] text-text2 mb-6">Senior PM · May 17–21, 2026</p>

      <InterviewTimeline candidates={allMeta} stateMap={stateMap} />
      <SummaryBar total={allMeta.length} stateMap={stateMap} />
      <ActionQueue candidates={allMeta} stateMap={stateMap} />
      <FilterBar
        filter={filter}
        search={search}
        total={allMeta.length}
        onFilterChange={handleFilterChange}
        onSearchChange={handleSearchChange}
      />

      <div className="flex justify-end mb-3">
        <Button
          size="sm"
          variant="outline"
          onClick={() => setShowShortlist(true)}
          className="bg-primary/10 text-primary border-primary/25 hover:bg-primary/15"
        >
          ★ Compare Shortlisted ({shortlistedIds.length})
        </Button>
      </div>

      {filteredMeta.length === 0 ? (
        <div className="text-center py-20 text-text3 text-sm">No candidates match your filter.</div>
      ) : cardsLoading ? (
        <div className="flex justify-center py-20">
          <Spinner className="size-7" />
        </div>
      ) : (
        <>
          <div
            className="grid gap-3.5"
            style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))' }}
          >
            {pageIds.map((id) => {
              const cardData = pageData.find((d) => d.candidate.id === id)
              if (!cardData) return null
              const { candidate } = cardData
              const state = stateMap[candidate.id]
              if (!state) return null
              return (
                <CandidateCard
                  key={candidate.id}
                  candidate={candidate}
                  state={state}
                  currentUser={currentUser}
                  onConfirmToggle={() => setConfirmed(candidate.id, !state.confirmed)}
                  onStatusChange={(s: State['interview_status']) =>
                    setInterviewStatus(candidate.id, s)
                  }
                  onVerdictChange={(v: NonNullable<State['verdict']>) =>
                    setVerdict(candidate.id, v)
                  }
                  onShortlist={() =>
                    setShortlisted(candidate.id, state.shortlisted === true ? null : true)
                  }
                  onReject={() =>
                    setShortlisted(candidate.id, state.shortlisted === false ? null : false)
                  }
                  onScoreChange={(scorer, scores: Scores) =>
                    setScores(candidate.id, scorer, scores)
                  }
                  onCommentChange={(scorer, comment) => setComment(candidate.id, scorer, comment)}
                  onChecklistChange={(checklist) => setChecklist(candidate.id, checklist)}
                  onOpenProfile={() => setProfileId(candidate.id)}
                  onEmailDraft={() => setEmailId(candidate.id)}
                />
              )
            })}
          </div>

          <Pagination
            page={page}
            pageSize={PAGE_SIZE}
            total={filteredMeta.length}
            onChange={setPage}
          />
        </>
      )}

      {showShortlist && (
        <ShortlistComparison
          candidateIds={shortlistedIds}
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
