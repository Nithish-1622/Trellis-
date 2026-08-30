import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const { getOnboarding, saveOnboarding, analyzeGoal } = vi.hoisted(() => ({
  getOnboarding: vi.fn(),
  saveOnboarding: vi.fn(),
  analyzeGoal: vi.fn(),
}))
const { createRoadmap } = vi.hoisted(() => ({ createRoadmap: vi.fn() }))
const { discoverResources, waitForDiscovery } = vi.hoisted(() => ({ discoverResources: vi.fn(), waitForDiscovery: vi.fn() }))

vi.mock('../../services/onboardingService', async (importOriginal) => {
  const original = await importOriginal<typeof import('../../services/onboardingService')>()
  return { ...original, getOnboarding, saveOnboarding, analyzeGoal }
})
vi.mock('../../services/roadmapService', () => ({ createRoadmap }))
vi.mock('../../services/resourceService', () => ({ discoverResources, waitForDiscovery }))

import OnboardingWizard from './OnboardingWizard'

const emptySession = {
  session_id: null,
  status: 'not_started' as const,
  current_step: 'goal' as const,
  completed_steps: [],
  draft: {
    goal: null,
    current_position: null,
    previous_learning: null,
    preferences: null,
  },
  updated_at: null,
  completed_at: null,
}

const renderWizard = () =>
  render(
    <MemoryRouter initialEntries={['/onboarding']}>
      <Routes>
        <Route path="/onboarding" element={<OnboardingWizard />} />
        <Route path="/profile" element={<h1>Profile home</h1>} />
      </Routes>
    </MemoryRouter>,
  )

const renderEditWizard = () => render(
  <MemoryRouter initialEntries={['/onboarding?edit=1']}>
    <Routes><Route path="/onboarding" element={<OnboardingWizard />} /><Route path="/profile" element={<h1>Profile home</h1>} /></Routes>
  </MemoryRouter>,
)

describe('OnboardingWizard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    getOnboarding.mockResolvedValue(emptySession)
    saveOnboarding.mockImplementation(async (update) => ({
      ...emptySession,
      session_id: 'session-1',
      status: update.complete ? 'completed' : 'in_progress',
      current_step: update.current_step,
      completed_steps: update.completed_steps,
      draft: update.draft,
    }))
    discoverResources.mockResolvedValue({ id: 'job-1', status: 'queued', progress: 0 })
    waitForDiscovery.mockResolvedValue({ id: 'job-1', status: 'completed', progress: 100 })
  })

  it('resumes a saved goal draft from the server', async () => {
    getOnboarding.mockResolvedValue({
      ...emptySession,
      session_id: 'session-1',
      status: 'in_progress',
      draft: {
        ...emptySession.draft,
        goal: {
          free_text: 'I want to become a backend engineer in twelve months.',
          target_role: 'Backend Engineer',
          objective: 'Build reliable distributed services',
          target_date: '2027-08-30',
        },
      },
    })

    renderWizard()

    expect(await screen.findByLabelText('What do you want to achieve?')).toHaveValue(
      'I want to become a backend engineer in twelve months.',
    )
    expect(screen.getByLabelText('Target role')).toHaveValue('Backend Engineer')
  })

  it('preserves goal answers while moving forward and back', async () => {
    renderWizard()
    await screen.findByLabelText('What do you want to achieve?')

    fireEvent.change(screen.getByLabelText('What do you want to achieve?'), {
      target: { value: 'I want to become a backend engineer in twelve months.' },
    })
    fireEvent.change(screen.getByLabelText('Target role'), {
      target: { value: 'Backend Engineer' },
    })
    fireEvent.change(screen.getByLabelText('Learning objective'), {
      target: { value: 'Build reliable distributed services' },
    })

    fireEvent.click(screen.getByRole('button', { name: 'Continue' }))
    expect(await screen.findByRole('heading', { name: 'Where are you starting from?' })).toBeVisible()

    fireEvent.click(screen.getByRole('button', { name: 'Back' }))

    expect(await screen.findByLabelText('Target role')).toHaveValue('Backend Engineer')
    expect(saveOnboarding).toHaveBeenCalled()
  })

  it('lets the learner review a structured goal proposal', async () => {
    analyzeGoal.mockResolvedValue({
      target_role: 'Backend Engineer',
      objective: 'Build and deploy reliable services',
      target_date: null,
      explanation: 'The role and outcome were stated directly.',
    })
    createRoadmap.mockResolvedValue({})
    renderWizard()
    const goal = await screen.findByLabelText('What do you want to achieve?')

    fireEvent.change(goal, {
      target: { value: 'I want to become a backend engineer in twelve months.' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Suggest goal details' }))

    expect(await screen.findByLabelText('Target role')).toHaveValue('Backend Engineer')
    expect(screen.getByLabelText('Learning objective')).toHaveValue('Build and deploy reliable services')
    expect(screen.getByText(/The role and outcome were stated directly/)).toBeVisible()
  })

  it('redirects returning learners whose onboarding is complete', async () => {
    getOnboarding.mockResolvedValue({ ...emptySession, status: 'completed' })

    renderWizard()

    expect(await screen.findByRole('heading', { name: 'Profile home' })).toBeVisible()
  })

  it('lets returning learners explicitly edit a completed profile', async () => {
    getOnboarding.mockResolvedValue({ ...emptySession, status: 'completed', draft: { ...emptySession.draft, goal: { free_text: 'Become a backend engineer this year', target_role: 'Backend Engineer', objective: 'Build APIs', target_date: null } } })

    renderEditWizard()

    expect(await screen.findByLabelText('Target role')).toHaveValue('Backend Engineer')
  })

  it('shows a recoverable save error without discarding answers', async () => {
    saveOnboarding.mockRejectedValueOnce(new Error('Connection lost'))
    renderWizard()
    await screen.findByLabelText('What do you want to achieve?')

    fireEvent.change(screen.getByLabelText('What do you want to achieve?'), {
      target: { value: 'I want to become a backend engineer in twelve months.' },
    })
    fireEvent.change(screen.getByLabelText('Target role'), {
      target: { value: 'Backend Engineer' },
    })
    fireEvent.change(screen.getByLabelText('Learning objective'), {
      target: { value: 'Build reliable distributed services' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Continue' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('Connection lost')
    expect(screen.getByLabelText('Target role')).toHaveValue('Backend Engineer')
    await waitFor(() => expect(screen.getByRole('button', { name: 'Continue' })).toBeEnabled())
  })

  it('retries when saved progress cannot be loaded', async () => {
    getOnboarding.mockRejectedValueOnce(new Error('Connection lost'))
    renderWizard()

    expect(await screen.findByRole('alert')).toHaveTextContent('Connection lost')
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }))

    expect(await screen.findByLabelText('What do you want to achieve?')).toBeVisible()
    expect(getOnboarding).toHaveBeenCalledTimes(2)
  })

  it('keeps confirmed profile data when roadmap generation fails', async () => {
    getOnboarding.mockResolvedValue({
      ...emptySession,
      current_step: 'review',
      completed_steps: ['goal', 'current_position', 'previous_learning', 'preferences'],
      draft: {
        goal: { free_text: 'Become a backend engineer this year', target_role: 'Backend Engineer', objective: 'Build reliable APIs', target_date: null },
        current_position: { current_role: '', experience_years: 0, education_level: '', interests: [], skills: [] },
        previous_learning: { courses: [] },
        preferences: { preferred_formats: [], project_theory_balance: 50, learning_pace: 'steady', weekly_hours: 8, preferred_language: 'English', budget: null, accessibility_needs: [], preferred_session_minutes: 45 },
      },
    })
    createRoadmap.mockRejectedValueOnce(new Error('Provider unavailable'))
    renderWizard()
    await screen.findByRole('heading', { name: 'Review your learning profile' })

    fireEvent.click(screen.getByRole('button', { name: 'Confirm and create roadmap' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('Your profile is saved')
    expect(screen.getByRole('button', { name: 'Retry roadmap generation' })).toBeEnabled()
    expect(saveOnboarding).toHaveBeenCalledWith(expect.objectContaining({ complete: true }))
  })
})
