import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { deriveActionItems } from '../actionQueue'

// ISO strings built with local Date constructor so isSameDay comparisons
// work correctly in any timezone the test runner uses.
const TODAY_ISO = new Date(2026, 4, 18, 14, 0).toISOString() // Mon 18 May 14:00 local
const TOMORROW_ISO = new Date(2026, 4, 19, 14, 0).toISOString() // Tue 19 May 14:00 local
const FUTURE_ISO = new Date(2026, 4, 20, 14, 0).toISOString() // Wed 20 May 14:00 local

describe('deriveActionItems', () => {
  const TODAY = new Date(2026, 4, 18, 10, 0) // Mon 18 May 2026 10:00

  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(TODAY)
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  const baseState = {
    confirmed: false,
    interview_status: 'pending' as const,
    verdict: null,
  }

  it('emits slot-today-unconfirmed when slot is today and not confirmed', () => {
    const items = deriveActionItems(
      [{ id: 'c1', name: 'Alice', interview_at: TODAY_ISO, jobId: 2 }],
      { c1: { ...baseState, confirmed: false } },
      {},
    )
    expect(items.some((i) => i.type === 'slot-today-unconfirmed')).toBe(true)
  })

  it('does not emit slot-today-unconfirmed when already confirmed', () => {
    const items = deriveActionItems(
      [{ id: 'c1', name: 'Alice', interview_at: TODAY_ISO, jobId: 2 }],
      { c1: { ...baseState, confirmed: true } },
      {},
    )
    expect(items.some((i) => i.type === 'slot-today-unconfirmed')).toBe(false)
  })

  it('emits slot-tomorrow-unconfirmed when slot is tomorrow and not confirmed', () => {
    const items = deriveActionItems(
      [{ id: 'c1', name: 'Alice', interview_at: TOMORROW_ISO, jobId: 2 }],
      { c1: { ...baseState, confirmed: false } },
      {},
    )
    expect(items.some((i) => i.type === 'slot-tomorrow-unconfirmed')).toBe(true)
  })

  it('emits no-slot when interview_at is null', () => {
    const items = deriveActionItems(
      [{ id: 'c1', name: 'Alice', interview_at: null, jobId: 2 }],
      { c1: baseState },
      {},
    )
    expect(items.some((i) => i.type === 'no-slot')).toBe(true)
  })

  it('emits no-slot when interview_at is an invalid date string', () => {
    const items = deriveActionItems(
      [{ id: 'c1', name: 'Alice', interview_at: 'not-a-date', jobId: 2 }],
      { c1: baseState },
      {},
    )
    expect(items.some((i) => i.type === 'no-slot')).toBe(true)
  })

  it('emits unconfirmed for future slots beyond tomorrow', () => {
    const items = deriveActionItems(
      [{ id: 'c1', name: 'Alice', interview_at: FUTURE_ISO, jobId: 2 }],
      { c1: { ...baseState, confirmed: false } },
      {},
    )
    expect(items.some((i) => i.type === 'unconfirmed')).toBe(true)
  })

  it('sorts red items before amber before blue', () => {
    const items = deriveActionItems(
      [
        { id: 'c1', name: 'Alice', interview_at: TODAY_ISO, jobId: 2 },
        { id: 'c2', name: 'Bob', interview_at: null, jobId: 2 },
        { id: 'c3', name: 'Carol', interview_at: null, jobId: 2 },
      ],
      {
        c1: { confirmed: false, interview_status: 'completed', verdict: null },
        c2: { confirmed: false, interview_status: 'pending', verdict: null },
        c3: { confirmed: false, interview_status: 'completed', verdict: null },
      },
      {},
    )
    const urgencies = items.map((i) =>
      ['slot-today-unconfirmed', 'overdue-scorecard'].includes(i.type)
        ? 0
        : ['no-slot', 'slot-tomorrow-unconfirmed', 'unconfirmed'].includes(i.type)
          ? 1
          : 2,
    )
    for (let i = 1; i < urgencies.length; i++) {
      expect(urgencies[i]).toBeGreaterThanOrEqual(urgencies[i - 1])
    }
  })

  it('emits no-slot for a non-null unparseable interview_at string', () => {
    const items = deriveActionItems(
      [{ id: 'c1', name: 'Alice', interview_at: 'bad-format', jobId: 2 }],
      { c1: baseState },
      {},
    )
    expect(items.some((i) => i.type === 'no-slot')).toBe(true)
  })

  it('carries jobId through to each ActionItem', () => {
    const items = deriveActionItems(
      [{ id: 'c1', name: 'Alice', interview_at: null, jobId: 7 }],
      { c1: baseState },
      {},
    )
    expect(items[0].jobId).toBe(7)
  })
})
