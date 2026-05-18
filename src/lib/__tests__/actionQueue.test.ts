import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { parseSlotDate, deriveActionItems } from '../actionQueue'

describe('parseSlotDate', () => {
  it('returns null for null input', () => {
    expect(parseSlotDate(null)).toBeNull()
  })

  it('returns null for TBD', () => {
    expect(parseSlotDate('TBD')).toBeNull()
  })

  it('returns null for unparseable string', () => {
    expect(parseSlotDate('not a date')).toBeNull()
  })

  it('parses a valid slot string', () => {
    const result = parseSlotDate('Sun 17 May 11:00-12:00')
    expect(result).not.toBeNull()
    expect(result!.getMonth()).toBe(4) // May = 4
    expect(result!.getDate()).toBe(17)
    expect(result!.getHours()).toBe(11)
    expect(result!.getMinutes()).toBe(0)
  })
})

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
      [{ id: 'c1', name: 'Alice', slot: 'Mon 18 May 14:00-15:00', jobId: 2 }],
      { c1: { ...baseState, confirmed: false } },
      {},
    )
    expect(items.some((i) => i.type === 'slot-today-unconfirmed')).toBe(true)
  })

  it('does not emit slot-today-unconfirmed when already confirmed', () => {
    const items = deriveActionItems(
      [{ id: 'c1', name: 'Alice', slot: 'Mon 18 May 14:00-15:00', jobId: 2 }],
      { c1: { ...baseState, confirmed: true } },
      {},
    )
    expect(items.some((i) => i.type === 'slot-today-unconfirmed')).toBe(false)
  })

  it('emits slot-tomorrow-unconfirmed when slot is tomorrow and not confirmed', () => {
    const items = deriveActionItems(
      [{ id: 'c1', name: 'Alice', slot: 'Tue 19 May 14:00-15:00', jobId: 2 }],
      { c1: { ...baseState, confirmed: false } },
      {},
    )
    expect(items.some((i) => i.type === 'slot-tomorrow-unconfirmed')).toBe(true)
  })

  it('emits no-slot when slot is null', () => {
    const items = deriveActionItems(
      [{ id: 'c1', name: 'Alice', slot: null, jobId: 2 }],
      { c1: baseState },
      {},
    )
    expect(items.some((i) => i.type === 'no-slot')).toBe(true)
  })

  it('emits no-slot when slot is TBD', () => {
    const items = deriveActionItems(
      [{ id: 'c1', name: 'Alice', slot: 'TBD', jobId: 2 }],
      { c1: baseState },
      {},
    )
    expect(items.some((i) => i.type === 'no-slot')).toBe(true)
  })

  it('emits unconfirmed for future slots beyond tomorrow', () => {
    const items = deriveActionItems(
      [{ id: 'c1', name: 'Alice', slot: 'Wed 20 May 14:00-15:00', jobId: 2 }],
      { c1: { ...baseState, confirmed: false } },
      {},
    )
    expect(items.some((i) => i.type === 'unconfirmed')).toBe(true)
  })

  it('sorts red items before amber before blue', () => {
    const items = deriveActionItems(
      [
        { id: 'c1', name: 'Alice', slot: 'Mon 18 May 14:00-15:00', jobId: 2 },
        { id: 'c2', name: 'Bob', slot: null, jobId: 2 },
        { id: 'c3', name: 'Carol', slot: 'TBD', jobId: 2 },
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

  it('carries jobId through to each ActionItem', () => {
    const items = deriveActionItems(
      [{ id: 'c1', name: 'Alice', slot: null, jobId: 7 }],
      { c1: baseState },
      {},
    )
    expect(items[0].jobId).toBe(7)
  })
})
