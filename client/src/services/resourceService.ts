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

export const getDiscoveryJob = (jobId: string) =>
  apiRequest<DiscoveryJob>(`/v1/resources/discovery-jobs/${jobId}`)

export const waitForDiscovery = async (
  jobId: string,
  onProgress?: (job: DiscoveryJob) => void,
  timeoutMs = 45_000,
  pollMs = 1_500,
) => {
  const deadline = Date.now() + timeoutMs
  let job = await getDiscoveryJob(jobId)
  onProgress?.(job)
  while (!['completed', 'dead'].includes(job.status) && Date.now() < deadline) {
    await new Promise((resolve) => window.setTimeout(resolve, pollMs))
    job = await getDiscoveryJob(jobId)
    onProgress?.(job)
  }
  return job
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
