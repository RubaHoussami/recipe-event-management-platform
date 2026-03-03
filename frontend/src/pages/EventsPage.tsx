import { Link } from 'react-router-dom'
import './EventsPage.css'


export function EventsPage() {
  return (
    <div className="events-page">
      <div className="page-header">
        <h1>Events</h1>
        <Link to="/dashboard/events/new" className="btn-primary">New event</Link>
      </div>
      <div className="card events-page__content">
        <p>Your events will appear here. Use <strong>New event</strong> from the sidebar or the button above when the feature is ready.</p>
        <Link to="/dashboard" className="btn-secondary" style={{ marginTop: '1rem', display: 'inline-block' }}>Back to dashboard</Link>
      </div>
    </div>
  )
}
