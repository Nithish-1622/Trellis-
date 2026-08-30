import { useEffect, useRef, useState } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import trellisLogo from '../../assets/trellis.png'
import { useAuth } from '../../hooks/useAuth'
import { useThemeContext } from '../../hooks/useThemeContext'
import { getApiSession } from '../../services/adminCatalogService'
import ThemeToggle from '../landing-page-components/ThemeToggle'

const primaryLinks = [
  { to: '/profile', label: 'Dashboard' },
  { to: '/roadmap', label: 'Roadmap' },
  { to: '/jobs', label: 'Jobs' },
  { to: '/practice', label: 'Practice' },
  { to: '/chat', label: 'Assistant' },
]

const pageTitles: Record<string, string> = {
  '/profile': 'Dashboard',
  '/roadmap': 'Learning Roadmap',
  '/jobs': 'Jobs',
  '/practice': 'Interview Practice',
  '/chat': 'Learning Assistant',
  '/onboarding': 'Learning Profile',
  '/admin/resources': 'Resource Catalog',
}

const navLinkClass = ({ isActive }: { isActive: boolean }) => `flex min-h-10 items-center rounded-lg px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 ${isActive ? 'bg-emerald-50 text-emerald-900 dark:bg-emerald-950/60 dark:text-emerald-100' : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-950 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-white'}`

export default function AppShell() {
  const { user, logout } = useAuth()
  const { darkMode, toggleTheme } = useThemeContext()
  const location = useLocation()
  const navigate = useNavigate()
  const firstMobileLink = useRef<HTMLAnchorElement>(null)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [logoutError, setLogoutError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    getApiSession()
      .then((session) => { if (active) setIsAdmin(session.roles.includes('admin')) })
      .catch(() => { if (active) setIsAdmin(false) })
    return () => { active = false }
  }, [])

  useEffect(() => {
    const basePath = Object.keys(pageTitles).find((path) => location.pathname === path) || ''
    document.title = `${pageTitles[basePath] || 'Learning'} | Trellis`
  }, [location.pathname])

  useEffect(() => {
    if (isMenuOpen) firstMobileLink.current?.focus()
  }, [isMenuOpen])

  const handleLogout = async () => {
    setLogoutError(null)
    setIsLoggingOut(true)
    try {
      await logout()
      navigate('/login', { replace: true })
    } catch (caught) {
      setLogoutError(caught instanceof Error ? caught.message : 'We could not log you out. Please try again.')
    } finally {
      setIsLoggingOut(false)
    }
  }

  const links = isAdmin ? [...primaryLinks, { to: '/admin/resources', label: 'Catalog' }] : primaryLinks
  const initials = user?.name?.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join('').toUpperCase() || 'L'

  return (
    <div className="min-h-dvh bg-zinc-50 text-zinc-950 dark:bg-zinc-950 dark:text-zinc-100">
      <a href="#app-content" className="fixed left-3 top-3 z-[60] -translate-y-20 rounded-lg bg-zinc-950 px-4 py-2 text-sm font-semibold text-white focus:translate-y-0 dark:bg-white dark:text-zinc-950">Skip to content</a>
      <header className="sticky top-0 z-50 border-b border-zinc-200 bg-white/95 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/95">
        <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 sm:px-6">
          <NavLink to="/profile" end className="flex shrink-0 items-center gap-2 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600">
            <img src={trellisLogo} alt="" className="h-8 w-auto" />
            <span className="text-lg font-bold tracking-tight">Trellis</span>
          </NavLink>

          <nav aria-label="Main" className="ml-4 hidden min-w-0 flex-1 items-center gap-1 lg:flex">
            {links.map((link) => <NavLink key={link.to} to={link.to} end className={navLinkClass}>{link.label}</NavLink>)}
          </nav>

          <div className="ml-auto flex items-center gap-2">
            <ThemeToggle darkMode={darkMode} toggleTheme={toggleTheme} />
            <div className="hidden items-center gap-2 border-l border-zinc-200 pl-3 sm:flex dark:border-zinc-800">
              <span aria-hidden="true" className="grid h-8 w-8 place-items-center rounded-full bg-emerald-100 text-xs font-bold text-emerald-900 dark:bg-emerald-950 dark:text-emerald-100">{initials}</span>
              <span className="max-w-32 truncate text-sm font-medium">{user?.name || 'Learner'}</span>
              <button type="button" onClick={() => void handleLogout()} disabled={isLoggingOut} className="min-h-10 rounded-lg px-3 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-100 hover:text-zinc-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 disabled:opacity-60 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-white">{isLoggingOut ? 'Logging out…' : 'Log out'}</button>
            </div>
            <button type="button" aria-label={isMenuOpen ? 'Close navigation menu' : 'Open navigation menu'} aria-expanded={isMenuOpen} aria-controls="mobile-navigation" onClick={() => setIsMenuOpen((open) => !open)} className="grid min-h-11 min-w-11 place-items-center rounded-lg border border-zinc-300 text-zinc-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 lg:hidden dark:border-zinc-700 dark:text-zinc-200">
              <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">{isMenuOpen ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}</svg>
            </button>
          </div>
        </div>

        {isMenuOpen && <nav id="mobile-navigation" aria-label="Mobile" className="border-t border-zinc-200 px-4 py-3 lg:hidden dark:border-zinc-800"><div className="mx-auto grid max-w-7xl gap-1">{links.map((link, index) => <NavLink ref={index === 0 ? firstMobileLink : undefined} key={link.to} to={link.to} end onClick={() => setIsMenuOpen(false)} className={navLinkClass}>{link.label}</NavLink>)}<button type="button" onClick={() => void handleLogout()} disabled={isLoggingOut} className="min-h-11 rounded-lg px-3 py-2 text-left text-sm font-medium text-red-700 hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-600 disabled:opacity-60 dark:text-red-300 dark:hover:bg-red-950/40">{isLoggingOut ? 'Logging out…' : 'Log out'}</button></div></nav>}
        {logoutError && <p role="alert" className="border-t border-red-200 bg-red-50 px-4 py-2 text-center text-sm text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-200">{logoutError}</p>}
      </header>
      <div id="app-content" tabIndex={-1} className="min-h-[calc(100dvh-4rem)] focus:outline-none">
        <Outlet />
      </div>
    </div>
  )
}
