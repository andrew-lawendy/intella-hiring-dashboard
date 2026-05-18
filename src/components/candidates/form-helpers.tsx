import { cn } from '@/lib/utils'
import { Label } from '@/components/ui/label'
import { TriangleAlertIcon } from 'lucide-react'

export function FieldWrapper({
  label,
  required,
  optional,
  hint,
  error,
  htmlFor,
  children,
}: {
  label: string
  required?: boolean
  optional?: boolean
  hint?: string
  error?: string
  htmlFor?: string
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <Label htmlFor={htmlFor} className="text-sm">
          {label}
          {required && (
            <span className="text-destructive ml-0.5" aria-label="required">
              *
            </span>
          )}
        </Label>
        {optional && <span className="text-[11px] text-muted-foreground">optional</span>}
      </div>
      {children}
      {error ? (
        <p
          role="alert"
          id={htmlFor ? `${htmlFor}-error` : undefined}
          className="text-[12px] text-destructive flex items-center gap-1"
        >
          <TriangleAlertIcon className="size-3 flex-shrink-0" />
          {error}
        </p>
      ) : hint ? (
        <p className="text-[11.5px] text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  )
}

export function SegmentedToggle({
  value,
  onChange,
  options,
}: {
  value: string
  onChange: (v: string) => void
  options: { value: string; label: string }[]
}) {
  return (
    <div className="flex rounded-lg border border-input bg-muted p-0.5 gap-0.5" role="radiogroup">
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          role="radio"
          aria-checked={value === opt.value}
          onClick={() => onChange(opt.value)}
          className={cn(
            'flex-1 px-3 py-1.5 rounded-md text-sm font-medium transition-all cursor-pointer',
            value === opt.value
              ? 'bg-background text-foreground shadow-xs border border-border'
              : 'text-muted-foreground hover:text-foreground',
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}

export function ScoreSlider({
  value,
  onChange,
  min,
  max,
  label,
}: {
  value: number
  onChange: (v: number) => void
  min: number
  max: number
  label?: string
}) {
  const pct = ((value - min) / (max - min)) * 100
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 relative h-5 flex items-center">
        <input
          type="range"
          min={min}
          max={max}
          step={1}
          value={value}
          aria-label={label}
          onChange={(e) => onChange(Number(e.target.value))}
          className="w-full h-1.5 appearance-none rounded-full cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1"
          style={{
            background: `linear-gradient(to right, var(--primary) ${pct}%, var(--muted) ${pct}%)`,
          }}
        />
      </div>
      <span className="text-sm font-mono font-medium text-foreground w-8 text-right shrink-0">
        {max === 5 ? `${value}/5` : value}
      </span>
    </div>
  )
}

export function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
      {children}
    </p>
  )
}
