interface CareerEntry {
  year: string
  role: string
  company: string
  desc: string
}
interface ProfileCareerProps {
  career: CareerEntry[]
}

export function ProfileCareer({ career }: ProfileCareerProps) {
  if (!career.length) {
    return <div className="p-6 text-text3 text-sm">No career history available.</div>
  }
  return (
    <div className="p-6 overflow-y-auto max-h-[calc(80vh-120px)]">
      <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-text3 mb-4">
        Career Timeline
      </p>
      <div className="relative pl-5 border-l border-border">
        {career.map((entry, i) => (
          <div key={i} className="mb-5 relative">
            <div className="absolute -left-[21px] w-2.5 h-2.5 rounded-full bg-brand border-2 border-surface" />
            <p className="text-[12px] font-mono text-text3 mb-1">{entry.year}</p>
            <p className="font-semibold text-sm text-text">{entry.role}</p>
            <p className="text-[12px] text-text2 mb-1">{entry.company}</p>
            <p className="text-[12px] text-text2 leading-relaxed">{entry.desc}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
