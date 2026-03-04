import { apiRequest } from './http'

export interface Event {
  id: string
  owner_id: string
  title: string
  description: string | null
  location: string | null
  start_time: string
  end_time: string | null
  created_at: string
  updated_at: string
}

export interface PaginatedEvents {
  items: Event[]
  total: number
  limit: number
  offset: number
}

export interface EventCreate {
  title: string
  description?: string | null
  location?: string | null
  start_time: string
  end_time?: string | null
}

export interface EventUpdate {
  title?: string
  description?: string | null
  location?: string | null
  start_time?: string
  end_time?: string | null
}

function buildQuery(params: {
  q?: string
  date_from?: string
  date_to?: string
  limit?: number
  offset?: number
}) {
  const sp = new URLSearchParams()
  if (params.q != null) sp.set('q', params.q)
  if (params.date_from != null) sp.set('date_from', params.date_from)
  if (params.date_to != null) sp.set('date_to', params.date_to)
  if (params.limit != null) sp.set('limit', String(params.limit))
  if (params.offset != null) sp.set('offset', String(params.offset))
  const qs = sp.toString()
  return qs ? '?' + qs : ''
}

export function listEvents(params: {
  q?: string
  date_from?: string
  date_to?: string
  limit?: number
  offset?: number
} = {}): Promise<PaginatedEvents> {
  return apiRequest<PaginatedEvents>('/events/' + buildQuery(params))
}

export function getEvent(id: string): Promise<Event> {
  return apiRequest<Event>('/events/' + id)
}

export function createEvent(body: EventCreate): Promise<Event> {
  return apiRequest<Event>('/events/', { method: 'POST', body: JSON.stringify(body) })
}

export function updateEvent(id: string, body: EventUpdate): Promise<Event> {
  return apiRequest<Event>('/events/' + id, { method: 'PATCH', body: JSON.stringify(body) })
}

export function deleteEvent(id: string): Promise<void> {
  return apiRequest<void>('/events/' + id, { method: 'DELETE' })
}

/** Create an invite for an event (by email). */
export function createEventInvite(eventId: string, invitedEmail: string): Promise<unknown> {
  return apiRequest<unknown>('/events/' + eventId + '/invites', {
    method: 'POST',
    body: JSON.stringify({ invited_email: invitedEmail }),
  })
}

export interface EventInvite {
  id: string
  event_id: string
  invited_email: string
  invited_user_id: string | null
  status: string
  token: string
  expires_at: string
  created_at: string
}

export function listEventInvites(eventId: string): Promise<EventInvite[]> {
  return apiRequest<EventInvite[]>('/events/' + eventId + '/invites')
}

export function deleteEventInvite(eventId: string, inviteId: string): Promise<void> {
  return apiRequest<void>('/events/' + eventId + '/invites/' + inviteId, { method: 'DELETE' })
}

export interface AttendeeItem {
  email: string
  name: string | null
  user_id: string | null
  status: string
}

export interface AttendeesResponse {
  owner: AttendeeItem
  invitees: AttendeeItem[]
}

export function getEventAttendees(eventId: string): Promise<AttendeesResponse> {
  return apiRequest<AttendeesResponse>('/events/' + eventId + '/attendees')
}

/** Event invite for current user (from list or by token) */
export interface MyInviteWithEvent {
  invite: EventInvite
  event: {
    id: string
    title: string
    start_time: string
    end_time: string | null
    location: string | null
  }
}

export interface MyInviteDetail {
  invite: EventInvite
  event: Event
}

/** List event invites for the current user */
export function listMyEventInvites(params: { limit?: number; offset?: number } = {}): Promise<MyInviteWithEvent[]> {
  const sp = new URLSearchParams()
  if (params.limit != null) sp.set('limit', String(params.limit))
  if (params.offset != null) sp.set('offset', String(params.offset))
  const qs = sp.toString()
  return apiRequest<MyInviteWithEvent[]>('/invites' + (qs ? '?' + qs : ''))
}

/** Get single invite by token (for respond page) */
export function getInviteByToken(token: string): Promise<MyInviteDetail> {
  return apiRequest<MyInviteDetail>('/invites/' + encodeURIComponent(token))
}

/** Respond to event invite (accepted / declined / maybe) */
export function respondToInvite(token: string, status: 'accepted' | 'declined' | 'maybe'): Promise<EventInvite> {
  return apiRequest<EventInvite>('/invites/' + encodeURIComponent(token) + '/respond', {
    method: 'POST',
    body: JSON.stringify({ status }),
  })
}
