import { apiRequest } from './apiClient'

export interface QuizQuestion { id: string; prompt: string; options: string[] }
export interface Quiz { milestone_id: string; questions: QuizQuestion[] }
export interface AssessmentAttempt {
  id: string
  milestone_id: string
  assessment_type: 'quiz' | 'project'
  score: number
  confidence: number
  rationale: string | null
  rubric: { criterion: string; score: number; rationale: string }[]
  provisional: boolean
  reflection: string | null
  created_at: string
}

export const getMilestoneQuiz = (milestoneId: string) =>
  apiRequest<Quiz>(`/v1/assessments/milestones/${milestoneId}/quiz`)

export const submitQuiz = (milestoneId: string, answers: { question_id: string; answer: string }[]) =>
  apiRequest<AssessmentAttempt>(`/v1/assessments/milestones/${milestoneId}/quiz-attempts`, {
    method: 'POST', body: JSON.stringify({ answers }),
  })

export const submitProject = (milestoneId: string, submission: { repository_url: string; summary: string; reflection?: string }) =>
  apiRequest<AssessmentAttempt>(`/v1/assessments/milestones/${milestoneId}/project-submissions`, {
    method: 'POST', body: JSON.stringify(submission),
  })
