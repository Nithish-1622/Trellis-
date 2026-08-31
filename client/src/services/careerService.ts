import { apiRequest } from './apiClient'

export interface SalaryRange {
    min?: number
    max?: number
    currency?: string
}

export interface JobRecommendation {
    id: string
    title: string
    company: string
    location: string
    job_type: string
    salary_range?: SalaryRange
    required_skills: string[]
    posted_date?: string
    match_score: number
    url: string
    explanation: string
}

export interface JobRecommendationPage {
    items: JobRecommendation[]
    total: number
}

export interface InterviewInteraction {
    session_id: string
    status: 'in_progress' | 'completed'
    question?: string
    question_number: number
    question_count: number
    previous_feedback?: string
    previous_score?: number
}

export interface InterviewReport {
    overall_score?: number
    summary: string
    strengths: string[]
    improvements: string[]
}

export const getRecommendedJobs = (limit = 10) =>
    apiRequest<JobRecommendationPage>(`/v1/career/jobs?limit=${limit}`)

export const startInterview = (targetRole: string, focusArea: string) =>
    apiRequest<InterviewInteraction>('/v1/career/interviews', {
        method: 'POST',
        body: JSON.stringify({ target_role: targetRole, focus_area: focusArea }),
    })

export const submitInterviewAnswer = (sessionId: string, answer: string) =>
    apiRequest<InterviewInteraction>(`/v1/career/interviews/${sessionId}/answers`, {
        method: 'POST',
        body: JSON.stringify({ answer }),
    })

export const getInterviewReport = (sessionId: string) =>
    apiRequest<InterviewReport>(`/v1/career/interviews/${sessionId}`)
