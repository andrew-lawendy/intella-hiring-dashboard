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
      className="bg-bg border-b border-border px-6 flex overflow-x-auto gap-0.5"
      style={{ scrollbarWidth: 'none' }}
    >
      {tabs.map((tab) => (
        <NavLink
          key={tab.to}
          to={tab.to}
          className={({ isActive }) =>
            [
              'font-sans text-[13px] font-medium px-3.5 py-3 border-b-[1.5px] -mb-px transition-all duration-150 whitespace-nowrap cursor-pointer',
              isActive
                ? 'text-text border-b-text font-semibold'
                : 'text-text2 border-b-transparent hover:text-text',
            ].join(' ')
          }
        >
          {tab.label}
        </NavLink>
      ))}
    </nav>
  )
}
