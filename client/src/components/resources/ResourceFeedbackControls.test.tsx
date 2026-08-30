import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const { recordResourceInteraction } = vi.hoisted(() => ({ recordResourceInteraction: vi.fn() }))
vi.mock('../../services/resourceService', () => ({ recordResourceInteraction }))

import ResourceFeedbackControls from './ResourceFeedbackControls'

const resource = { id: 'resource-1', title: 'API Engineering', provider: 'Trellis', type: 'course', url: 'https://example.test/api', explanation: 'Strong API coverage.', provenance: 'verified_catalog', status: 'vetted' as const, score: 91, confidence: .8 }

describe('ResourceFeedbackControls', () => {
  beforeEach(() => { vi.clearAllMocks(); recordResourceInteraction.mockResolvedValue({ id: 'event-1', created: true }) })

  it('records helpful feedback and opens an accessible report form', async () => {
    render(<ResourceFeedbackControls resource={resource} milestoneId="milestone-1" />)
    await waitFor(() => expect(recordResourceInteraction).toHaveBeenCalledWith('resource-1', expect.objectContaining({ event_type: 'impression', milestone_id: 'milestone-1' })))

    fireEvent.click(screen.getByRole('button', { name: 'Helpful' }))
    expect(await screen.findByRole('status')).toHaveTextContent('feedback was recorded')
    fireEvent.click(screen.getByRole('button', { name: 'Report' }))
    fireEvent.change(screen.getByLabelText('What should we review?'), { target: { value: 'This tutorial is outdated.' } })
    fireEvent.click(screen.getByRole('button', { name: 'Send report' }))

    await waitFor(() => expect(recordResourceInteraction).toHaveBeenCalledWith('resource-1', expect.objectContaining({ event_type: 'report', report_reason: 'This tutorial is outdated.' })))
  })
})
