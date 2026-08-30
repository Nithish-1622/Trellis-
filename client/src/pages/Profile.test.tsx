import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const { getDashboard } = vi.hoisted(() => ({ getDashboard: vi.fn() }))
vi.mock('../services/dashboardService', () => ({ getDashboard }))
vi.mock('../hooks/useAuth', () => ({ useAuth: () => ({ user: { name: 'Pilot Learner', email: 'pilot@example.com' }, logout: vi.fn() }) }))
vi.mock('../hooks/useThemeContext', () => ({ useThemeContext: () => ({ darkMode: false, toggleTheme: vi.fn() }) }))

import Profile from './Profile'

describe('Profile dashboard', () => {
  beforeEach(() => getDashboard.mockResolvedValue({
    roadmap: { id: 'r1', target_role: 'Backend Engineer', version_number: 1, progress_percentage: 35, completed_milestones: 1, total_milestones: 5 },
    weekly_effort_minutes: 180, skill_growth: [{ id: 's1', name: 'Python', canonical_name: 'python', proficiency: 'intermediate', estimated_score: 0.68, confidence: 0.75, evidence_count: 3, trend: 0.18, source: 'self_reported' }],
    recent_assessments: [{ id: 'a1', milestone_id: 'm1', assessment_type: 'quiz', score: 0.8, provisional: false, created_at: '2026-08-30T00:00:00Z' }],
    deadlines: [{ milestone_id: 'm1', title: 'API design', deadline: '2026-09-10T00:00:00Z', status: 'in_progress' }],
    blockers: [], streak_days: 3,
    next_action: { action_type: 'continue_milestone', title: 'Continue API design', explanation: 'Its prerequisites are complete.', href: '/roadmap#m1', milestone_id: 'm1' },
  }))

  it('shows progress, skill confidence, and one explained next action', async () => {
    render(<MemoryRouter><Profile /></MemoryRouter>)

    expect(await screen.findByRole('heading', { name: 'Continue API design' })).toBeVisible()
    expect(screen.getByText('Its prerequisites are complete.')).toBeVisible()
    expect(screen.getByText('35%')).toBeVisible()
    expect(screen.getByText(/75% confidence/)).toBeVisible()
    expect(screen.getByText('3 day streak')).toBeVisible()
  })
})
