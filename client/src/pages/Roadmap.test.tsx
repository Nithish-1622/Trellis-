import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const { getCurrentRoadmap, createRoadmap, refreshRoadmapResources, updateMilestoneProgress, completeMilestone } = vi.hoisted(() => ({
  getCurrentRoadmap: vi.fn(), createRoadmap: vi.fn(), refreshRoadmapResources: vi.fn(), updateMilestoneProgress: vi.fn(), completeMilestone: vi.fn(),
}))
const { getPendingAdaptation, createAdaptation, acceptAdaptation, rejectAdaptation } = vi.hoisted(() => ({ getPendingAdaptation: vi.fn(), createAdaptation: vi.fn(), acceptAdaptation: vi.fn(), rejectAdaptation: vi.fn() }))
const { discoverResources, waitForDiscovery, recordResourceInteraction } = vi.hoisted(() => ({
  discoverResources: vi.fn(), waitForDiscovery: vi.fn(), recordResourceInteraction: vi.fn(),
}))

vi.mock('../services/roadmapService', () => ({ getCurrentRoadmap, createRoadmap, refreshRoadmapResources, updateMilestoneProgress, completeMilestone }))
vi.mock('../services/adaptationService', () => ({ getPendingAdaptation, createAdaptation, acceptAdaptation, rejectAdaptation }))
vi.mock('../services/resourceService', () => ({ discoverResources, waitForDiscovery, recordResourceInteraction }))
vi.mock('../hooks/useThemeContext', () => ({ useThemeContext: () => ({ darkMode: false, toggleTheme: vi.fn() }) }))

import Roadmap from './Roadmap'

const roadmap = {
  id: 'roadmap-1', target_role: 'Backend Engineer', objective: 'Build APIs', version_id: 'version-1', version_number: 1,
  status: 'active', estimated_completion_weeks: 8, generated_at: '2026-08-30T00:00:00Z', skill_gaps: ['api design'],
  milestones: [{
    id: 'milestone-1', stable_key: 'api-design', title: 'Design reliable APIs', description: 'Build an API.', sequence: 1,
    prerequisite_keys: [], target_skills: ['api design'], estimated_hours: 10, scheduled_start: '2026-08-30T00:00:00Z', deadline: '2026-09-10T00:00:00Z',
    status: 'not_started', progress_percentage: 0,
    recommended_resources: [
      { id: 'resource-1', title: 'API Engineering', provider: 'Example', type: 'course', url: 'https://learn.example.test/api', explanation: 'Verified course covering APIs.', provenance: 'verified_catalog' },
      { id: 'video-1', title: 'REST API Tutorial', provider: 'youtube', type: 'video', url: 'https://www.youtube.com/watch?v=video-1', thumbnail_url: 'https://i.ytimg.com/vi/video-1/mqdefault.jpg', author: 'API Teacher', duration_seconds: 1800, explanation: 'Metadata-vetted video covering API design.', provenance: 'vetted_index', status: 'vetted', score: 88, confidence: .8 },
    ],
    assessment_config: {}, explanation: { why: 'Your goal requires API design.', confidence: 0.8, provenance: ['learner_profile'] }, reflection: null, completed_at: null,
  }],
}

describe('Roadmap page', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    getCurrentRoadmap.mockResolvedValue(roadmap)
    getPendingAdaptation.mockResolvedValue(null)
    discoverResources.mockResolvedValue({ id: 'job-1', status: 'queued', progress: 0 })
    waitForDiscovery.mockResolvedValue({ id: 'job-1', status: 'completed', progress: 100 })
    recordResourceInteraction.mockResolvedValue({ id: 'interaction-1', created: true })
  })

  it('shows explained milestones and only provider-backed resource links', async () => {
    render(<MemoryRouter><Roadmap /></MemoryRouter>)

    expect(await screen.findByRole('heading', { name: 'Backend Engineer roadmap' })).toBeVisible()
    expect(screen.getByText('Your goal requires API design.')).toBeVisible()
    expect(screen.getByRole('link', { name: /API Engineering/ })).toHaveAttribute('href', 'https://learn.example.test/api')
    expect(screen.getByRole('img', { name: 'REST API Tutorial thumbnail' })).toHaveAttribute('loading', 'lazy')
    expect(screen.getByText('API Teacher · 30 min')).toBeVisible()
  })

  it('updates a milestone without losing the roadmap', async () => {
    updateMilestoneProgress.mockResolvedValue({ ...roadmap.milestones[0], status: 'in_progress', progress_percentage: 25 })
    render(<MemoryRouter><Roadmap /></MemoryRouter>)
    await screen.findByText('Design reliable APIs')

    fireEvent.click(screen.getByRole('button', { name: 'Record 25% progress' }))

    await waitFor(() => expect(updateMilestoneProgress).toHaveBeenCalledWith('roadmap-1', 'milestone-1', 25))
    expect(screen.getByText('25% complete')).toBeVisible()
  })

  it('refreshes deterministic recommendations and rebuilds the active roadmap', async () => {
    const refreshedRoadmap = {
      ...roadmap,
      version_number: 2,
      milestones: [{
        ...roadmap.milestones[0],
        recommended_resources: [{
          id: 'video-2', title: 'Spring Boot Tutorial', provider: 'youtube', type: 'video',
          url: 'https://www.youtube.com/watch?v=video-2', explanation: 'Metadata-vetted video.',
          provenance: 'vetted_index', status: 'vetted', score: 72, confidence: .8,
        }],
      }],
    }
    refreshRoadmapResources.mockResolvedValue(refreshedRoadmap)
    render(<MemoryRouter><Roadmap /></MemoryRouter>)
    await screen.findByRole('heading', { name: 'Backend Engineer roadmap' })

    fireEvent.click(screen.getByRole('button', { name: 'Refresh video recommendations' }))

    await waitFor(() => expect(discoverResources).toHaveBeenCalledOnce())
    expect(waitForDiscovery).toHaveBeenCalledWith('job-1', expect.any(Function))
    await waitFor(() => expect(refreshRoadmapResources).toHaveBeenCalledWith('roadmap-1'))
    expect(await screen.findByRole('link', { name: /Spring Boot Tutorial/ })).toBeVisible()
    expect(screen.getByText('Video recommendations refreshed.')).toBeVisible()
  })
})
