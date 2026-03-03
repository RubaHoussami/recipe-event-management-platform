import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { listNotifications, markNotificationRead, markAllRead } from '../api/notifications'
import type { Notification } from '../api/notifications'
import './NotificationsPage.css'

export function NotificationsPage() {
  const queryClient = useQueryClient()
  const { data: notifications, isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => listNotifications(),
  })

  const markReadMutation = useMutation({
    mutationFn: (id: string) => markNotificationRead(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  })
  const markAllMutation = useMutation({
    mutationFn: markAllRead,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  })

  const unreadCount = notifications?.filter((n) => !n.read_at).length ?? 0

  return (
    <div className="notifications-page">
      <div className="page-header">
        <h1>Notifications</h1>
        {unreadCount > 0 && (
          <button type="button" className="btn-secondary" onClick={() => markAllMutation.mutate()} disabled={markAllMutation.isPending}>
            Mark all as read
          </button>
        )}
      </div>

      {isLoading && <p>Loading…</p>}
      {notifications != null && notifications.length === 0 && (
        <div className="card notifications-page__empty">
          <p>No notifications yet.</p>
          <p>You’ll see updates here when someone accepts your event invite, shares a recipe with you, or edits a recipe you have access to.</p>
        </div>
      )}
      {notifications != null && notifications.length > 0 && (
        <ul className="notifications-page__list">
          {notifications.map((n: Notification) => (
            <li key={n.id} className={`notifications-page__item ${n.read_at ? '' : 'notifications-page__item--unread'}`}>
              <div className="notifications-page__item-body">
                <p className="notifications-page__title">{n.title}</p>
                {n.body && <p className="notifications-page__body">{n.body}</p>}
                <span className="notifications-page__time">{new Date(n.created_at).toLocaleString()}</span>
              </div>
              <div className="notifications-page__item-actions">
                {n.link && (
                  <Link to={n.link} className="btn-primary notifications-page__link">
                    View
                  </Link>
                )}
                {!n.read_at && (
                  <button type="button" className="btn-secondary" onClick={() => markReadMutation.mutate(n.id)} disabled={markReadMutation.isPending}>
                    Mark read
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
