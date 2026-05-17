import { useState } from 'react'
import { XIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ChipInputProps {
  value: string[]
  onChange: (value: string[]) => void
  placeholder?: string
  className?: string
  id?: string
}

export function ChipInput({ value, onChange, placeholder, className, id }: ChipInputProps) {
  const [draft, setDraft] = useState('')

  function commit() {
    const v = draft.trim().replace(/,$/, '').trim()
    if (!v || value.includes(v)) {
      setDraft('')
      return
    }
    onChange([...value, v])
    setDraft('')
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      commit()
    } else if (e.key === 'Backspace' && !draft && value.length) {
      onChange(value.slice(0, -1))
    }
  }

  return (
    <div
      className={cn(
        'flex flex-wrap gap-1.5 min-h-9 w-full rounded-md border border-input bg-transparent px-2.5 py-1.5',
        'focus-within:border-ring focus-within:ring-[3px] focus-within:ring-ring/50',
        'transition-[color,box-shadow]',
        className,
      )}
    >
      {value.map((v, i) => (
        <span
          key={i}
          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-muted text-[12px] font-medium text-foreground"
        >
          {v}
          <button
            type="button"
            onClick={() => onChange(value.filter((_, j) => j !== i))}
            aria-label={`Remove ${v}`}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <XIcon className="size-2.5" />
          </button>
        </span>
      ))}
      <input
        id={id}
        type="text"
        value={draft}
        placeholder={value.length === 0 ? placeholder : ''}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={onKeyDown}
        onBlur={commit}
        className="flex-1 min-w-[100px] outline-none bg-transparent text-sm placeholder:text-muted-foreground"
      />
    </div>
  )
}
