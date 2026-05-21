import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React from 'react'
import { useInterviewQuestions } from '../useInterviewQuestions'

const generalSection = {
  id: 100,
  position: 100,
  title: 'Background & Motivation',
  duration: '5-10 min',
  goal: 'Understand trajectory',
  color: '#6366f1',
  bg: '#eef2ff',
  questions: ['Q1', 'Q2'],
  is_general: true,
  job_id: null,
}

const pmSection = {
  id: 1,
  position: 1,
  title: 'Product Sense',
  duration: '15 min',
  goal: 'Assess PM skills',
  color: '#f59e0b',
  bg: '#fffbeb',
  questions: ['PM Q1'],
  is_general: false,
  job_id: 2,
}

vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(),
  },
}))

function wrapper({ children }: { children: React.ReactNode }) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return React.createElement(QueryClientProvider, { client }, children)
}

describe('useInterviewQuestions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns all sections when no jobId provided', async () => {
    const { supabase } = await import('@/lib/supabase')
    vi.mocked(supabase.from).mockReturnValue({
      select: vi.fn().mockReturnValue({
        order: vi.fn().mockResolvedValue({ data: [pmSection, generalSection] }),
      }),
    } as never)

    const { result } = renderHook(() => useInterviewQuestions(), { wrapper })

    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.questions).toHaveLength(2)
  })

  it('filters by jobId OR is_general when jobId provided', async () => {
    const { supabase } = await import('@/lib/supabase')
    const orMock = vi.fn().mockReturnValue({
      order: vi.fn().mockResolvedValue({ data: [pmSection, generalSection] }),
    })
    vi.mocked(supabase.from).mockReturnValue({
      select: vi.fn().mockReturnValue({ or: orMock }),
    } as never)

    const { result } = renderHook(() => useInterviewQuestions(2), { wrapper })

    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(orMock).toHaveBeenCalledWith('job_id.eq.2,is_general.eq.true')
    expect(result.current.questions).toHaveLength(2)
  })

  it('returns empty array when data is null', async () => {
    const { supabase } = await import('@/lib/supabase')
    vi.mocked(supabase.from).mockReturnValue({
      select: vi.fn().mockReturnValue({
        order: vi.fn().mockResolvedValue({ data: null }),
      }),
    } as never)

    const { result } = renderHook(() => useInterviewQuestions(), { wrapper })

    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.questions).toEqual([])
  })
})
