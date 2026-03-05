import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate, Link, useLocation } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getEvent, createEvent, updateEvent, createEventInvite, listEventInvites, deleteEventInvite } from '../api/events'
import type { EventCreate, EventUpdate } from '../api/events'
import { ShareModal } from '../components/ShareModal'
import './EventFormPage.css'

/** Format ISO string for datetime-local input (YYYY-MM-DDTHH:mm) */
function toDatetimeLocal(iso: string): string {
  const d = new Date(iso)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const h = String(d.getHours()).padStart(2, '0')
  const min = String(d.getMinutes()).padStart(2, '0')
  return `${y}-${m}-${day}T${h}:${min}`
}

/** Today in YYYY-MM-DDTHH:mm for default start */
function defaultStart(): string {
  const d = new Date()
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset())
  return d.toISOString().slice(0, 16)
}

/** One hour from now for default end */
function defaultEnd(): string {
  const d = new Date()
  d.setHours(d.getHours() + 1)
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset())
  return d.toISOString().slice(0, 16)
}

function errDetailToString(err: unknown): string {
  if (err && typeof err === 'object' && 'detail' in err) {
    const d = (err as { detail: unknown }).detail
    if (typeof d === 'string') return d
    if (Array.isArray(d)) return d.map((e) => (e?.msg ?? e?.loc?.join('.') ?? JSON.stringify(e))).join('; ')
    if (d && typeof d === 'object') return (d as { msg?: string; message?: string }).msg ?? (d as { message?: string }).message ?? JSON.stringify(d)
  }
  return 'Failed to invite'
}

interface ParsedEventState {
  title?: string
  location?: string | null
  startTime?: string
  endTime?: string | null
}

export function EventFormPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const routerLocation = useLocation()
  const queryClient = useQueryClient()
  const isEdit = !!id
  const appliedParsedRef = useRef(false)

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [location, setLocation] = useState('')
  const [startTime, setStartTime] = useState(defaultStart())
  const [endTime, setEndTime] = useState('')
  const [shareWithEmails, setShareWithEmails] = useState<string[]>([''])
  const [shareOpen, setShareOpen] = useState(false)

  const { data: event, isLoading: eventLoading } = useQuery({
    queryKey: ['event', id],
    queryFn: () => getEvent(id!),
    enabled: isEdit,
  })
  const { data: invites } = useQuery({
    queryKey: ['event-invites', id],
    queryFn: () => listEventInvites(id!),
    enabled: isEdit && !!id,
  })

  useEffect(() => {
    if (event) {
      setTitle(event.title)
      setDescription(event.description ?? '')
      setLocation(event.location ?? '')
      setStartTime(toDatetimeLocal(event.start_time))
      setEndTime(event.end_time ? toDatetimeLocal(event.end_time) : defaultEnd())
    }
  }, [event])

  useEffect(() => {
    if (isEdit || appliedParsedRef.current) return
    const state = routerLocation.state as { parsed?: ParsedEventState } | null
    const parsed = state?.parsed
    if (!parsed) return
    appliedParsedRef.current = true
    if (parsed.title != null) setTitle(parsed.title)
    if (parsed.location != null) setLocation(parsed.location)
    if (parsed.startTime != null) setStartTime(parsed.startTime)
    if (parsed.endTime != null) setEndTime(parsed.endTime)
    navigate(routerLocation.pathname, { replace: true, state: {} })
  }, [isEdit, routerLocation.state, routerLocation.pathname, navigate])

  const createMutation = useMutation({
    mutationFn: async ({ body, shareWith }: { body: EventCreate; shareWith: string[] }) => {
      const ev = await createEvent(body)
      const emails = shareWith.filter((e) => e.trim() !== '')
      const inviteErrors: string[] = []
      for (const email of emails) {
        try {
          await createEventInvite(ev.id, email.trim())
        } catch (err: unknown) {
          const msg = errDetailToString(err)
          inviteErrors.push(`${email}: ${msg}`)
        }
      }
      return { event: ev, inviteErrors }
    },
    onSuccess: ({ event: ev, inviteErrors }) => {
      queryClient.invalidateQueries({ queryKey: ['events'] })
      navigate('/dashboard/events/' + ev.id, { state: inviteErrors.length ? { inviteErrors } : undefined })
    },
  })
  const updateMutation = useMutation({
    mutationFn: (body: EventUpdate) => updateEvent(id!, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['event', id] })
      queryClient.invalidateQueries({ queryKey: ['events'] })
      navigate('/dashboard/events/' + id)
    },
  })
  const removeInviteMutation = useMutation({
    mutationFn: (inviteId: string) => deleteEventInvite(id!, inviteId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['event-invites', id] })
    },
  })

  function addShareWith() {
    setShareWithEmails((prev) => [...prev, ''])
  }
  function removeShareWith(index: number) {
    setShareWithEmails((prev) => (prev.length <= 1 ? [''] : prev.filter((_, i) => i !== index)))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const startISO = new Date(startTime).toISOString()
    const endISO = endTime && endTime.trim() ? new Date(endTime).toISOString() : null
    const body = {
      title: title.trim(),
      description: description.trim() || null,
      location: location.trim() || null,
      start_time: startISO,
      end_time: endISO,
    }
    if (isEdit) {
      updateMutation.mutate(body)
    } else {
      createMutation.mutate({ body, shareWith: shareWithEmails })
    }
  }

  const saving = createMutation.isPending || updateMutation.isPending
  const err = createMutation.error || updateMutation.error
  if (isEdit && eventLoading) return <p>Loading…</p>

  return (
    <div className="event-form-page">
      <Link to={isEdit ? '/dashboard/events/' + id : '/dashboard/events'} state={isEdit ? routerLocation.state : undefined} className="event-form-page__back">← Back</Link>
      <div className="event-form-page__title-row">
        <h1>{isEdit ? 'Edit event' : 'New event'}</h1>
      </div>
      <form onSubmit={handleSubmit}>
        <label>
          Title
          <input value={title} onChange={(e) => setTitle(e.target.value)} required placeholder="Event title" />
        </label>
        <label>
          Description
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} placeholder="Optional" />
        </label>
        <label>
          Location
          <input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Where it's happening" />
        </label>
        <div className="event-form-page__row">
          <label>
            Start
            <input type="datetime-local" value={startTime} onChange={(e) => setStartTime(e.target.value)} required />
          </label>
          <label>
            End
            <input type="datetime-local" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
          </label>
        </div>
        {!isEdit && (
          <fieldset className="event-form-page__fieldset">
            <legend>Share with</legend>
            <p className="event-form-page__hint">Add email addresses to share this event with (one per row).</p>
            {shareWithEmails.map((val, i) => (
              <div key={i} className="event-form-page__row-item">
                <input
                  type="email"
                  value={val}
                  onChange={(e) => {
                    const next = [...shareWithEmails]
                    next[i] = e.target.value
                    setShareWithEmails(next)
                  }}
                  placeholder="email@example.com"
                />
                <button type="button" className="event-form-page__remove" onClick={() => removeShareWith(i)} title="Remove">Remove</button>
              </div>
            ))}
            <button type="button" className="event-form-page__add" onClick={addShareWith}>+ Add person</button>
          </fieldset>
        )}
        {isEdit && id && (
          <fieldset className="event-form-page__fieldset">
            <legend>Share with</legend>
            {invites && invites.length > 0 ? (
              <ul className="event-form-page__invited-list">
                {invites.map((inv) => (
                  <li key={inv.id} className="event-form-page__invited-item">
                    <span>{inv.invited_email}</span>
                    <button type="button" className="event-form-page__remove" onClick={() => removeInviteMutation.mutate(inv.id)} disabled={removeInviteMutation.isPending}>Remove</button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="event-form-page__hint">No one invited yet.</p>
            )}
            <button type="button" className="btn-secondary" onClick={() => setShareOpen(true)}>Share</button>
          </fieldset>
        )}
        {shareOpen && id && (
          <ShareModal
            target="event"
            resourceId={id}
            onClose={() => setShareOpen(false)}
            onUpdated={() => queryClient.invalidateQueries({ queryKey: ['event-invites', id] })}
          />
        )}
        {err && <p className="event-form-page__error">{(err as { detail?: string })?.detail ?? 'Something went wrong.'}</p>}
        <div className="event-form-page__actions">
          <button type="submit" className="btn-primary" disabled={saving}>{saving ? 'Saving…' : isEdit ? 'Save changes' : 'Create event'}</button>
          <Link to={isEdit ? '/dashboard/events/' + id : '/dashboard/events'} state={isEdit ? routerLocation.state : undefined} className="btn-secondary">Cancel</Link>
        </div>
      </form>
    </div>
  )
}
