import { apiRequest } from './apiClient'

export interface ApiSession { user_id: string; roles: string[] }
export interface CatalogResource {
  id: string; title: string; provider: string; resource_type: string; url: string
  verification_status: string; link_status: string; topics: string[]; archived_at?: string
}
export interface CatalogPage { items: CatalogResource[]; total: number; limit: number; offset: number }
export interface ImportResult { created: number; skipped: number; items: CatalogResource[] }
export interface NewCatalogResource {
  title: string; provider: string; resource_type: string; url: string; topics: string[]
  verification_status?: string; external_id?: string
}

export const getApiSession = () => apiRequest<ApiSession>('/v1/auth/session')
export const listResources = () => apiRequest<CatalogPage>('/v1/admin/resources?limit=100')
export const createResource = (resource: NewCatalogResource) => apiRequest<CatalogResource>('/v1/admin/resources', { method: 'POST', body: JSON.stringify(resource) })
export const bulkCreateResources = (resources: NewCatalogResource[]) => apiRequest<ImportResult>('/v1/admin/resources/bulk', { method: 'POST', body: JSON.stringify({ resources }) })
export const syncProviderResources = (query: string) => apiRequest<ImportResult>('/v1/admin/resources/provider-sync', { method: 'POST', body: JSON.stringify({ query, limit: 10 }) })
export const updateResource = (id: string, patch: Record<string, unknown>) => apiRequest<CatalogResource>(`/v1/admin/resources/${id}`, { method: 'PATCH', body: JSON.stringify(patch) })
export const archiveResource = (id: string) => apiRequest<CatalogResource>(`/v1/admin/resources/${id}`, { method: 'DELETE' })
export const checkResourceLink = (id: string) => apiRequest<CatalogResource>(`/v1/admin/resources/${id}/check-link`, { method: 'POST', body: '{}' })
