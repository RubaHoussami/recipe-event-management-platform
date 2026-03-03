import { Link } from 'react-router-dom'

export function EventsNewPage() {
  return (
    <div className="events-new-page">
      <div className="page-header">
        <h1>New event</h1>
        <Link to="/dashboard/events" className="btn-secondary">← All events</Link>
      </div>
      <div className="card">
        <p>Event creation form can be wired here when the backend supports it. For now, use <strong>All events</strong> to view and manage events.</p>
      </div>
    </div>
  )
}
