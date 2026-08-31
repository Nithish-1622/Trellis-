import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const catalog = vi.hoisted(() => ({
  getApiSession: vi.fn(), listResources: vi.fn(), previewProviderResources: vi.fn(),
  moderateResource: vi.fn(), reevaluateResource: vi.fn(), checkResourceLink: vi.fn(),
  createResource: vi.fn(), bulkCreateResources: vi.fn(),
}))
vi.mock('../services/adminCatalogService', () => catalog)

import AdminCatalog from './AdminCatalog'

describe('Admin resource exception console', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    catalog.getApiSession.mockResolvedValue({ user_id: 'admin', roles: ['learner', 'admin'] })
    catalog.listResources.mockResolvedValue({ items: [{ id: 'r1', title: 'API Course', provider: 'Trellis', resource_type: 'course', url: 'https://example.com/course', verification_status: 'vetted', link_status: 'healthy', topics: [], resource_score: 88, score_confidence: .55 }], total: 1, limit: 100, offset: 0 })
    catalog.previewProviderResources.mockResolvedValue([{ canonical_key: 'youtube:one', title: 'API tutorial', provider: 'youtube', resource_type: 'video', url: 'https://youtube.com/watch?v=one' }])
    catalog.moderateResource.mockResolvedValue({})
  })

  it('shows exception views and keeps provider search diagnostic-only', async () => {
    render(<MemoryRouter><AdminCatalog /></MemoryRouter>)

    expect(await screen.findByText('API Course')).toBeVisible()
    expect(catalog.listResources).toHaveBeenCalledWith({ exceptionCategory: 'reports' })
    fireEvent.click(screen.getByText('Provider diagnostics'))
    fireEvent.change(screen.getByLabelText('Diagnostic search'), { target: { value: 'backend APIs' } })
    fireEvent.click(screen.getByRole('button', { name: 'Preview results' }))
    expect(await screen.findByText('API tutorial')).toBeVisible()
    expect(catalog.previewProviderResources).toHaveBeenCalledWith('backend APIs')
    expect(screen.queryByText(/sync as pending/i)).not.toBeInTheDocument()
  })

  it('requires an administrator reason before moderation', async () => {
    render(<MemoryRouter><AdminCatalog /></MemoryRouter>)
    await screen.findByText('API Course')

    fireEvent.click(screen.getByRole('button', { name: 'Reject' }))
    expect(screen.getByRole('alert')).toHaveTextContent('Add a specific review reason')
    fireEvent.change(screen.getByLabelText('Review reason'), { target: { value: 'Learner reports show the material is outdated.' } })
    fireEvent.click(screen.getByRole('button', { name: 'Reject' }))

    await waitFor(() => expect(catalog.moderateResource).toHaveBeenCalledWith('r1', 'reject', 'Learner reports show the material is outdated.'))
  })

  it('does not reveal controls to non-admin users', async () => {
    catalog.getApiSession.mockResolvedValue({ user_id: 'learner', roles: ['learner'] })
    render(<MemoryRouter><AdminCatalog /></MemoryRouter>)

    expect(await screen.findByRole('heading', { name: 'Administrator access required' })).toBeVisible()
    expect(catalog.listResources).not.toHaveBeenCalled()
  })
})
