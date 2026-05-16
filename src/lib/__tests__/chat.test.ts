import { describe, it, expect } from 'vitest'
import { maskApiKey, trimChatHistory, isValidApiKey } from '../chat'

describe('maskApiKey', () => {
  it('masks all but first 12 chars', () => {
    expect(maskApiKey('sk-ant-api03-abcdef')).toBe('sk-ant-api03' + '••••••')
  })

  it('returns empty string for null', () => {
    expect(maskApiKey(null)).toBe('')
  })
})

describe('isValidApiKey', () => {
  it('validates anthropic keys starting with sk-ant-', () => {
    expect(isValidApiKey('anthropic', 'sk-ant-api03-abc')).toBe(true)
    expect(isValidApiKey('anthropic', 'sk-proj-abc')).toBe(false)
    expect(isValidApiKey('anthropic', '')).toBe(false)
  })

  it('validates openai keys starting with sk- but not sk-ant-', () => {
    expect(isValidApiKey('openai', 'sk-proj-abc')).toBe(true)
    expect(isValidApiKey('openai', 'sk-abc')).toBe(true)
    expect(isValidApiKey('openai', 'sk-ant-abc')).toBe(false)
    expect(isValidApiKey('openai', '')).toBe(false)
  })

  it('validates google keys starting with AIza', () => {
    expect(isValidApiKey('google', 'AIzaSyAbc123')).toBe(true)
    expect(isValidApiKey('google', 'sk-ant-abc')).toBe(false)
    expect(isValidApiKey('google', '')).toBe(false)
  })
})

describe('trimChatHistory', () => {
  it('caps history at 20 messages', () => {
    const history = Array.from({ length: 25 }, (_, i) => ({
      role: 'user' as const,
      content: `msg ${i}`,
    }))
    expect(trimChatHistory(history)).toHaveLength(20)
  })

  it('keeps the most recent messages', () => {
    const history = Array.from({ length: 25 }, (_, i) => ({
      role: 'user' as const,
      content: `msg ${i}`,
    }))
    const trimmed = trimChatHistory(history)
    expect(trimmed[trimmed.length - 1].content).toBe('msg 24')
  })

  it('returns unchanged if under 20 messages', () => {
    const history = [{ role: 'user' as const, content: 'hi' }]
    expect(trimChatHistory(history)).toHaveLength(1)
  })
})
