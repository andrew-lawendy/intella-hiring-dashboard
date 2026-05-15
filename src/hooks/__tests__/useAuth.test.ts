import { describe, it, expect, vi } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useAuth } from '../useAuth'

vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: null } }),
      onAuthStateChange: vi.fn().mockReturnValue({
        data: { subscription: { unsubscribe: vi.fn() } },
      }),
    },
  },
}))

describe('useAuth', () => {
  it('starts in loading state', () => {
    const { result } = renderHook(() => useAuth())
    expect(result.current.loading).toBe(true)
  })

  it('isIntellaUser is false when no user', () => {
    const { result } = renderHook(() => useAuth())
    expect(result.current.isIntellaUser).toBe(false)
  })
})
