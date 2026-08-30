import { afterEach, describe, expect, it, vi } from 'vitest'

const { apiRequest } = vi.hoisted(() => ({ apiRequest: vi.fn() }))
vi.mock('./apiClient', () => ({ apiRequest }))

import { waitForDiscovery } from './resourceService'

describe('waitForDiscovery', () => {
  afterEach(() => {
    vi.useRealTimers()
    vi.clearAllMocks()
  })

  it('enforces its wall-clock deadline when a request never settles', async () => {
    vi.useFakeTimers()
    apiRequest.mockReturnValue(new Promise(() => undefined))

    const result = waitForDiscovery('job-1', undefined, 45, 10)
    const assertion = expect(result).rejects.toMatchObject({ name: 'TimeoutError' })
    await vi.advanceTimersByTimeAsync(46)

    await assertion
  })
})
