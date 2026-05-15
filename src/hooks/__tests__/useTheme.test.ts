import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'

const store: Record<string, string> = {}
vi.stubGlobal('localStorage', {
  getItem: (k: string) => store[k] ?? null,
  setItem: (k: string, v: string) => {
    store[k] = v
  },
  removeItem: (k: string) => {
    delete store[k]
  },
})

vi.stubGlobal('matchMedia', (query: string) => ({
  matches: query.includes('dark'),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
}))

describe('useTheme', () => {
  beforeEach(() => {
    Object.keys(store).forEach((k) => delete store[k])
  })

  it('defaults to system when no saved preference', async () => {
    const { useTheme } = await import('../useTheme')
    const { result } = renderHook(() => useTheme())
    expect(result.current.theme).toBe('system')
  })

  it('restores saved preference from localStorage', async () => {
    store['intella_theme'] = 'dark'
    const { useTheme } = await import('../useTheme')
    const { result } = renderHook(() => useTheme())
    expect(result.current.theme).toBe('dark')
  })

  it('setTheme persists to localStorage and updates html attribute', async () => {
    const { useTheme } = await import('../useTheme')
    const { result } = renderHook(() => useTheme())
    act(() => result.current.setTheme('light'))
    expect(store['intella_theme']).toBe('light')
    expect(document.documentElement.getAttribute('data-theme')).toBe('light')
  })
})
