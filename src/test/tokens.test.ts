import { describe, it, expect } from 'vitest'
describe('test infrastructure', () => {
  it('runs a basic assertion', () => { expect(1 + 1).toBe(2) })
  it('has access to DOM globals', () => {
    const el = document.createElement('div')
    el.textContent = 'hello'
    expect(el.textContent).toBe('hello')
  })
})
