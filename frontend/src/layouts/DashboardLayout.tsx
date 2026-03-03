import { useEffect, useState } from 'react'
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom'
import { getToken } from '../api/http'
import { getMe, logout } from '../api/auth'
import type { UserMe } from '../api/auth'
import './DashboardLayout.css'

export function DashboardLayout() {
  const navigate = useNavigate()
  const location = useLocation()
  const [user, setUser] = useState<UserMe | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!getToken()) {
      navigate('/', { replace: true })
      return
    }
    getMe()
      .then(setUser)
      .catch(() => {
        logout()
        navigate('/', { replace: true })
      })
      .finally(() => setLoading(false))
  }, [navigate])

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
          <span className="dashboard__user" title={user?.email ?? ''}>{user?.email ?? '—'}</span>
          <NavLink to="/dashboard/settings" className="dashboard__settings" aria-label="Settings">⚙</NavLink>
          <button type="button" className="dashboard__logout" onClick={handleLogout}>Log out</button>
        </div>
      </header>
      <div className="dashboard__body">
        <aside className="dashboard__sidenav">
          <nav className="dashboard__nav">
            <div className="dashboard__nav-section">
              <div className="dashboard__nav-label">Main</div>
              <NavLink to="/dashboard" className={({ isActive }) => `dashboard__nav-link dashboard__nav-link--parent ${isActive ? 'active' : ''}`}>
                <span>🏠</span><span>Home</span>
              </NavLink>
            </div>
            <div className="dashboard__nav-section">
              <div className="dashboard__nav-label">Recipes</div>
              <NavLink to="/dashboard/recipes" className={({ isActive }) => `dashboard__nav-link ${isActive && path === '/dashboard/recipes' ? 'active' : ''}`}>
                <span>📋</span><span>All recipes</span>
              </NavLink>
              <NavLink to="/dashboard/recipes/new" className={({ isActive }) => `dashboard__nav-link ${isActive ? 'active' : ''}`}>
                <span>➕</span><span>New recipe</span>
              </NavLink>
            </div>
            <div className="dashboard__nav-section">
              <div className="dashboard__nav-label">Events</div>
              <NavLink to="/dashboard/events" className={({ isActive }) => `dashboard__nav-link ${isActive && path === '/dashboard/events' ? 'active' : ''}`}>
                <span>📅</span><span>All events</span>
              </NavLink>
              <NavLink to="/dashboard/events/new" className={({ isActive }) => `dashboard__nav-link ${isActive ? 'active' : ''}`}>
                <span>➕</span><span>New event</span>
              </NavLink>
            </div>
            <div className="dashboard__nav-section">
              <div className="dashboard__nav-label">Account</div>
              <NavLink to="/dashboard/settings" className={({ isActive }) => `dashboard__nav-link dashboard__nav-link--parent ${isActive ? 'active' : ''}`}>
                <span>⚙</span><span>Settings</span>
              </NavLink>
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
