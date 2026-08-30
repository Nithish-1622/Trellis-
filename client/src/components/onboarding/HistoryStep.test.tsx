import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const { previewLearningHistoryCsv, importLearningHistoryCsv, uploadResumeEvidence } = vi.hoisted(() => ({
  previewLearningHistoryCsv: vi.fn(),
  importLearningHistoryCsv: vi.fn(),
  uploadResumeEvidence: vi.fn(),
}))

vi.mock('../../services/learningHistoryService', () => ({
  previewLearningHistoryCsv,
  importLearningHistoryCsv,
  uploadResumeEvidence,
}))

import HistoryStep from './HistoryStep'

describe('HistoryStep', () => {
  beforeEach(() => vi.clearAllMocks())

  it('previews row errors before importing valid CSV courses', async () => {
    const course = { title: 'FastAPI Foundations', provider: 'Example', topics: ['Python'] }
    previewLearningHistoryCsv.mockResolvedValue({
      rows: [
        { row_number: 2, status: 'ready', course, errors: [] },
        { row_number: 3, status: 'invalid', course: null, errors: ['title is required'] },
      ],
      ready_count: 1,
      invalid_count: 1,
      duplicate_count: 0,
    })
    importLearningHistoryCsv.mockResolvedValue({ imported_count: 1 })
    const onChange = vi.fn()
    render(<HistoryStep value={{ courses: [] }} onChange={onChange} />)

    fireEvent.change(screen.getByLabelText('Upload completed courses CSV'), {
      target: { files: [new File(['csv'], 'history.csv', { type: 'text/csv' })] },
    })

    expect(await screen.findByText('Row 3: title is required')).toBeVisible()
    fireEvent.click(screen.getByRole('button', { name: 'Import 1 valid course' }))
    expect(importLearningHistoryCsv).toHaveBeenCalled()
    await waitFor(() => expect(onChange).toHaveBeenCalledWith({ courses: [course] }))
  })

  it('shows which skills resume evidence added', async () => {
    uploadResumeEvidence.mockResolvedValue({
      filename: 'resume.pdf',
      skills_found: ['Python', 'Docker'],
      skills_added: ['Docker'],
      evidence_count: 2,
      education_count: 1,
      experience_count: 2,
    })
    render(<HistoryStep value={{ courses: [] }} onChange={vi.fn()} />)

    fireEvent.change(screen.getByLabelText('Upload resume'), {
      target: { files: [new File(['pdf'], 'resume.pdf', { type: 'application/pdf' })] },
    })

    expect(await screen.findByText(/Added Docker/)).toBeVisible()
    expect(screen.getByText(/did not overwrite stronger evidence/)).toBeVisible()
  })
})
