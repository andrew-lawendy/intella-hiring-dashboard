import { useTheme } from '@/hooks/useTheme'

const options = [
  { value: 'light' as const, label: 'Light' },
  { value: 'dark' as const, label: 'Dark' },
  { value: 'system' as const, label: 'System' },
]

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()

  return (
    <div className="flex items-center gap-0.5 bg-surface2 border border-border rounded-[var(--radius-sm)] p-0.5">
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => setTheme(opt.value)}
          title={opt.label}
          className={[
            'px-2.5 py-1 rounded-[5px] text-xs font-medium font-sans transition-all duration-150 cursor-pointer',
            theme === opt.value
              ? 'bg-surface text-text shadow-[var(--shadow-sm)]'
              : 'text-text3 hover:text-text2',
          ].join(' ')}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}
