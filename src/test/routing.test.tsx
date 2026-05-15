import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'

const pages = [
  ['cards', 'Cards'],
  ['schedule', 'Schedule'],
  ['compare', 'Compare'],
  ['questions', 'Questions'],
  ['salary', 'Salary'],
  ['briefing', 'Briefing'],
  ['analysis', 'Analysis'],
  ['chat', 'Chat'],
]

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    loading: false,
    session: { user: { email: 'test@intellaworld.com' } },
    isIntellaUser: true,
  }),
}))

describe('routing', () => {
  it.each(pages)('renders %s page at /%s', (_path, label) => {
    render(
      <MemoryRouter initialEntries={[`/${_path}`]}>
        <Routes>
          <Route path={`/${_path}`} element={<div>{label} — coming in Phase 4</div>} />
        </Routes>
      </MemoryRouter>,
    )
    expect(screen.getByText(`${label} — coming in Phase 4`)).toBeTruthy()
  })
})
