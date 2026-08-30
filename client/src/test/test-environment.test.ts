import { describe, expect, it } from 'vitest'

describe('client test environment', () => {
  it('provides a browser-like document', () => {
    expect(document).toBeDefined()
  })
})
