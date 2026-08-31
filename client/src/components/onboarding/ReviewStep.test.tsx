import { render, screen } from '@testing-library/react'
import { expect, it, vi } from 'vitest'
import ReviewStep from './ReviewStep'

it('shows the learner which reviewed capabilities came from a resume', () => {
  render(<ReviewStep onEdit={vi.fn()} draft={{
    goal: { free_text: 'Become a backend engineer this year', target_role: 'Backend Engineer', objective: 'Build APIs' },
    current_position: {
      current_role: 'Backend Engineer', experience_years: 4.5, education_level: 'BSc Computer Science', interests: [],
      resume_filename: 'resume.pdf', resume_file_id: 'resume-file-1', resume_certifications: ['AWS Developer Associate'], resume_projects: ['Payments API'],
      skills: [{ name: 'Python', proficiency: 'advanced', evidence_source: 'resume' }],
    },
    previous_learning: { courses: [] },
    preferences: { preferred_formats: [], weekly_hours: 8, accessibility_needs: [] },
  }} />)

  expect(screen.getByText('Imported from resume.pdf')).toBeVisible()
  expect(screen.getByText(/Python \(advanced, resume\)/)).toBeVisible()
  expect(screen.getByText(/1 project · 1 certification/)).toBeVisible()
})
