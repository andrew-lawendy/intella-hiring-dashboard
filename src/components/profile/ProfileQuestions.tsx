interface ProfileQuestionsProps {
  questions: string[]
}

export function ProfileQuestions({ questions }: ProfileQuestionsProps) {
  if (!questions.length) {
    return <div className="p-6 text-text3 text-sm">No custom questions available.</div>
  }
  return (
    <div className="p-6 overflow-y-auto max-h-[calc(80vh-120px)]">
      <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-text3 mb-4">
        Custom Interview Questions
      </p>
      {questions.map((q, i) => (
        <div
          key={i}
          className="mb-3 bg-[var(--blue-bg)] border-l-[3px] border-[var(--blue)] px-4 py-3 rounded-r-[var(--radius-xs)]"
        >
          <span className="text-[12px] font-semibold text-[var(--blue)] mr-2">Q{i + 1}.</span>
          <span className="text-[12.5px] text-text leading-relaxed">{q}</span>
        </div>
      ))}
    </div>
  )
}
