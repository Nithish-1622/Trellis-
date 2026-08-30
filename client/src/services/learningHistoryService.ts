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

export interface ResumeEvidence {
  filename: string
  skills_found: string[]
  skills_added: string[]
  evidence_count: number
  education_count: number
  experience_count: number
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

export const uploadResumeEvidence = async (file: File) => {
  const bucketId = import.meta.env.VITE_APPWRITE_BUCKET_ID
  if (!bucketId) throw new Error('Resume storage is not configured. Please contact support.')
  const uploaded = await storage.createFile(bucketId, ID.unique(), file)
  try {
    return await fileRequest<ResumeEvidence>('/v1/me/resume/parse', file, {
      resume_file_id: uploaded.$id,
    })
  } catch (error) {
    try {
      await storage.deleteFile(bucketId, uploaded.$id)
    } catch {
      // Parsing remains the primary error; orphan cleanup can be retried operationally.
    }
    throw error
  }
}
