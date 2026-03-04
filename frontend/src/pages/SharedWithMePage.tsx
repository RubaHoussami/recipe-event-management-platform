import { Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { listSharedRecipes } from '../api/shares'
import { listMyEventInvites, respondToInvite } from '../api/events'
import type { MyInviteWithEvent } from '../api/events'
import './SharedWithMePage.css'

function formatEventDate(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleDateString(undefined, { dateStyle: 'medium' }) + ' · ' + d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })
}

export function SharedWithMePage() {
  const queryClient = useQueryClient()

  const { data: sharedRecipes, isLoading: recipesLoading, error: recipesError } = useQuery({
    queryKey: ['shared-recipes'],
    queryFn: () => listSharedRecipes({ limit: 50, offset: 0 }),
  })
  const { data: invites, isLoading: invitesLoading, error: invitesError } = useQuery({
    queryKey: ['my-event-invites'],
    queryFn: () => listMyEventInvites({ limit: 50, offset: 0 }),
  })

  const respondMutation = useMutation({
    mutationFn: ({ token, status }: { token: string; status: 'accepted' | 'declined' | 'maybe' }) =>
      respondToInvite(token, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-event-invites'] })
    },
  })

  return (
    <div className="shared-with-me-page">
      <h1>Shared with you</h1>
      <p className="shared-with-me-page__intro">
        Recipes others have shared with you, and event invites you can accept or decline.
      </p>

      <section className="shared-with-me-page__section card">
        <h2>Recipes shared with you</h2>
        {recipesLoading && <p className="shared-with-me-page__loading">Loading…</p>}
        {recipesError && <p className="shared-with-me-page__error">Failed to load shared recipes.</p>}
        {sharedRecipes && sharedRecipes.items.length === 0 && (
          <p className="shared-with-me-page__empty">No recipes have been shared with you yet.</p>
        )}
        {sharedRecipes && sharedRecipes.items.length > 0 && (
          <ul className="shared-with-me-page__list">
            {sharedRecipes.items.map((item) => (
              <li key={item.recipe.id} className="shared-with-me-page__item">
                <Link to={'/dashboard/recipes/' + item.recipe.id} className="shared-with-me-page__item-link">
                  <span className="shared-with-me-page__item-title">{item.recipe.title}</span>
                  {item.recipe.cuisine && <span className="shared-with-me-page__item-meta">{item.recipe.cuisine}</span>}
                  <span className="shared-with-me-page__item-permission">({item.permission})</span>
                </Link>
                {item.permission === 'editor' && (
                  <Link to={'/dashboard/recipes/' + item.recipe.id + '/edit'} className="btn-secondary btn-secondary--small shared-with-me-page__edit-link">Edit</Link>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="shared-with-me-page__section card">
        <h2>Event invites</h2>
        {invitesLoading && <p className="shared-with-me-page__loading">Loading…</p>}
        {invitesError && <p className="shared-with-me-page__error">Failed to load event invites.</p>}
        {invites && invites.length === 0 && (
          <p className="shared-with-me-page__empty">No event invites yet.</p>
        )}
        {invites && invites.length > 0 && (
          <ul className="shared-with-me-page__invites-list">
            {invites.map((item: MyInviteWithEvent) => (
              <li key={item.invite.id} className="shared-with-me-page__invite-item">
                <div className="shared-with-me-page__invite-info">
                  <Link to={'/dashboard/events/' + item.event.id} className="shared-with-me-page__invite-title">
                    {item.event.title}
                  </Link>
                  <span className="shared-with-me-page__invite-date">{formatEventDate(item.event.start_time)}</span>
                  {item.event.location && (
                    <span className="shared-with-me-page__invite-meta">{item.event.location}</span>
                  )}
                  <span className={'shared-with-me-page__invite-status shared-with-me-page__invite-status--' + item.invite.status}>
                    {item.invite.status}
                  </span>
                </div>
                {item.invite.status === 'pending' && (
                  <div className="shared-with-me-page__invite-actions">
                    <button
                      type="button"
                      className="btn-primary btn-primary--small"
                      onClick={() => respondMutation.mutate({ token: item.invite.token, status: 'accepted' })}
                      disabled={respondMutation.isPending}
                    >
                      Accept
                    </button>
                    <button
                      type="button"
                      className="btn-secondary"
                      onClick={() => respondMutation.mutate({ token: item.invite.token, status: 'maybe' })}
                      disabled={respondMutation.isPending}
                    >
                      Maybe
                    </button>
                    <button
                      type="button"
                      className="btn-delete"
                      onClick={() => respondMutation.mutate({ token: item.invite.token, status: 'declined' })}
                      disabled={respondMutation.isPending}
                    >
                      Decline
                    </button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
