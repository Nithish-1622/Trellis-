import { apiRequest } from './apiClient'

export interface AdaptationProposal {
  id: string
  roadmap_id: string
  base_version_id: string
  proposed_version_id: string
  status: 'pending' | 'accepted' | 'rejected'
  diff: {
    additions?: { stable_key: string; title: string; reason: string }[]
    removals?: { stable_key: string; title: string; reason: string }[]
    resequenced?: { stable_key: string; from: number; to: number }[]
    timeline_change?: string
    explanation?: string
  }
  evidence_ids: string[]
  feedback: string | null
  created_at: string
  decided_at: string | null
}

export const createAdaptation = (roadmapId: string, evidenceIds: string[]) =>
  apiRequest<AdaptationProposal>(`/v1/roadmaps/${roadmapId}/adaptations`, {
    method: 'POST', body: JSON.stringify({ evidence_ids: evidenceIds }),
  })

export const getPendingAdaptation = () => apiRequest<AdaptationProposal>('/v1/adaptations/pending')
export const acceptAdaptation = (proposalId: string) => apiRequest<AdaptationProposal>(`/v1/adaptations/${proposalId}/accept`, { method: 'POST', body: '{}' })
export const rejectAdaptation = (proposalId: string, feedback?: string) => apiRequest<AdaptationProposal>(`/v1/adaptations/${proposalId}/reject`, { method: 'POST', body: JSON.stringify({ feedback: feedback || null }) })
