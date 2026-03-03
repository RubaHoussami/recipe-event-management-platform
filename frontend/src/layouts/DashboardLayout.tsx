import { useEffect } from 'react'
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { getToken } from '../api/http'
import { getMe, logout } from '../api/auth'
import type { UserMe } from '../api/auth'
import { useMyAvatarUrl } from '../hooks/useMyAvatarUrl'
import { useTheme } from '../contexts/ThemeContext'
import {
  IconAdd,
  IconDarkMode,
  IconEvents,
  IconFriends,
  IconHome,
  IconLightMode,
  IconLogout,
  IconNotifications,
  IconRecipes,
  IconSettings,
} from '../components/Icons'
import './DashboardLayout.css'

export function DashboardLayout() {
  const navigate = useNavigate()
  const location = useLocation()
  const { theme, toggleTheme } = useTheme()
  const hasToken = !!getToken()
  const { data: user, isLoading: loading, isError } = useQuery({
    queryKey: ['auth', 'me'],
    queryFn: getMe,
    enabled: hasToken,
  })
  const avatarUrl = useMyAvatarUrl(user ?? null)

  useEffect(() => {
    if (!hasToken) {
      navigate('/', { replace: true })
      return
    }
    if (isError) {
      logout()
      navigate('/', { replace: true })
    }
  }, [hasToken, isError, navigate])

  function handleLogout() {
    logout()
    navigate('/', { replace: true })
  }

  if (loading) return <div className="dashboard-loading">Loading…</div>

  const path = location.pathname

  return (
    <div className="dashboard">
      <header className="dashboard__topbar">
        <NavLink to="/dashboard" className="dashboard__brand">Recipes & Events</NavLink>
        <div className="dashboard__topbar-right">
          <button type="button" className="dashboard__theme-toggle" onClick={toggleTheme} aria-label={theme === 'dark' ? 'Light mode' : 'Dark mode'} title={theme === 'dark' ? 'Light mode' : 'Dark mode'}>
            {theme === 'dark' ? <IconLightMode className="app-icon icon--sm" /> : <IconDarkMode className="app-icon icon--sm" />}
          </button>
          <NavLink to="/dashboard/notifications" className="dashboard__notifications" aria-label="Notifications"><IconNotifications className="app-icon icon--sm" /></NavLink>
          <NavLink to="/dashboard/friends" className="dashboard__friends" aria-label="Friends"><IconFriends className="app-icon icon--sm" /></NavLink>
          <span className="dashboard__user" title={user?.email ?? ''}>
            <span className="dashboard__user-name">{(user?.name || user?.email) ?? '—'}</span>
            {avatarUrl ? <img src={avatarUrl} alt="" className="dashboard__avatar" /> : <span className="dashboard__avatar dashboard__avatar--placeholder">{(user?.name || user?.email || '?')[0].toUpperCase()}</span>}
          </span>
        </div>
      </header>
      <div className="dashboard__body">
        <aside className="dashboard__sidenav">
          <nav className="dashboard__nav">
            <div className="dashboard__nav-sections">
              <div className="dashboard__nav-section">
                <div className="dashboard__nav-label">Main</div>
                <NavLink to="/dashboard" className={({ isActive }) => `dashboard__nav-link dashboard__nav-link--parent ${isActive ? 'active' : ''}`}>
                  <IconHome className="app-icon" /><span className="dashboard__nav-link-text">Home</span>
                </NavLink>
              </div>
              <div className="dashboard__nav-section">
                <div className="dashboard__nav-label">Recipes</div>
                <NavLink to="/dashboard/recipes" className={({ isActive }) => `dashboard__nav-link ${isActive && path === '/dashboard/recipes' ? 'active' : ''}`}>
                  <IconRecipes className="app-icon" /><span className="dashboard__nav-link-text">All recipes</span>
                </NavLink>
                <NavLink to="/dashboard/recipes/new" className={({ isActive }) => `dashboard__nav-link ${isActive ? 'active' : ''}`}>
                  <IconAdd className="app-icon" /><span className="dashboard__nav-link-text">New recipe</span>
                </NavLink>
              </div>
              <div className="dashboard__nav-section">
                <div className="dashboard__nav-label">Events</div>
                <NavLink to="/dashboard/events" className={({ isActive }) => `dashboard__nav-link ${isActive && path === '/dashboard/events' ? 'active' : ''}`}>
                  <IconEvents className="app-icon" /><span className="dashboard__nav-link-text">All events</span>
                </NavLink>
                <NavLink to="/dashboard/events/new" className={({ isActive }) => `dashboard__nav-link ${isActive ? 'active' : ''}`}>
                  <IconAdd className="app-icon" /><span className="dashboard__nav-link-text">New event</span>
                </NavLink>
              </div>
              <div className="dashboard__nav-section">
                <div className="dashboard__nav-label">Social</div>
                <NavLink to="/dashboard/friends" className={({ isActive }) => `dashboard__nav-link ${isActive ? 'active' : ''}`}>
                  <IconFriends className="app-icon" /><span className="dashboard__nav-link-text">Friends</span>
                </NavLink>
                <NavLink to="/dashboard/notifications" className={({ isActive }) => `dashboard__nav-link ${isActive ? 'active' : ''}`}>
                  <IconNotifications className="app-icon" /><span className="dashboard__nav-link-text">Notifications</span>
                </NavLink>
              </div>
            </div>
            <div className="dashboard__nav-section dashboard__nav-section--bottom">
              <div className="dashboard__nav-label">Account</div>
              <NavLink to="/dashboard/settings" className={({ isActive }) => `dashboard__nav-link dashboard__nav-link--parent ${isActive ? 'active' : ''}`}>
                <IconSettings className="app-icon" /><span className="dashboard__nav-link-text">Settings</span>
              </NavLink>
              <button type="button" className="dashboard__nav-link dashboard__nav-link--parent dashboard__nav-link--logout" onClick={handleLogout}>
                <IconLogout className="app-icon" /><span className="dashboard__nav-link-text">Log out</span>
              </button>
            </div>
          </nav>
        </aside>
        <main className="dashboard__main">
          <Outlet context={{ user }} />
        </main>
      </div>
    </div>
  )
}
