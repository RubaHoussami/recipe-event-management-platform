import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link, useLocation } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getEvent, deleteEvent, getEventAttendees, listEventInvites, deleteEventInvite } from '../api/events'
import { ShareModal } from '../components/ShareModal'
import './EventDetailPage.css'

function formatEventDateTime(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleString(undefined, { dateStyle: 'full', timeStyle: 'short' })
}

export function EventDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const location = useLocation()
  const queryClient = useQueryClient()
  const [inviteErrors, setInviteErrors] = useState<string[]>([])
  const [shareOpen, setShareOpen] = useState(false)

  useEffect(() => {
    const state = location.state as { inviteErrors?: string[] } | null
    if (state?.inviteErrors?.length) {
      setInviteErrors(state.inviteErrors)
      navigate(location.pathname, { replace: true, state: {} })
    }
  }, [location.state, location.pathname, navigate])

  const { data: event, isLoading, error } = useQuery({
    queryKey: ['event', id],
    queryFn: () => getEvent(id!),
    enabled: !!id,
  })
  const { data: attendees } = useQuery({
    queryKey: ['event-attendees', id],
    queryFn: () => getEventAttendees(id!),
    enabled: !!id,
  })
  const { data: invites } = useQuery({
    queryKey: ['event-invites', id],
    queryFn: () => listEventInvites(id!),
    enabled: !!id,
  })

  const deleteMutation = useMutation({
    mutationFn: () => deleteEvent(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] })
      navigate('/dashboard/events')
    },
  })
  const removeInviteMutation = useMutation({
    mutationFn: (inviteId: string) => deleteEventInvite(id!, inviteId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['event-invites', id] })
      queryClient.invalidateQueries({ queryKey: ['event-attendees', id] })
    },
  })

  if (!id) return null
  if (isLoading) return <p>Loading…</p>
  if (error || !event) return <p className="event-detail-page__error">Event not found.</p>

  return (
    <div className="event-detail-page">
      <Link to="/dashboard/events" className="event-detail-page__back">← All events</Link>
      <div className="page-header event-detail-page__header">
        <h1>{event.title}</h1>
        <div className="event-detail-page__actions">
          <button type="button" className="btn-secondary" onClick={() => setShareOpen(true)}>Share</button>
          <Link to={'/dashboard/events/' + id + '/edit'} className="btn-primary">Edit</Link>
          <button
            type="button"
            className="btn-delete"
            onClick={() => window.confirm('Delete this event?') && deleteMutation.mutate()}
            disabled={deleteMutation.isPending}
          >
            {deleteMutation.isPending ? 'Deleting…' : 'Delete'}
          </button>
        </div>
      </div>
      {inviteErrors.length > 0 && (
        <div className="event-detail-page__invite-errors card">
          <p className="event-detail-page__invite-errors-title">Event created, but failed to invite:</p>
          <ul>{inviteErrors.map((e, i) => <li key={i}>{e}</li>)}</ul>
        </div>
      )}
      <section className="event-detail-page__invited-section">
          <h2 className="event-detail-page__invited-heading">Invited</h2>
          {invites && invites.length > 0 ? (
            <ul className="event-detail-page__invited-list">
              {invites.map((inv) => (
                <li key={inv.id} className="event-detail-page__invited-item">
                  <span>{inv.invited_email}</span>
                  <button
                    type="button"
                    className="btn-delete event-detail-page__invited-remove"
                    onClick={() => removeInviteMutation.mutate(inv.id)}
                    disabled={removeInviteMutation.isPending}
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="event-detail-page__invited-empty">No one invited yet.</p>
          )}
          <button type="button" className="btn-secondary" onClick={() => setShareOpen(true)}>Share</button>
        </section>
      <div className="card event-detail-page__card">
        <dl className="event-detail-page__dl">
          <dt>Start</dt>
          <dd>{formatEventDateTime(event.start_time)}</dd>
          {event.end_time && (
            <>
              <dt>End</dt>
              <dd>{formatEventDateTime(event.end_time)}</dd>
            </>
          )}
          {event.location && (
            <>
              <dt>Location</dt>
              <dd>{event.location}</dd>
            </>
          )}
        </dl>
        {event.description && (
          <div className="event-detail-page__description">
            <h3>Description</h3>
            <p>{event.description}</p>
          </div>
        )}
      </div>
      {shareOpen && (
        <ShareModal
          target="event"
          resourceId={id}
          onClose={() => setShareOpen(false)}
          onUpdated={() => {
            queryClient.invalidateQueries({ queryKey: ['event-invites', id] })
            queryClient.invalidateQueries({ queryKey: ['event-attendees', id] })
          }}
        />
      )}
    </div>
  )
}
