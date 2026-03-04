import { Link, useOutletContext } from 'react-router-dom'
import type { UserMe } from '../api/auth'
import { IconAdd, IconEvents, IconFriends, IconNotifications, IconRecipes, IconSettings } from '../components/Icons'
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
          <span className="dashboard-home__card-icon"><IconRecipes className="app-icon icon--lg" /></span>
          <h2>Recipes</h2>
          <p>View, create, and edit recipes. Search and filter by cuisine or tags.</p>
          <span className="dashboard-home__card-cta">Open recipes →</span>
        </Link>
        <Link to="/dashboard/recipes/new" className="dashboard-home__card">
          <span className="dashboard-home__card-icon"><IconAdd className="app-icon icon--lg" /></span>
          <h2>New recipe</h2>
          <p>Add a new recipe manually or paste text and use AI to parse it.</p>
          <span className="dashboard-home__card-cta">Create recipe →</span>
        </Link>
        <Link to="/dashboard/events" className="dashboard-home__card">
          <span className="dashboard-home__card-icon"><IconEvents className="app-icon icon--lg" /></span>
          <h2>Events</h2>
          <p>View and manage your events and invites.</p>
          <span className="dashboard-home__card-cta">Open events →</span>
        </Link>
        <Link to="/dashboard/events/new" className="dashboard-home__card">
          <span className="dashboard-home__card-icon"><IconEvents className="app-icon icon--lg" /></span>
          <h2>New event</h2>
          <p>Create a new event with date, time, and location.</p>
          <span className="dashboard-home__card-cta">Create event →</span>
        </Link>
        <Link to="/dashboard/friends" className="dashboard-home__card">
          <span className="dashboard-home__card-icon"><IconFriends className="app-icon icon--lg" /></span>
          <h2>Friends</h2>
          <p>Add friends by email, see your friends list, and find people on the platform.</p>
          <span className="dashboard-home__card-cta">Open friends →</span>
        </Link>
        <Link to="/dashboard/notifications" className="dashboard-home__card">
          <span className="dashboard-home__card-icon"><IconNotifications className="app-icon icon--lg" /></span>
          <h2>Notifications</h2>
          <p>See when someone shares a recipe with you or accepts your event invite.</p>
          <span className="dashboard-home__card-cta">Open notifications →</span>
        </Link>
        <Link to="/dashboard/settings" className="dashboard-home__card">
          <span className="dashboard-home__card-icon"><IconSettings className="app-icon icon--lg" /></span>
          <h2>Settings</h2>
          <p>Profile, photo, and OpenAI API key for AI-powered recipe parsing.</p>
          <span className="dashboard-home__card-cta">Open settings →</span>
        </Link>
      </div>
    </div>
  )
}
