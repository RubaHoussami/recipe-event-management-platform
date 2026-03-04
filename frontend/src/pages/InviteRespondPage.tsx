import { useParams, useNavigate, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getInviteByToken, respondToInvite } from '../api/events'
import './InviteRespondPage.css'

function formatEventDateTime(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleString(undefined, { dateStyle: 'full', timeStyle: 'short' })
}

export function InviteRespondPage() {
  const { token } = useParams<{ token: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const { data, isLoading, error } = useQuery({
    queryKey: ['invite-by-token', token],
    queryFn: () => getInviteByToken(token!),
    enabled: !!token,
  })

  const respondMutation = useMutation({
    mutationFn: (status: 'accepted' | 'declined' | 'maybe') => respondToInvite(token!, status),
    onSuccess: (updatedInvite, status) => {
      queryClient.invalidateQueries({ queryKey: ['my-event-invites'] })
      queryClient.invalidateQueries({ queryKey: ['invite-by-token', token] })
      if (status === 'accepted' && updatedInvite?.event_id) {
        navigate('/dashboard/events/' + updatedInvite.event_id)
      } else {
        navigate('/dashboard/shared')
      }
    },
  })

  if (!token) return <p className="invite-respond-page__error">Invalid invite link.</p>
  if (isLoading) return <p className="invite-respond-page__loading">Loading invite…</p>
  if (error || !data) return <p className="invite-respond-page__error">Invite not found or expired.</p>

  const { invite, event } = data
  const isPending = invite.status === 'pending'

  return (
    <div className="invite-respond-page">
      <div className="invite-respond-page__card card">
        <h1>Event invitation</h1>
        <p className="invite-respond-page__subtitle">You&apos;re invited to</p>
        <h2 className="invite-respond-page__event-title">{event.title}</h2>
        <dl className="invite-respond-page__dl">
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
          <div className="invite-respond-page__description">
            <h3>Description</h3>
            <p>{event.description}</p>
          </div>
        )}
        <p className="invite-respond-page__status">Your response: <strong>{invite.status}</strong></p>
        {isPending && (
          <div className="invite-respond-page__actions">
            <button
              type="button"
              className="btn-primary"
              onClick={() => respondMutation.mutate('accepted')}
              disabled={respondMutation.isPending}
            >
              Accept
            </button>
            <button
              type="button"
              className="btn-secondary"
              onClick={() => respondMutation.mutate('maybe')}
              disabled={respondMutation.isPending}
            >
              Maybe
            </button>
            <button
              type="button"
              className="btn-delete"
              onClick={() => respondMutation.mutate('declined')}
              disabled={respondMutation.isPending}
            >
              Decline
            </button>
          </div>
        )}
        {!isPending && (
          <Link to={'/dashboard/events/' + event.id} className="btn-primary">View event</Link>
        )}
      </div>
      <Link to="/dashboard/shared" className="invite-respond-page__back">← Back to Shared with you</Link>
    </div>
  )
}
