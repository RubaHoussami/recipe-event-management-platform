import { Link, useOutletContext } from 'react-router-dom'
import type { UserMe } from '../api/auth'
import './DashboardHome.css'

export function DashboardHome() {
  const { user } = useOutletContext<{ user: UserMe | null }>()
  const name = user?.name?.trim() || user?.email?.split('@')[0] || 'there'

  return (
    <div className="dashboard-home">
      <div className="dashboard-home__hero">
        <h1>Welcome back, {name}</h1>
        <p>Manage your recipes and events from the sidebar, or use the shortcuts below.</p>
      </div>
      <div className="dashboard-home__cards">
        <Link to="/dashboard/recipes" className="dashboard-home__card">
          <span className="dashboard-home__card-icon">📋</span>
          <h2>Recipes</h2>
          <p>View, create, and edit recipes. Search and filter by cuisine or tags.</p>
          <span className="dashboard-home__card-cta">Open recipes →</span>
        </Link>
        <Link to="/dashboard/recipes/new" className="dashboard-home__card">
          <span className="dashboard-home__card-icon">➕</span>
          <h2>New recipe</h2>
          <p>Add a new recipe manually or paste text and use AI to parse it.</p>
          <span className="dashboard-home__card-cta">Create recipe →</span>
        </Link>
        <Link to="/dashboard/events" className="dashboard-home__card">
          <span className="dashboard-home__card-icon">📅</span>
          <h2>Events</h2>
          <p>View and manage your events and invites.</p>
          <span className="dashboard-home__card-cta">Open events →</span>
        </Link>
        <Link to="/dashboard/settings" className="dashboard-home__card">
          <span className="dashboard-home__card-icon">⚙</span>
          <h2>Settings</h2>
          <p>Profile and OpenAI API key for AI-powered recipe parsing.</p>
          <span className="dashboard-home__card-cta">Open settings →</span>
        </Link>
      </div>
    </div>
  )
}
