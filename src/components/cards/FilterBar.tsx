import type { FilterType } from '@/lib/filters'
import { Button } from '@/components/ui/button'
import { SearchInput } from '@/components/ui/search-input'

interface FilterBarProps {
  filter: FilterType
  search: string
  total: number
  onFilterChange: (f: FilterType) => void
  onSearchChange: (s: string) => void
}

const STATUS_FILTERS: { value: FilterType; label: string }[] = [
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'pending', label: 'Pending' },
  { value: 'shortlisted', label: 'Shortlisted' },
  { value: 'rejected', label: 'Rejected' },
]

const SENIORITY_FILTERS: { value: FilterType; label: string }[] = [
  { value: 'intern', label: 'Intern' },
  { value: 'junior', label: 'Junior' },
  { value: 'mid', label: 'Mid' },
  { value: 'senior', label: 'Senior' },
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
      <Button
        size="sm"
        variant={filter === 'all' ? 'default' : 'outline'}
        onClick={() => onFilterChange('all')}
      >
        All ({total})
      </Button>
      {STATUS_FILTERS.map((f) => (
        <Button
          key={f.value}
          size="sm"
          variant={filter === f.value ? 'default' : 'outline'}
          onClick={() => onFilterChange(f.value)}
        >
          {f.label}
        </Button>
      ))}
      <span className="w-px h-5 bg-border mx-0.5" />
      {SENIORITY_FILTERS.map((f) => (
        <Button
          key={f.value}
          size="sm"
          variant={filter === f.value ? 'default' : 'outline'}
          onClick={() => onFilterChange(f.value)}
        >
          {f.label}
        </Button>
      ))}
      <div className="ml-auto w-64">
        <SearchInput
          placeholder="Search name, email, notes..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          onClear={() => onSearchChange('')}
          size="sm"
        />
      </div>
    </div>
  )
}
