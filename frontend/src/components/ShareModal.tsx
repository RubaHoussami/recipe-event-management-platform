import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { createShare } from '../api/shares'
import { createEventInvite } from '../api/events'
import { listFriends } from '../api/friends'
import './modal.css'

type ShareTarget = 'recipe' | 'event'

interface ShareModalProps {
  target: ShareTarget
  resourceId: string
  onClose: () => void
  onUpdated: () => void
}

export function ShareModal({ target, resourceId, onClose, onUpdated }: ShareModalProps) {
  const [email, setEmail] = useState('')
  const [permission, setPermission] = useState<'viewer' | 'editor'>('viewer')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const { data: friends } = useQuery({
    queryKey: ['friends'],
    queryFn: listFriends,
    enabled: true,
  })

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      if (target === 'recipe') {
        await createShare(resourceId, { shared_with_email: email.trim(), permission })
      } else {
        await createEventInvite(resourceId, email.trim())
      }
      setEmail('')
      onUpdated()
    } catch (err: unknown) {
      setError(err && typeof err === 'object' && 'detail' in err ? String((err as { detail: unknown }).detail) : 'Failed')
    } finally {
      setLoading(false)
    }
  }

  const title = target === 'recipe' ? 'Share recipe' : 'Share event'
  const placeholder = target === 'recipe' ? 'Email to share with' : 'Email to invite'

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal__head">
          <h2>{title}</h2>
          <button type="button" onClick={onClose} aria-label="Close">×</button>
        </div>
        <form onSubmit={handleAdd}>
          <input
            type="email"
            placeholder={placeholder}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          {target === 'recipe' && (
            <select value={permission} onChange={(e) => setPermission(e.target.value as 'viewer' | 'editor')}>
              <option value="viewer">Viewer</option>
              <option value="editor">Editor</option>
            </select>
          )}
          {friends != null && friends.length > 0 && (
            <div className="modal__friends">
              <label className="modal__friends-label">Or choose a friend</label>
              <select
                value=""
                onChange={(e) => {
                  const v = e.target.value
                  if (v) setEmail(v)
                }}
                className="modal__friends-select"
              >
                <option value="">Select friend…</option>
                {friends.map((f) => (
                  <option key={f.friend_id} value={f.friend_email}>{f.friend_name || f.friend_email}</option>
                ))}
              </select>
            </div>
          )}
          <button type="submit" disabled={loading}>Add</button>
        </form>
        {error && <p className="modal__error">{error}</p>}
      </div>
    </div>
  )
}
