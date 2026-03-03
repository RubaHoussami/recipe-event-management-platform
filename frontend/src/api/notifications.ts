import { apiRequest } from './http'

export interface Notification {
  id: string
  title: string
  body: string | null
  link: string | null
  read_at: string | null
  created_at: string
}

export function listNotifications(): Promise<Notification[]> {
  return apiRequest<Notification[]>('/notifications/')
}

export function markNotificationRead(id: string): Promise<void> {
  return apiRequest<void>(`/notifications/${id}/read`, { method: 'POST' })
}

export function markAllRead(): Promise<void> {
  return apiRequest<void>('/notifications/read-all', { method: 'POST' })
}
