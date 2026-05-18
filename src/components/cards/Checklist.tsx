import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'

const DEFAULT_CHECKLIST_ITEMS = [
  'CV reviewed',
  'LinkedIn checked',
  'Questions prepared',
  'Salary discussed',
  'Notice period confirmed',
]

interface ChecklistProps {
  candidateId: string
  checklist: Record<string, boolean>
  items?: string[]
  onChange: (updated: Record<string, boolean>) => void
}

export function Checklist({
  checklist,
  items = DEFAULT_CHECKLIST_ITEMS,
  onChange,
}: ChecklistProps) {
  const toggle = (item: string) => {
    onChange({ ...checklist, [item]: !checklist[item] })
  }

  return (
    <div className="px-4 py-3.5 border-t border-border">
      <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-text3 mb-2.5">
        Pre-Interview Checklist
      </p>
      {items.map((item) => (
        <div key={item} className="flex items-center gap-2 mb-1.5">
          <Checkbox
            id={`checklist-${item}`}
            checked={!!checklist[item]}
            onCheckedChange={() => toggle(item)}
            className="flex-shrink-0"
          />
          <Label
            htmlFor={`checklist-${item}`}
            className={`text-[11.5px] cursor-pointer transition-colors ${
              checklist[item]
                ? 'text-text3 line-through decoration-[1px]'
                : 'text-text2 hover:text-text'
            }`}
          >
            {item}
          </Label>
        </div>
      ))}
    </div>
  )
}
