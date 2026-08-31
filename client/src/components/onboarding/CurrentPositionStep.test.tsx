import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const { previewResumeCapabilities, storeAcceptedResume } = vi.hoisted(() => ({
  previewResumeCapabilities: vi.fn(),
  storeAcceptedResume: vi.fn(),
}))

vi.mock('../../services/learningHistoryService', () => ({
  previewResumeCapabilities,
  storeAcceptedResume,
}))

import CurrentPositionStep from './CurrentPositionStep'

describe('CurrentPositionStep', () => {
  beforeEach(() => vi.clearAllMocks())

  it('lets the learner review resume capabilities before applying them', async () => {
    previewResumeCapabilities.mockResolvedValue({
      filename: 'resume.pdf',
      resume_file_id: null,
      current_role: 'Backend Engineer',
      experience_years: 4.5,
      education_level: 'BSc Computer Science',
      skills: [
        { name: 'Python', proficiency: 'advanced', rationale: 'Used in two recent roles.' },
        { name: 'Docker', proficiency: 'intermediate', rationale: null },
      ],
      certifications: ['AWS Developer Associate'],
      projects: ['Payments API'],
    })
    storeAcceptedResume.mockResolvedValue('resume-file-1')
    const onChange = vi.fn()
    render(<CurrentPositionStep value={{ current_role: '', experience_years: null, education_level: '', interests: [], skills: [] }} onChange={onChange} />)

    fireEvent.change(screen.getByLabelText('Upload resume for capability suggestions'), {
      target: { files: [new File(['%PDF-test'], 'resume.pdf', { type: 'application/pdf' })] },
    })

    expect(await screen.findByText('Backend Engineer')).toBeVisible()
    expect(screen.getByText('Python · Advanced')).toBeVisible()
    expect(onChange).not.toHaveBeenCalled()

    fireEvent.click(screen.getByRole('button', { name: 'Use these suggestions' }))

    await waitFor(() => expect(onChange).toHaveBeenCalledWith(expect.objectContaining({
      current_role: 'Backend Engineer',
      experience_years: 4.5,
      education_level: 'BSc Computer Science',
      resume_filename: 'resume.pdf',
      resume_file_id: 'resume-file-1',
      resume_certifications: ['AWS Developer Associate'],
      resume_projects: ['Payments API'],
      skills: [
        { name: 'Python', proficiency: 'advanced', evidence_source: 'resume', evidence_rationale: 'Used in two recent roles.' },
        { name: 'Docker', proficiency: 'intermediate', evidence_source: 'resume', evidence_rationale: null },
      ],
    })))
  })
})
