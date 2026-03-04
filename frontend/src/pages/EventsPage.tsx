import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { listEvents } from '../api/events'
import type { Event } from '../api/events'
import './EventsPage.css'

function formatEventDate(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleDateString(undefined, { dateStyle: 'medium' }) + (d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' }) !== '12:00 AM' ? ' · ' + d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' }) : '')
}

/** Turn YYYY-MM-DD into ISO datetime for API (start of day UTC). */
function dateToFromISO(date: string): string | undefined {
  if (!date) return undefined
  return date + 'T00:00:00.000Z'
}

/** Turn YYYY-MM-DD into ISO datetime for API (end of day UTC). */
function dateToEndISO(date: string): string | undefined {
  if (!date) return undefined
  return date + 'T23:59:59.999Z'
}

export function EventsPage() {
  const [q, setQ] = useState('')
  const [search, setSearch] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const { data, isLoading, error } = useQuery({
    queryKey: ['events', { q: search || undefined, date_from: dateFrom || undefined, date_to: dateTo || undefined, limit: 50, offset: 0 }],
    queryFn: () => listEvents({
      q: search || undefined,
      date_from: dateToFromISO(dateFrom),
      date_to: dateToEndISO(dateTo),
      limit: 50,
      offset: 0,
    }),
  })

  return (
    <div className="events-page">
      <div className="page-header">
        <h1>Events</h1>
        <Link to="/dashboard/events/new" className="btn-primary events-page__new">New event</Link>
      </div>
      <div className="events-page__toolbar">
        <input
          type="search"
          placeholder="Search title, description, location…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && setSearch(q)}
        />
        <button type="button" className="btn-primary" onClick={() => setSearch(q)}>Search</button>
      </div>
      <div className="events-page__filters">
        <label className="events-page__filter">
          <span className="events-page__filter-label">From date</span>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            aria-label="Filter events from date"
          />
        </label>
        <label className="events-page__filter">
          <span className="events-page__filter-label">To date</span>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            aria-label="Filter events to date"
          />
        </label>
      </div>
      {isLoading && <p className="events-page__loading">Loading…</p>}
      {error && <p className="events-page__error">Failed to load events.</p>}
      {data && (
        <>
          {data.items.length === 0 && (
            <div className="card events-page__empty">
              <p>No events yet. <Link to="/dashboard/events/new">Create one</Link> to get started.</p>
            </div>
          )}
          <ul className="events-page__list">
            {data.items.map((ev: Event) => (
              <li key={ev.id} className="events-page__item">
                <Link to={'/dashboard/events/' + ev.id} className="events-page__item-link card">
                  <span className="events-page__item-title">{ev.title}</span>
                  <span className="events-page__item-date">{formatEventDate(ev.start_time)}</span>
                  {ev.location && <span className="events-page__item-meta">{ev.location}</span>}
                  {ev.description && <p className="events-page__item-desc">{ev.description}</p>}
                </Link>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  )
}
