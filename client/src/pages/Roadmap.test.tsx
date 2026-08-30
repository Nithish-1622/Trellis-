import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const { getCurrentRoadmap, createRoadmap, updateMilestoneProgress, completeMilestone } = vi.hoisted(() => ({
  getCurrentRoadmap: vi.fn(), createRoadmap: vi.fn(), updateMilestoneProgress: vi.fn(), completeMilestone: vi.fn(),
}))
const { getPendingAdaptation, createAdaptation, acceptAdaptation, rejectAdaptation } = vi.hoisted(() => ({ getPendingAdaptation: vi.fn(), createAdaptation: vi.fn(), acceptAdaptation: vi.fn(), rejectAdaptation: vi.fn() }))

vi.mock('../services/roadmapService', () => ({ getCurrentRoadmap, createRoadmap, updateMilestoneProgress, completeMilestone }))
vi.mock('../services/adaptationService', () => ({ getPendingAdaptation, createAdaptation, acceptAdaptation, rejectAdaptation }))
vi.mock('../hooks/useThemeContext', () => ({ useThemeContext: () => ({ darkMode: false, toggleTheme: vi.fn() }) }))

import Roadmap from './Roadmap'

const roadmap = {
  id: 'roadmap-1', target_role: 'Backend Engineer', objective: 'Build APIs', version_id: 'version-1', version_number: 1,
  status: 'active', estimated_completion_weeks: 8, generated_at: '2026-08-30T00:00:00Z', skill_gaps: ['api design'],
  milestones: [{
    id: 'milestone-1', stable_key: 'api-design', title: 'Design reliable APIs', description: 'Build an API.', sequence: 1,
    prerequisite_keys: [], target_skills: ['api design'], estimated_hours: 10, scheduled_start: '2026-08-30T00:00:00Z', deadline: '2026-09-10T00:00:00Z',
    status: 'not_started', progress_percentage: 0,
    recommended_resources: [{ id: 'resource-1', title: 'API Engineering', provider: 'Example', type: 'course', url: 'https://learn.example.test/api', explanation: 'Verified course covering APIs.', provenance: 'verified_catalog' }],
    assessment_config: {}, explanation: { why: 'Your goal requires API design.', confidence: 0.8, provenance: ['learner_profile'] }, reflection: null, completed_at: null,
  }],
}

describe('Roadmap page', () => {
  beforeEach(() => { vi.clearAllMocks(); getCurrentRoadmap.mockResolvedValue(roadmap); getPendingAdaptation.mockResolvedValue(null) })

  it('shows explained milestones and only provider-backed resource links', async () => {
    render(<MemoryRouter><Roadmap /></MemoryRouter>)

    expect(await screen.findByRole('heading', { name: 'Backend Engineer roadmap' })).toBeVisible()
    expect(screen.getByText('Your goal requires API design.')).toBeVisible()
    expect(screen.getByRole('link', { name: /API Engineering/ })).toHaveAttribute('href', 'https://learn.example.test/api')
  })

  it('updates a milestone without losing the roadmap', async () => {
    updateMilestoneProgress.mockResolvedValue({ ...roadmap.milestones[0], status: 'in_progress', progress_percentage: 25 })
    render(<MemoryRouter><Roadmap /></MemoryRouter>)
    await screen.findByText('Design reliable APIs')

    fireEvent.click(screen.getByRole('button', { name: 'Record 25% progress' }))

    await waitFor(() => expect(updateMilestoneProgress).toHaveBeenCalledWith('roadmap-1', 'milestone-1', 25))
    expect(screen.getByText('25% complete')).toBeVisible()
  })
})
