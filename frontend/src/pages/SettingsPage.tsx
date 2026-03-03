import { useState, useEffect } from 'react'
import { useOutletContext } from 'react-router-dom'
import { setOpenAIKey } from '../api/auth'
import type { UserMe } from '../api/auth'
import './SettingsPage.css'

export function SettingsPage() {
  const { user } = useOutletContext<{ user: UserMe | null }>()
  const [openaiKey, setOpenaiKeyLocal] = useState('')
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => {
    if (user) setOpenaiKeyLocal('') // We don't store or show existing key for security
  }, [user])

  async function handleSaveKey(e: React.FormEvent) {
    e.preventDefault()
    setMessage(null)
    setSaving(true)
    try {
      await setOpenAIKey(openaiKey.trim() || null)
      setOpenaiKeyLocal('')
      setMessage({ type: 'success', text: 'Settings saved. AI features will use your key when provided.' })
    } catch {
      setMessage({ type: 'error', text: 'Failed to save. Please try again.' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="settings-page">
      <div className="page-header">
        <h1>Settings</h1>
      </div>

      <div className="card settings-page__section">
        <h2>Profile</h2>
        <dl className="settings-page__profile">
          <dt>Email</dt>
          <dd>{user?.email ?? '—'}</dd>
          <dt>Name</dt>
          <dd>{user?.name ?? '—'}</dd>
          <dt>Role</dt>
          <dd>{user?.role ?? '—'}</dd>
        </dl>
      </div>

      <div className="card settings-page__section">
        <h2>AI (OpenAI)</h2>
        <p className="settings-page__hint">
          Add your OpenAI API key to enable “Parse from text” and other AI features. Your key is stored securely and never sent to our servers except to call OpenAI when you use those features.
        </p>
        <form onSubmit={handleSaveKey} className="settings-page__form">
          <label>
            <span>OpenAI API key</span>
            <input
              type="password"
              placeholder="sk-…"
              value={openaiKey}
              onChange={(e) => setOpenaiKeyLocal(e.target.value)}
              autoComplete="off"
            />
          </label>
          <div className="settings-page__form-actions">
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? 'Saving…' : 'Save'}
            </button>
            <button type="button" className="btn-secondary" onClick={() => setOpenaiKeyLocal('')}>
              Clear
            </button>
          </div>
        </form>
        {user?.openai_configured && <p className="settings-page__status success">OpenAI is configured for your account.</p>}
        {message && (
          <p className={`settings-page__message ${message.type === 'error' ? 'error' : 'success'}`}>
            {message.text}
          </p>
        )}
      </div>
    </div>
  )
}
