import { apiRequest } from './apiClient'

export interface SkillSummary {
  id: string; name: string; canonical_name: string; proficiency: string; estimated_score: number
  confidence: number; evidence_count: number; trend: number; source: string
}
export interface DashboardData {
  roadmap: null | { id: string; target_role: string; version_number: number; progress_percentage: number; completed_milestones: number; total_milestones: number }
  weekly_effort_minutes: number
  skill_growth: SkillSummary[]
  recent_assessments: { id: string; milestone_id: string; assessment_type: string; score: number; provisional: boolean; created_at: string }[]
  deadlines: { milestone_id: string; title: string; deadline: string; status: string }[]
  blockers: string[]
  streak_days: number
  next_action: { action_type: string; title: string; explanation: string; href: string; milestone_id: string | null }
}

export const getDashboard = () => apiRequest<DashboardData>('/v1/me/dashboard')
