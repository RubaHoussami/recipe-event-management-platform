import { useState } from 'react'
import { createShare, deleteShare } from '../api/shares'
import type { Share } from '../api/shares'
import './modal.css'

interface ShareModalProps {
  recipeId: string
  shares: Share[]
  onClose: () => void
  onUpdated: () => void
}

export function ShareModal({ recipeId, shares, onClose, onUpdated }: ShareModalProps) {
  const [email, setEmail] = useState('')
  const [permission, setPermission] = useState<'viewer' | 'editor'>('viewer')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      await createShare(recipeId, { shared_with_email: email.trim(), permission })
      setEmail('')
      onUpdated()
    } catch (err: unknown) {
      setError(err && typeof err === 'object' && 'detail' in err ? String((err as { detail: unknown }).detail) : 'Failed')
    } finally {
      setLoading(false)
    }
  }

  async function handleRemove(shareId: string) {
    try {
      await deleteShare(recipeId, shareId)
      onUpdated()
    } catch {
      // ignore
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal__head">
          <h2>Share recipe</h2>
          <button type="button" onClick={onClose} aria-label="Close">×</button>
        </div>
        <form onSubmit={handleAdd}>
          <input
            type="email"
            placeholder="Email to share with"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <select value={permission} onChange={(e) => setPermission(e.target.value as 'viewer' | 'editor')}>
            <option value="viewer">Viewer</option>
            <option value="editor">Editor</option>
          </select>
          <button type="submit" disabled={loading}>Add</button>
        </form>
        {error && <p className="modal__error">{error}</p>}
        <ul className="modal__list">
          {shares.map((s) => (
            <li key={s.id}>
              Share with user {s.shared_with_user_id} ({s.permission})
              <button type="button" onClick={() => handleRemove(s.id)}>Remove</button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
