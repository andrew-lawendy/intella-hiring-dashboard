import { useState, useMemo } from 'react'
import { useCandidateMeta } from '@/hooks/useCandidateMeta'
import { useDebounce } from '@/hooks/useDebounce'
import { useHiringRound, generateDayMap } from '@/hooks/useHiringRound'
import { useCandidates } from '@/hooks/useCandidates'
import {
  useCandidateState,
  getSlotScores,
  getCoSlotScores,
  getSlotComment,
  getCoSlotComment,
} from '@/hooks/useCandidateState'
import { useAuth } from '@/hooks/useAuth'
import { useProfile } from '@/hooks/useProfile'
import { useInterviewerNames } from '@/hooks/useInterviewerNames'
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
const PAGE_SIZE = 24

export function CardsPage() {
  const { candidates: allMeta, loading: metaLoading } = useCandidateMeta()
  const {
    stateMap,
    updateState,
    setShortlisted,
    setConfirmed,
    setScoresBySlot,
    setCommentBySlot,
    setChecklist,
    setVerdict,
    setInterviewStatus,
  } = useCandidateState()
  const { user } = useAuth()
  const { data: myProfile } = useProfile(user?.id)

  const getInterviewerName = useInterviewerNames()
  const mySlot = myProfile?.scorer_slot ?? 'ossama'
  const coSlot = mySlot === 'peter' ? 'ossama' : 'peter'
  const myName = getInterviewerName(mySlot)
  const coName = getInterviewerName(coSlot)
  const { data: round } = useHiringRound()
  const dayMap = useMemo(
    () => (round ? generateDayMap(round.start_date, round.end_date) : {}),
    [round],
  )

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
    () => filterCandidates(allMeta, stateMin, filter, debouncedSearch, dayMap),
    [allMeta, stateMin, filter, debouncedSearch, dayMap],
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

  // Profile modal — navigate across all filtered candidates
  const profileIndex = profileId ? filteredMeta.findIndex((m) => m.id === profileId) : -1
  const profileData = profileId
    ? (pageData.find((d) => d.candidate.id === profileId) ?? null)
    : null
  const emailData = emailId ? (pageData.find((d) => d.candidate.id === emailId) ?? null) : null

  function navigateProfile(dir: 1 | -1) {
    if (profileIndex === -1) return
    const nextIndex = profileIndex + dir
    if (nextIndex < 0 || nextIndex >= filteredMeta.length) return
    setProfileId(filteredMeta[nextIndex].id)
  }

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
                  myScores={getSlotScores(state, mySlot)}
                  coScores={getCoSlotScores(state, mySlot)}
                  checklistItems={round?.checklist_items}
                  onConfirmToggle={() => setConfirmed(candidate.id, !state.confirmed)}
                  onShortlist={() =>
                    setShortlisted(candidate.id, state.shortlisted === true ? null : true)
                  }
                  onReject={() =>
                    setShortlisted(candidate.id, state.shortlisted === false ? null : false)
                  }
                  onCVDownload={() => setEmailId(candidate.id)}
                  onOpenProfile={() => setProfileId(candidate.id)}
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
          currentIndex={profileIndex}
          total={filteredMeta.length}
          onPrev={() => navigateProfile(-1)}
          onNext={() => navigateProfile(1)}
          myName={myName}
          coName={coName}
          myScores={getSlotScores(stateMap[profileData.candidate.id], mySlot)}
          coScores={getCoSlotScores(stateMap[profileData.candidate.id], mySlot)}
          myComment={getSlotComment(stateMap[profileData.candidate.id], mySlot)}
          coComment={getCoSlotComment(stateMap[profileData.candidate.id], mySlot)}
          scoreCategories={round?.score_categories}
          checklistItems={round?.checklist_items}
          onMyScoreChange={(scores) => setScoresBySlot(profileData.candidate.id, mySlot, scores)}
          onMyCommentSave={(comment) => setCommentBySlot(profileData.candidate.id, mySlot, comment)}
          onChecklistChange={(checklist) => setChecklist(profileData.candidate.id, checklist)}
          onVerdictChange={(v) => setVerdict(profileData.candidate.id, v)}
          onStatusChange={(s) => setInterviewStatus(profileData.candidate.id, s)}
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
