import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const { getMilestoneQuiz, submitQuiz, submitProject } = vi.hoisted(() => ({ getMilestoneQuiz: vi.fn(), submitQuiz: vi.fn(), submitProject: vi.fn() }))
vi.mock('../../services/assessmentService', () => ({ getMilestoneQuiz, submitQuiz, submitProject }))

import AssessmentPanel from './AssessmentPanel'

const milestone = {
  id: 'milestone-1', stable_key: 'python', title: 'Python foundations', description: null, sequence: 1,
  prerequisite_keys: [], target_skills: ['python'], estimated_hours: 8, scheduled_start: null, deadline: null,
  status: 'in_progress', progress_percentage: 25, recommended_resources: [], assessment_config: {},
  explanation: {}, reflection: null, completed_at: null,
}

describe('AssessmentPanel', () => {
  beforeEach(() => vi.clearAllMocks())

  it('submits every quiz answer and labels the objective result', async () => {
    getMilestoneQuiz.mockResolvedValue({ milestone_id: 'milestone-1', questions: [{ id: 'q1', prompt: 'Choose one', options: ['Correct', 'Wrong'] }] })
    const attempt = { id: 'attempt-1', milestone_id: 'milestone-1', assessment_type: 'quiz', score: 1, confidence: 0.95, rationale: '1 of 1 correct.', rubric: [], provisional: false, reflection: null, created_at: '2026-08-30T00:00:00Z' }
    submitQuiz.mockResolvedValue(attempt)
    const onEvidence = vi.fn()
    render(<AssessmentPanel milestone={milestone} onEvidence={onEvidence} />)

    fireEvent.click(screen.getByRole('button', { name: 'Take short quiz' }))
    fireEvent.click(await screen.findByLabelText('Correct'))
    fireEvent.click(screen.getByRole('button', { name: 'Submit quiz' }))

    expect(await screen.findByText(/Objective quiz score: 100%/)).toBeVisible()
    await waitFor(() => expect(onEvidence).toHaveBeenCalledWith(attempt))
  })
})
