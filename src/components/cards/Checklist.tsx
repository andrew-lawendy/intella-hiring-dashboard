const CHECKLIST_ITEMS = [
  'CV reviewed',
  'LinkedIn checked',
  'Questions prepared',
  'Salary discussed',
  'Notice period confirmed',
]

interface ChecklistProps {
  candidateId: string
  checklist: Record<string, boolean>
  onChange: (updated: Record<string, boolean>) => void
}

export function Checklist({ checklist, onChange }: ChecklistProps) {
  const toggle = (item: string) => {
    onChange({ ...checklist, [item]: !checklist[item] })
  }

  return (
    <div className="px-4 py-3.5 border-t border-border">
      <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-text3 mb-2.5">
        Pre-Interview Checklist
      </p>
      {CHECKLIST_ITEMS.map((item) => (
        <label
          key={item}
          className={`flex items-center gap-2 mb-1.5 text-[11.5px] cursor-pointer transition-colors ${
            checklist[item]
              ? 'text-text3 line-through decoration-[1px]'
              : 'text-text2 hover:text-text'
          }`}
        >
          <input
            type="checkbox"
            checked={!!checklist[item]}
            onChange={() => toggle(item)}
            className="w-3.5 h-3.5 cursor-pointer flex-shrink-0 accent-[var(--green)]"
          />
          {item}
        </label>
      ))}
    </div>
  )
}
