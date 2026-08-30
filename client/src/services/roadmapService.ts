import { apiRequest } from './apiClient'

export interface RoadmapResource {
  id: string
  title: string
  provider: string
  type: string
  url: string
  explanation: string
  provenance: string
}

export interface RoadmapMilestone {
  id: string
  stable_key: string
  title: string
  description: string | null
  sequence: number
  prerequisite_keys: string[]
  target_skills: string[]
  estimated_hours: number
  scheduled_start: string | null
  deadline: string | null
  status: string
  progress_percentage: number
  recommended_resources: RoadmapResource[]
  assessment_config: Record<string, unknown>
  explanation: { why?: string; confidence?: number; provenance?: string[]; alternatives?: unknown[] }
  reflection: string | null
  completed_at: string | null
}

export interface LearningRoadmap {
  id: string
  target_role: string
  objective: string | null
  version_id: string
  version_number: number
  status: string
  estimated_completion_weeks: number
  generated_at: string
  skill_gaps: string[]
  milestones: RoadmapMilestone[]
}

export const createRoadmap = (targetRole?: string) =>
  apiRequest<LearningRoadmap>('/v1/roadmaps', {
    method: 'POST',
    body: JSON.stringify(targetRole ? { target_role: targetRole } : {}),
  })

export const getCurrentRoadmap = () => apiRequest<LearningRoadmap>('/v1/roadmaps/current')

export const updateMilestoneProgress = (
  roadmapId: string,
  milestoneId: string,
  progressPercentage: number,
) => apiRequest<RoadmapMilestone>(`/v1/roadmaps/${roadmapId}/milestones/${milestoneId}`, {
  method: 'PATCH',
  body: JSON.stringify({ progress_percentage: progressPercentage }),
})

export const completeMilestone = (roadmapId: string, milestoneId: string, reflection?: string) =>
  apiRequest<RoadmapMilestone>(`/v1/roadmaps/${roadmapId}/milestones/${milestoneId}/complete`, {
    method: 'POST',
    body: JSON.stringify({ reflection: reflection || null }),
  })
