import { apiRequest } from './apiClient'

export interface ApiSession { user_id: string; roles: string[] }
export type VerificationStatus = 'verified' | 'vetted' | 'discovered' | 'rejected'
export type ExceptionCategory = '' | 'reports' | 'low_confidence_high_score' | 'score_drop' | 'stale' | 'heavily_used' | 'unusual_new_creator'
export interface CatalogResource {
  id: string; title: string; provider: string; resource_type: string; url: string
  verification_status: VerificationStatus; link_status: string; topics: string[]; archived_at?: string
  resource_score?: number | null; score_confidence?: number | null; author?: string | null
  is_pinned?: boolean; suppressed_at?: string | null
}
export interface CatalogPage { items: CatalogResource[]; total: number; limit: number; offset: number }
export interface ImportResult { created: number; skipped: number; items: CatalogResource[] }
export interface NewCatalogResource {
  title: string; provider: string; resource_type: string; url: string; topics: string[]
  verification_status?: VerificationStatus; external_id?: string; moderation_reason?: string
}
export interface ProviderCandidate { canonical_key: string; title: string; provider: string; resource_type: string; url: string; author?: string | null }
export type ModerationAction = 'verify' | 'reject' | 'pin' | 'unpin' | 'suppress' | 'unsuppress' | 'score_override' | 'clear_score_override'

export const getApiSession = () => apiRequest<ApiSession>('/v1/auth/session')
export const listResources = (filters: { status?: VerificationStatus; exceptionCategory?: ExceptionCategory } = {}) => {
  const params = new URLSearchParams({ limit: '100' })
  if (filters.status) params.set('verification_status', filters.status)
  if (filters.exceptionCategory) params.set('exception_category', filters.exceptionCategory)
  return apiRequest<CatalogPage>(`/v1/admin/resources?${params}`)
}
export const previewProviderResources = (query: string) =>
  apiRequest<ProviderCandidate[]>(`/v1/admin/resources/provider-preview?query=${encodeURIComponent(query)}&limit=10`)
export const createResource = (resource: NewCatalogResource) => apiRequest<CatalogResource>('/v1/admin/resources', { method: 'POST', body: JSON.stringify(resource) })
export const bulkCreateResources = (resources: NewCatalogResource[]) => apiRequest<ImportResult>('/v1/admin/resources/bulk', { method: 'POST', body: JSON.stringify({ resources }) })
export const moderateResource = (id: string, action: ModerationAction, reason: string, score?: number) =>
  apiRequest<CatalogResource>(`/v1/admin/resources/${id}/moderate`, { method: 'POST', body: JSON.stringify({ action, reason, ...(score == null ? {} : { score }) }) })
export const reevaluateResource = (id: string, reason: string) =>
  apiRequest<{ id: string; status: string }>(`/v1/admin/resources/${id}/reevaluate`, { method: 'POST', body: JSON.stringify({ reason }) })
export const checkResourceLink = (id: string) => apiRequest<CatalogResource>(`/v1/admin/resources/${id}/check-link`, { method: 'POST', body: '{}' })
