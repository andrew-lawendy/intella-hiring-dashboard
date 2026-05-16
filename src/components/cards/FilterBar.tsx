import type { FilterType } from '@/lib/filters'

interface FilterBarProps {
  filter: FilterType
  search: string
  total: number
  onFilterChange: (f: FilterType) => void
  onSearchChange: (s: string) => void
}

const FILTERS: { value: FilterType; label: string }[] = [
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'pending', label: 'Pending' },
  { value: 'shortlisted', label: 'Shortlisted' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'sun', label: 'Sunday' },
  { value: 'mon', label: 'Monday' },
  { value: 'tue', label: 'Tuesday' },
  { value: 'wed', label: 'Wednesday' },
  { value: 'thu', label: 'Thursday' },
]

export function FilterBar({
  filter,
  search,
  total,
  onFilterChange,
  onSearchChange,
}: FilterBarProps) {
  return (
    <div className="flex gap-1.5 mb-[18px] flex-wrap items-center">
      <button
        onClick={() => onFilterChange('all')}
        className={[
          'px-3 py-1.5 rounded-full text-xs font-medium font-sans border transition-all duration-150 cursor-pointer',
          filter === 'all'
            ? 'bg-text text-bg border-text'
            : 'bg-surface border-border text-text2 hover:border-border-strong hover:text-text',
        ].join(' ')}
      >
        All ({total})
      </button>
      {FILTERS.map((f) => (
        <button
          key={f.value}
          onClick={() => onFilterChange(f.value)}
          className={[
            'px-3 py-1.5 rounded-full text-xs font-medium font-sans border transition-all duration-150 cursor-pointer',
            filter === f.value
              ? 'bg-text text-bg border-text'
              : 'bg-surface border-border text-text2 hover:border-border-strong hover:text-text',
          ].join(' ')}
        >
          {f.label}
        </button>
      ))}
      <div className="ml-auto relative">
        <input
          type="search"
          placeholder="Search name, email, notes..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="bg-surface border border-border rounded-full pl-8 pr-4 py-1.5 text-[12.5px] font-sans text-text w-64 outline-none focus:border-text transition-colors placeholder:text-text3"
          style={{
            backgroundImage: `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='14' height='14' fill='none' stroke='%2392907f' stroke-width='1.6' stroke-linecap='round'><circle cx='6.2' cy='6.2' r='4.5'/><path d='m9.7 9.7 3.3 3.3'/></svg>")`,
            backgroundRepeat: 'no-repeat',
            backgroundPosition: '10px center',
          }}
        />
      </div>
    </div>
  )
}
