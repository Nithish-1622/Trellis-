import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const { logout, getApiSession } = vi.hoisted(() => ({
  logout: vi.fn(),
  getApiSession: vi.fn(),
}))

vi.mock('../../hooks/useAuth', () => ({ useAuth: () => ({ user: { name: 'Ada Lovelace' }, logout }) }))
vi.mock('../../hooks/useThemeContext', () => ({ useThemeContext: () => ({ darkMode: false, toggleTheme: vi.fn() }) }))
vi.mock('../../services/adminCatalogService', () => ({ getApiSession }))

import AppShell from './AppShell'

const renderShell = () => render(
  <MemoryRouter initialEntries={['/roadmap']}>
    <Routes>
      <Route element={<AppShell />}>
        <Route path="/roadmap" element={<main><h1>Roadmap page</h1></main>} />
      </Route>
      <Route path="/login" element={<h1>Login page</h1>} />
    </Routes>
  </MemoryRouter>,
)

describe('AppShell', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    getApiSession.mockResolvedValue({ roles: ['learner'] })
  })

  it('provides consistent navigation with a current-page state and mobile disclosure', async () => {
    renderShell()

    expect(screen.getByRole('link', { name: 'Roadmap' })).toHaveAttribute('aria-current', 'page')
    expect(screen.getByRole('link', { name: 'Dashboard' })).toHaveAttribute('href', '/profile')
    const menu = screen.getByRole('button', { name: 'Open navigation menu' })
    expect(menu).toHaveAttribute('aria-expanded', 'false')

    fireEvent.click(menu)

    expect(menu).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByRole('navigation', { name: 'Mobile' })).toBeVisible()
    await waitFor(() => expect(getApiSession).toHaveBeenCalled())
  })

  it('logs out from the shared navigation', async () => {
    logout.mockResolvedValue(undefined)
    renderShell()

    fireEvent.click(screen.getByRole('button', { name: 'Log out' }))

    expect(await screen.findByRole('heading', { name: 'Login page' })).toBeVisible()
    expect(logout).toHaveBeenCalledOnce()
  })
})
