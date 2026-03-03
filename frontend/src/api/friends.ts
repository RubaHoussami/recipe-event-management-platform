import { apiRequest } from './http'

export interface Friend {
  friend_id: string
  friend_email: string
  friend_name: string
  friend_avatar_url: string | null
  created_at: string
}

export interface Person {
  id: string
  email: string
  name: string
  avatar_url: string | null
}

export function listFriends(): Promise<Friend[]> {
  return apiRequest<Friend[]>('/friends/')
}

export function addFriendByEmail(email: string): Promise<Friend> {
  return apiRequest<Friend>('/friends/', {
    method: 'POST',
    body: JSON.stringify({ email }),
  })
}

export function removeFriend(friendId: string): Promise<void> {
  return apiRequest<void>(`/friends/${friendId}`, { method: 'DELETE' })
}

export function listPeople(params: { q?: string; limit?: number; offset?: number }): Promise<Person[]> {
  const sp = new URLSearchParams()
  if (params.q != null) sp.set('q', params.q)
  if (params.limit != null) sp.set('limit', String(params.limit))
  if (params.offset != null) sp.set('offset', String(params.offset))
  const qs = sp.toString()
  return apiRequest<Person[]>(`/friends/people${qs ? '?' + qs : ''}`)
}

