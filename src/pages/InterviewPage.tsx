import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useCandidates } from '@/hooks/useCandidates'
import { useCandidateState } from '@/hooks/useCandidateState'
import { useInterviewQuestions } from '@/hooks/useInterviewQuestions'
import { formatSalary } from '@/lib/salary'
import { Spinner } from '@/components/ui/spinner'
import { Button } from '@/components/ui/button'
import type { Database } from '@/lib/database.types'

type Question = Database['public']['Tables']['interview_questions']['Row']
type SaveStatus = 'idle' | 'saving' | 'saved'

function SectionCard({
  section,
  localNotes,
  onNoteChange,
}: {
  section: Question
  localNotes: Record<string, string>
  onNoteChange: (key: string, value: string) => void
}) {
  return (
    <div
      className="bg-surface border border-border rounded-[var(--radius)] overflow-hidden shadow-[var(--shadow-sm)]"
      style={{ borderLeft: `3px solid ${section.color ?? 'var(--border)'}` }}
    >
      <div className="px-5 py-4" style={{ background: section.bg ?? undefined }}>
        <p className="font-semibold text-[14px] text-text tracking-tight">{section.title}</p>
        <div className="flex items-center gap-3 mt-1">
          {section.duration && <span className="text-[12px] text-text3">⏱ {section.duration}</span>}
          {section.goal && <span className="text-[12px] text-text3">{section.goal}</span>}
        </div>
      </div>

      {section.questions && (
        <div className="border-t border-border divide-y divide-border">
          {(section.questions as string[]).map((q, i) => {
            const key = `${section.id}-${i}`
            return (
              <div key={key} className="px-5 py-4 flex flex-col gap-2">
                <div className="flex items-start gap-3 text-[13px]">
                  <span className="font-mono text-[12px] text-text3 mt-0.5 shrink-0">Q{i + 1}</span>
                  <span className="text-text leading-relaxed">{q}</span>
                </div>
                <textarea
                  value={localNotes[key] ?? ''}
                  onChange={(e) => onNoteChange(key, e.target.value)}
                  placeholder="Add notes…"
                  rows={3}
                  className="w-full text-[13px] px-3 py-2 border border-border rounded-[var(--radius-xs)] bg-bg text-text placeholder:text-text3 resize-y focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export function InterviewPage() {
  const { candidateId } = useParams<{ candidateId: string }>()
  const navigate = useNavigate()

  const { data, loading: candidateLoading } = useCandidates({
    ids: candidateId ? [candidateId] : [],
  })
  const { stateMap, setNotes, loading: stateLoading } = useCandidateState()

  const candidateData = data[0]
  const { candidate, profile } = candidateData ?? {}
  const jobId = candidate?.job_id ?? undefined

  const { questions: sections, loading: questionsLoading } = useInterviewQuestions(jobId)

  const loading = candidateLoading || questionsLoading || stateLoading

  const [localNotes, setLocalNotes] = useState<Record<string, string>>({})
  const [initialized, setInitialized] = useState(false)
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle')

  useEffect(() => {
    if (!loading && !initialized && candidateId) {
      const saved = (stateMap[candidateId]?.notes ?? {}) as Record<string, string>
      setLocalNotes(saved)
      setInitialized(true)
    }
  }, [loading, initialized, candidateId, stateMap])

  const savedNotes = (stateMap[candidateId ?? '']?.notes ?? {}) as Record<string, string>
  const isDirty = initialized && JSON.stringify(localNotes) !== JSON.stringify(savedNotes)

  const handleNoteChange = useCallback((key: string, value: string) => {
    setLocalNotes((prev) => ({ ...prev, [key]: value }))
  }, [])

  const handleSave = useCallback(async () => {
    if (!candidateId || !isDirty) return
    setSaveStatus('saving')
    await setNotes(candidateId, localNotes)
    setSaveStatus('saved')
    setTimeout(() => setSaveStatus('idle'), 1500)
  }, [candidateId, isDirty, localNotes, setNotes])

  useEffect(() => {
    if (!isDirty) return
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault()
      e.returnValue = ''
    }
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [isDirty])

  const handleBack = useCallback(() => {
    if (isDirty && !window.confirm('You have unsaved notes. Leave anyway?')) return
    navigate('/schedule')
  }, [isDirty, navigate])

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Spinner className="size-7" />
      </div>
    )
  }

  if (!candidateData || !candidate || !candidateId) {
    return <p className="text-text2 py-20 text-center">Candidate not found.</p>
  }

  const jobSections = sections.filter((s) => !s.is_general)
  const generalSections = sections.filter((s) => s.is_general)

  const buttonDisabled = !isDirty || saveStatus === 'saving' || saveStatus === 'saved'
  const buttonLabel =
    saveStatus === 'saving' ? 'Saving…' : saveStatus === 'saved' ? 'Saved ✓' : 'Save notes'

  return (
    <div>
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <button
            onClick={handleBack}
            className="text-[13px] text-text2 hover:text-text transition-colors mb-1 block"
          >
            ← Schedule
          </button>
          <h1 className="text-[30px] font-medium tracking-[-0.025em] text-text">
            {candidate.name}
          </h1>
          <div className="flex items-center gap-3 mt-1 flex-wrap">
            {profile?.title && <span className="text-[13.5px] text-text2">{profile.title}</span>}
            <span className="text-[13.5px] text-text2">
              {formatSalary(
                candidate.salary_amount,
                candidate.salary_currency,
                candidate.salary_period,
              )}
            </span>
            {candidate.notice && (
              <span className="text-[13.5px] text-text2">Notice: {candidate.notice}</span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0 pt-2">
          {isDirty && saveStatus === 'idle' && (
            <span className="text-[12px] text-text3">Unsaved changes</span>
          )}
          <Button size="sm" onClick={handleSave} disabled={buttonDisabled}>
            {buttonLabel}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {jobSections.map((section) => (
          <SectionCard
            key={section.id}
            section={section}
            localNotes={localNotes}
            onNoteChange={handleNoteChange}
          />
        ))}

        {generalSections.length > 0 && (
          <>
            {jobSections.length > 0 && (
              <div className="col-span-full flex items-center gap-3 my-2">
                <div className="flex-1 h-px bg-border" />
                <span className="text-[11px] text-text3 font-medium uppercase tracking-widest">
                  General questions
                </span>
                <div className="flex-1 h-px bg-border" />
              </div>
            )}
            {generalSections.map((section) => (
              <SectionCard
                key={section.id}
                section={section}
                localNotes={localNotes}
                onNoteChange={handleNoteChange}
              />
            ))}
          </>
        )}
      </div>
    </div>
  )
}
