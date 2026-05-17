import { useState } from 'react'
import { useInterviewQuestions } from '@/hooks/useInterviewQuestions'
import { Spinner } from '@/components/ui/spinner'

export function QuestionsPage() {
  const { questions, loading } = useInterviewQuestions()
  const [expanded, setExpanded] = useState<Set<number>>(new Set([1]))

  if (loading)
    return (
      <div className="flex justify-center py-20">
        <Spinner className="size-7" />
      </div>
    )

  const toggle = (id: number) =>
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })

  return (
    <div>
      <h1 className="text-[30px] font-medium tracking-[-0.025em] mb-1 text-text">Questions</h1>
      <p className="text-text2 text-[13.5px] mb-6">
        Interview question bank — {questions.length} sections
      </p>

      <div className="flex flex-col gap-3">
        {questions.map((section) => {
          const isOpen = expanded.has(section.id)
          return (
            <div
              key={section.id}
              className="bg-surface border border-border rounded-[var(--radius)] overflow-hidden shadow-[var(--shadow-sm)]"
            >
              <button
                onClick={() => toggle(section.id)}
                className="w-full px-5 py-4 flex items-center justify-between text-left hover:bg-surface2 transition-colors cursor-pointer"
                style={{ borderLeft: `3px solid ${section.color ?? 'var(--border)'}` }}
              >
                <div>
                  <p className="font-semibold text-[14px] text-text tracking-tight">
                    {section.title}
                  </p>
                  <div className="flex items-center gap-3 mt-1">
                    {section.duration && (
                      <span className="text-[11px] text-text3">⏱ {section.duration}</span>
                    )}
                    {section.goal && <span className="text-[11px] text-text3">{section.goal}</span>}
                  </div>
                </div>
                <span className="text-text3 text-xs ml-4">{isOpen ? '▲' : '▼'}</span>
              </button>

              {isOpen && section.questions && (
                <div className="border-t border-border divide-y divide-border">
                  {(section.questions as string[]).map((q, i) => (
                    <div key={i} className="px-5 py-3 flex items-start gap-3 text-[13px]">
                      <span className="font-mono text-[11px] text-text3 mt-0.5 flex-shrink-0">
                        Q{i + 1}
                      </span>
                      <span className="text-text leading-relaxed">{q}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
