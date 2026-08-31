import { beforeEach, describe, expect, it, vi } from 'vitest'

const { createJWT } = vi.hoisted(() => ({ createJWT: vi.fn() }))

vi.mock('../lib/appwrite', () => ({
  account: { createJWT },
}))

import { apiRequest, clearApiToken } from './apiClient'


describe('apiRequest', () => {
  beforeEach(() => {
    clearApiToken()
    createJWT.mockReset()
    vi.unstubAllGlobals()
  })

  it('mints an Appwrite JWT and sends it as a bearer token', async () => {
    createJWT.mockResolvedValue({ jwt: 'short-lived-jwt' })
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ status: 'ok' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    )
    vi.stubGlobal('fetch', fetchMock)

    await apiRequest('/v1/auth/session')

    expect(createJWT).toHaveBeenCalledWith()
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/v1/auth/session'),
      expect.objectContaining({
        headers: expect.objectContaining({ Authorization: 'Bearer short-lived-jwt' }),
      }),
    )
  })

  it('refreshes the JWT once after an unauthorized response', async () => {
    createJWT
      .mockResolvedValueOnce({ jwt: 'expired-jwt' })
      .mockResolvedValueOnce({ jwt: 'fresh-jwt' })
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response('', { status: 401 }))
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ status: 'ok' }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }),
      )
    vi.stubGlobal('fetch', fetchMock)

    await apiRequest('/v1/auth/session')

    expect(createJWT).toHaveBeenCalledTimes(2)
    expect(fetchMock.mock.calls[1][1].headers.Authorization).toBe('Bearer fresh-jwt')
  })
})
