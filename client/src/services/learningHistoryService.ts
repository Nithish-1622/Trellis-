import { ID } from 'appwrite'
import { storage } from '../lib/appwrite'
import { apiRequest } from './apiClient'
import type { CompletedCourseDraft } from './onboardingService'

export interface CsvPreviewRow {
  row_number: number
  status: 'ready' | 'invalid' | 'duplicate'
  course: CompletedCourseDraft | null
  errors: string[]
}

export interface CsvPreview {
  rows: CsvPreviewRow[]
  ready_count: number
  invalid_count: number
  duplicate_count: number
}

export interface CsvImportResult extends CsvPreview {
  imported_count: number
  rejected_count: number
}

export interface ResumeSkillSuggestion {
  name: string
  proficiency: 'beginner' | 'intermediate' | 'advanced' | 'expert'
  rationale: string | null
}

export interface ResumeCapabilities {
  filename: string
  resume_file_id: string | null
  current_role: string | null
  experience_years: number | null
  education_level: string | null
  skills: ResumeSkillSuggestion[]
  certifications: string[]
  projects: string[]
}

const fileRequest = <T>(path: string, file: File, extra?: Record<string, string>) => {
  const body = new FormData()
  body.append('file', file)
  Object.entries(extra || {}).forEach(([key, value]) => body.append(key, value))
  return apiRequest<T>(path, { method: 'POST', body })
}

export const previewLearningHistoryCsv = (file: File) =>
  fileRequest<CsvPreview>('/v1/me/learning-history/csv/preview', file)

export const importLearningHistoryCsv = (file: File) =>
  fileRequest<CsvImportResult>('/v1/me/learning-history/csv/import?allow_partial=true', file)

export const previewResumeCapabilities = (file: File) =>
  fileRequest<ResumeCapabilities>('/v1/me/resume/parse', file)

export const storeAcceptedResume = async (file: File) => {
  const bucketId = import.meta.env.VITE_APPWRITE_BUCKET_ID
  if (!bucketId) throw new Error('Resume storage is not configured. Please contact support.')
  const uploaded = await storage.createFile(bucketId, ID.unique(), file)
  return uploaded.$id
}
