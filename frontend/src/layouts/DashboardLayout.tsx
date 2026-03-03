import { useEffect, useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { getToken } from '../api/http'
import { getMe, logout } from '../api/auth'
import type { UserMe } from '../api/auth'
import './DashboardLayout.css'

export function DashboardLayout() {
  const navigate = useNavigate()
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

  return (
    <div className="dashboard">
      <header className="dashboard__topbar">
        <span className="dashboard__brand">Recipes & Events</span>
        <div className="dashboard__topbar-right">
          <span className="dashboard__user">{user?.email ?? '—'}</span>
          <button type="button" className="dashboard__settings" aria-label="Settings">&#9881;</button>
          <button type="button" className="dashboard__logout" onClick={handleLogout}>Log out</button>
        </div>
      </header>
      <div className="dashboard__body">
        <aside className="dashboard__sidenav">
          <nav className="dashboard__nav">
            <NavLink to="/dashboard/recipes" className={({ isActive }) => isActive ? 'active' : ''}>Recipes</NavLink>
            <NavLink to="/dashboard/events" className={({ isActive }) => isActive ? 'active' : ''}>Events</NavLink>
          </nav>
        </aside>
        <main className="dashboard__main">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
