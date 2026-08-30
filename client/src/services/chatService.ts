import { apiRequest } from './apiClient'

export interface AssistantAction {
  action_type: string
  label: string
  payload: Record<string, unknown>
  requires_confirmation: boolean
}
export interface AssistantResponse {
  message: string
  actions: AssistantAction[]
  suggestions: string[]
  context: { roadmap_id?: string | null; version_number?: number | null; next_milestone_id?: string | null; evidence_count?: number }
}

export const sendChatMessage = (message: string) => apiRequest<AssistantResponse>('/v1/chat/messages', {
  method: 'POST', body: JSON.stringify({ message }),
})
