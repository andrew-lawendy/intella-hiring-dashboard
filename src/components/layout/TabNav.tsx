import { NavLink } from 'react-router-dom'

const tabs = [
  { to: '/cards', label: 'Cards' },
  { to: '/schedule', label: 'Schedule' },
  { to: '/compare', label: 'Compare' },
  { to: '/questions', label: 'Questions' },
  { to: '/salary', label: 'Salary Chart' },
  { to: '/briefing', label: 'Day Briefing' },
  { to: '/analysis', label: '📊 Analysis' },
  { to: '/chat', label: 'AI Assistant' },
]

export function TabNav() {
  return (
    <nav
      role="tablist"
      aria-label="Dashboard sections"
      className="bg-background border-b border-border px-6 flex overflow-x-auto gap-0"
      style={{ scrollbarWidth: 'none' }}
    >
      {tabs.map((tab) => (
        <NavLink
          key={tab.to}
          to={tab.to}
          role="tab"
          className={({ isActive }) =>
            [
              'font-sans text-[13px] font-medium px-3.5 py-2.5 border-b-2 -mb-px transition-all duration-200 whitespace-nowrap cursor-pointer select-none outline-none',
              'focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
              isActive
                ? 'text-foreground border-b-primary'
                : 'text-muted-foreground border-b-transparent hover:text-foreground',
            ].join(' ')
          }
        >
          {tab.label}
        </NavLink>
      ))}
    </nav>
  )
}
