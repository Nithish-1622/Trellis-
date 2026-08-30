import { apiRequest } from './apiClient'

export type OnboardingStep =
  | 'goal'
  | 'current_position'
  | 'previous_learning'
  | 'preferences'
  | 'review'

export interface GoalDraft {
  free_text: string
  target_role?: string | null
  objective?: string | null
  target_date?: string | null
}

export interface SkillDraft {
  name: string
  proficiency: 'beginner' | 'intermediate' | 'advanced' | 'expert'
  evidence_source: string
  evidence_url?: string | null
  evidence_rationale?: string | null
}

export interface CurrentPositionDraft {
  current_role?: string | null
  experience_years?: number | null
  education_level?: string | null
  interests: string[]
  skills: SkillDraft[]
  resume_filename?: string | null
  resume_file_id?: string | null
  resume_certifications?: string[]
  resume_projects?: string[]
}

export interface CompletedCourseDraft {
  title: string
  provider?: string | null
  completion_date?: string | null
  topics: string[]
  rating?: number | null
  evidence_url?: string | null
}

export interface PreviousLearningDraft {
  courses: CompletedCourseDraft[]
}

export interface LearningPreferencesDraft {
  preferred_formats: string[]
  project_theory_balance?: number | null
  learning_pace?: string | null
  weekly_hours?: number | null
  preferred_language?: string | null
  budget?: string | null
  accessibility_needs: string[]
  preferred_session_minutes?: number | null
}

export interface OnboardingDraft {
  goal: GoalDraft | null
  current_position: CurrentPositionDraft | null
  previous_learning: PreviousLearningDraft | null
  preferences: LearningPreferencesDraft | null
}

export interface OnboardingUpdate {
  current_step: OnboardingStep
  completed_steps: OnboardingStep[]
  draft: OnboardingDraft
  complete: boolean
}

export interface OnboardingSession {
  session_id: string | null
  status: 'not_started' | 'in_progress' | 'completed'
  current_step: OnboardingStep
  completed_steps: OnboardingStep[]
  draft: OnboardingDraft
  updated_at: string | null
  completed_at: string | null
}

export interface LearnerProfile {
  user_id: string
  target_role: string | null
  weekly_hours: number | null
  is_onboarding_complete: boolean
}

export interface GoalAnalysis {
  target_role: string
  objective: string
  target_date: string | null
  explanation: string
}

export const getOnboarding = () => apiRequest<OnboardingSession>('/v1/me/onboarding')

export const saveOnboarding = (update: OnboardingUpdate) =>
  apiRequest<OnboardingSession>('/v1/me/onboarding', {
    method: 'POST',
    body: JSON.stringify(update),
  })

export const getLearnerProfile = () => apiRequest<LearnerProfile>('/v1/me/profile')

export const analyzeGoal = (goal: string) =>
  apiRequest<GoalAnalysis>('/v1/me/onboarding/goal-analysis', {
    method: 'POST',
    body: JSON.stringify({ goal }),
  })
