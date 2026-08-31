import { account } from '../lib/appwrite'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8085'
const JWT_CACHE_MILLISECONDS = 12 * 60 * 1000

interface ErrorEnvelope {
  error?: {
    code?: string
    message?: string
    details?: unknown
  }
}

export class ApiError extends Error {
  readonly status: number
  readonly code: string
  readonly details?: unknown

  constructor(status: number, code: string, message: string, details?: unknown) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
    this.details = details
  }
}

let cachedToken: { value: string; expiresAt: number } | null = null

export const clearApiToken = () => {
  cachedToken = null
}

const getApiToken = async (forceRefresh = false): Promise<string> => {
  if (!forceRefresh && cachedToken && cachedToken.expiresAt > Date.now()) {
    return cachedToken.value
  }

  const { jwt } = await account.createJWT()
  cachedToken = {
    value: jwt,
    expiresAt: Date.now() + JWT_CACHE_MILLISECONDS,
  }
  return jwt
}

const parseError = async (response: Response): Promise<ApiError> => {
  let envelope: ErrorEnvelope = {}
  try {
    envelope = (await response.json()) as ErrorEnvelope
  } catch {
    // A proxy or provider may return a non-JSON response. Keep it generic.
  }
  return new ApiError(
    response.status,
    envelope.error?.code || 'REQUEST_FAILED',
    envelope.error?.message || 'The request could not be completed',
    envelope.error?.details,
  )
}

export const apiRequest = async <T>(
  path: string,
  init: RequestInit = {},
  hasRetried = false,
): Promise<T> => {
  const token = await getApiToken(hasRetried)
  const headers: Record<string, string> = {
    ...(init.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
    ...(init.headers as Record<string, string> | undefined),
    Authorization: `Bearer ${token}`,
  }
  const response = await fetch(`${API_BASE_URL}${path}`, { ...init, headers })

  if (response.status === 401 && !hasRetried) {
    clearApiToken()
    return apiRequest<T>(path, init, true)
  }
  if (!response.ok) throw await parseError(response)
  if (response.status === 204) return undefined as T
  return (await response.json()) as T
}
