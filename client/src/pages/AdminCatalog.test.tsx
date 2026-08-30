import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const catalog = vi.hoisted(() => ({
  getApiSession: vi.fn(), listResources: vi.fn(), syncProviderResources: vi.fn(),
  updateResource: vi.fn(), archiveResource: vi.fn(), checkResourceLink: vi.fn(),
  createResource: vi.fn(), bulkCreateResources: vi.fn(),
}))
vi.mock('../services/adminCatalogService', () => catalog)
vi.mock('../hooks/useThemeContext', () => ({ useThemeContext: () => ({ darkMode: false }) }))

import AdminCatalog from './AdminCatalog'

describe('Admin catalog', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    catalog.getApiSession.mockResolvedValue({ user_id: 'admin', roles: ['learner', 'admin'] })
    catalog.listResources.mockResolvedValue({ items: [{ id: 'r1', title: 'API Course', provider: 'Trellis', resource_type: 'course', url: 'https://example.com/course', verification_status: 'pending', link_status: 'unchecked', topics: [] }], total: 1, limit: 100, offset: 0 })
    catalog.syncProviderResources.mockResolvedValue({ created: 1, skipped: 0, items: [] })
  })

  it('lists resources and exposes review and provider sync actions', async () => {
    render(<MemoryRouter><AdminCatalog /></MemoryRouter>)

    expect(await screen.findByText('API Course')).toBeVisible()
    fireEvent.change(screen.getByLabelText('Provider search'), { target: { value: 'backend APIs' } })
    fireEvent.click(screen.getByRole('button', { name: 'Sync as pending' }))
    await waitFor(() => expect(catalog.syncProviderResources).toHaveBeenCalledWith('backend APIs'))
    expect(screen.getByRole('button', { name: 'Verify API Course' })).toBeVisible()
    expect(screen.getByRole('button', { name: 'Check API Course link' })).toBeVisible()
  })

  it('does not reveal catalog controls to non-admin users', async () => {
    catalog.getApiSession.mockResolvedValue({ user_id: 'learner', roles: ['learner'] })
    render(<MemoryRouter><AdminCatalog /></MemoryRouter>)

    expect(await screen.findByRole('heading', { name: 'Administrator access required' })).toBeVisible()
    expect(catalog.listResources).not.toHaveBeenCalled()
  })
})
