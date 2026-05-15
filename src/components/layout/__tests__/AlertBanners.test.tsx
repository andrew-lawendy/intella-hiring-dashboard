import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { AlertBanners } from '../AlertBanners'

describe('AlertBanners', () => {
  it('renders both default alerts', () => {
    render(<AlertBanners />)
    expect(screen.getByText(/George Fekry/)).toBeTruthy()
    expect(screen.getByText(/Aliaa Elfeky/)).toBeTruthy()
  })

  it('dismisses an alert on button click', () => {
    render(<AlertBanners />)
    const dismissButtons = screen.getAllByLabelText('Dismiss')
    fireEvent.click(dismissButtons[0])
    expect(screen.queryByText(/George Fekry/)).toBeNull()
    expect(screen.getByText(/Aliaa Elfeky/)).toBeTruthy()
  })
})
