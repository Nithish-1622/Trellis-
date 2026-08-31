import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'

const { sendChatMessage } = vi.hoisted(() => ({ sendChatMessage: vi.fn() }))
vi.mock('../services/chatService', () => ({ sendChatMessage }))

import Chat from './Chat'

describe('Chat', () => {
  it('renders confirmation-safe typed actions from the assistant', async () => {
    sendChatMessage.mockResolvedValue({ message: 'I can propose this, but your approval is required.', actions: [{ action_type: 'request_adaptation', label: 'Review adaptation options', payload: {}, requires_confirmation: true }], suggestions: [], context: { roadmap_id: 'r1' } })
    render(<MemoryRouter><Chat /></MemoryRouter>)

    fireEvent.change(screen.getByLabelText('Message Trellis'), { target: { value: 'Remove this milestone' } })
    fireEvent.click(screen.getByRole('button', { name: 'Send message' }))

    expect(await screen.findByText('I can propose this, but your approval is required.')).toBeVisible()
    expect(screen.getByRole('button', { name: /Review adaptation options/ })).toHaveTextContent('Approval required')
  })
})
