import { apiRequest } from './apiClient'

export type DiscoveryStatus = 'queued' | 'running' | 'completed' | 'dead'

export interface DiscoveryJob {
  id: string
  status: DiscoveryStatus
  progress: number
  profile_version: number
  coverage: Array<{ skill: string; covered: boolean; eligible_count: number }>
  coverage_gaps: string[]
  failure_code: string | null
  created_at: string
  completed_at: string | null
}

export type ResourceInteractionType = 'impression' | 'open' | 'helpful' | 'not_helpful' | 'report'

export const discoverResources = () => apiRequest<DiscoveryJob>('/v1/resources/discover', {
  method: 'POST',
  body: '{}',
})

export const getDiscoveryJob = (jobId: string, signal?: AbortSignal) =>
  apiRequest<DiscoveryJob>(`/v1/resources/discovery-jobs/${jobId}`, { signal })

const getDiscoveryJobBefore = async (jobId: string, deadline: number) => {
  const remainingMs = deadline - Date.now()
  if (remainingMs <= 0) throw new DOMException('Discovery polling timed out', 'TimeoutError')
  const controller = new AbortController()
  let timeout: ReturnType<typeof globalThis.setTimeout>
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeout = globalThis.setTimeout(() => {
      controller.abort()
      reject(new DOMException('Discovery polling timed out', 'TimeoutError'))
    }, remainingMs)
  })
  try {
    return await Promise.race([getDiscoveryJob(jobId, controller.signal), timeoutPromise])
  } finally {
    globalThis.clearTimeout(timeout!)
  }
}

export const waitForDiscovery = async (
  jobId: string,
  onProgress?: (job: DiscoveryJob) => void,
  timeoutMs = 180_000,
  pollMs = 1_500,
) => {
  const deadline = Date.now() + timeoutMs
  let job: DiscoveryJob | undefined
  while (Date.now() < deadline) {
    job = await getDiscoveryJobBefore(jobId, deadline)
    onProgress?.(job)
    if (['completed', 'dead'].includes(job.status)) return job
    const delay = Math.min(pollMs, Math.max(deadline - Date.now(), 0))
    await new Promise((resolve) => globalThis.setTimeout(resolve, delay))
  }
  throw new DOMException('Discovery polling timed out', 'TimeoutError')
}

export const recordResourceInteraction = (
  resourceId: string,
  payload: {
    event_type: ResourceInteractionType
    idempotency_key: string
    session_id?: string
    milestone_id?: string
    report_reason?: string
  },
) => apiRequest<{ id: string; created: boolean }>(`/v1/resources/${resourceId}/interactions`, {
  method: 'POST',
  body: JSON.stringify(payload),
  priority: 'low',
} as RequestInit)
