import { useRef, useState, useEffect } from 'react'
import { useOutletContext } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { deleteAvatar, setOpenAIKey, uploadAvatar, updateMe } from '../api/auth'
import type { UserMe } from '../api/auth'
import { useMyAvatarUrl } from '../hooks/useMyAvatarUrl'
import './SettingsPage.css'

const MAX_AVATAR_MB = 2
const ALLOWED_TYPES = 'image/jpeg,image/png,image/webp'

export function SettingsPage() {
  const { user } = useOutletContext<{ user: UserMe | null }>()
  const queryClient = useQueryClient()
  const avatarUrl = useMyAvatarUrl(user ?? null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [openaiKey, setOpenaiKeyLocal] = useState('')
  const [profileName, setProfileName] = useState('')
  const [saving, setSaving] = useState(false)
  const [profileSaving, setProfileSaving] = useState(false)
  const [avatarSaving, setAvatarSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => {
    if (user) {
      setOpenaiKeyLocal('')
      setProfileName(user.name ?? '')
    }
  }, [user])

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault()
    setMessage(null)
    setProfileSaving(true)
    try {
      await updateMe({ name: profileName.trim() || undefined })
      queryClient.invalidateQueries({ queryKey: ['auth', 'me'] })
      setMessage({ type: 'success', text: 'Profile updated.' })
    } catch {
      setMessage({ type: 'error', text: 'Failed to update profile.' })
    } finally {
      setProfileSaving(false)
    }
  }

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > MAX_AVATAR_MB * 1024 * 1024) {
      setMessage({ type: 'error', text: `Image must be under ${MAX_AVATAR_MB}MB.` })
      return
    }
    if (!ALLOWED_TYPES.split(',').includes(file.type)) {
      setMessage({ type: 'error', text: 'Use JPEG, PNG, or WebP.' })
      return
    }
    setMessage(null)
    setAvatarSaving(true)
    try {
      await uploadAvatar(file)
      queryClient.invalidateQueries({ queryKey: ['auth', 'me'] })
      setMessage({ type: 'success', text: 'Profile picture updated.' })
    } catch (err: unknown) {
      const detail = typeof err === 'object' && err !== null && 'detail' in err ? String((err as { detail: unknown }).detail) : 'Upload failed.'
      setMessage({ type: 'error', text: detail })
    } finally {
      setAvatarSaving(false)
      e.target.value = ''
    }
  }

  async function handleRemoveAvatar() {
    setMessage(null)
    setAvatarSaving(true)
    try {
      await deleteAvatar()
      queryClient.invalidateQueries({ queryKey: ['auth', 'me'] })
      setMessage({ type: 'success', text: 'Profile picture removed.' })
    } catch {
      setMessage({ type: 'error', text: 'Failed to remove picture.' })
    } finally {
      setAvatarSaving(false)
    }
  }

  async function handleSaveKey(e: React.FormEvent) {
    e.preventDefault()
    setMessage(null)
    setSaving(true)
    try {
      await setOpenAIKey(openaiKey.trim() || null)
      setOpenaiKeyLocal('')
      queryClient.invalidateQueries({ queryKey: ['auth', 'me'] })
      setMessage({ type: 'success', text: openaiKey.trim() ? 'Settings saved. AI features will use your key when provided.' : 'OpenAI key cleared.' })
    } catch {
      setMessage({ type: 'error', text: 'Failed to save. Please try again.' })
    } finally {
      setSaving(false)
    }
  }

  async function handleClearKey() {
    setMessage(null)
    setSaving(true)
    try {
      await setOpenAIKey(null)
      setOpenaiKeyLocal('')
      queryClient.invalidateQueries({ queryKey: ['auth', 'me'] })
      setMessage({ type: 'success', text: 'OpenAI key cleared.' })
    } catch {
      setMessage({ type: 'error', text: 'Failed to clear key.' })
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
        <div className="settings-page__profile-block">
          <div className="settings-page__profile-info">
            <dl className="settings-page__profile">
              <dt>Email</dt>
              <dd>{user?.email ?? '—'}</dd>
              <dt>Role</dt>
              <dd>{user?.role ?? '—'}</dd>
            </dl>
          </div>
          <div className="settings-page__avatar-section">
            <span className="settings-page__avatar-label">Profile picture</span>
            <div className="settings-page__avatar-row">
              <div className="settings-page__avatar-preview">
                {avatarUrl ? <img src={avatarUrl} alt="" /> : <span className="settings-page__avatar-placeholder">{(user?.name || user?.email || '?')[0].toUpperCase()}</span>}
              </div>
              <div className="settings-page__avatar-actions">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept={ALLOWED_TYPES}
                  onChange={handleAvatarChange}
                  className="settings-page__file-input"
                  aria-label="Upload profile picture"
                />
                <button type="button" className="btn-secondary settings-page__btn-upload" onClick={() => fileInputRef.current?.click()} disabled={avatarSaving}>
                  {avatarSaving ? 'Uploading…' : 'Upload image'}
                </button>
                {user?.has_avatar && (
                  <button type="button" className="btn-delete settings-page__btn-remove" onClick={handleRemoveAvatar} disabled={avatarSaving}>
                    Remove
                  </button>
                )}
              </div>
            </div>
            <p className="settings-page__hint">JPEG, PNG or WebP, max {MAX_AVATAR_MB}MB.</p>
          </div>
        </div>
        <form onSubmit={handleSaveProfile} className="settings-page__form">
          <label>
            <span>Display name</span>
            <input value={profileName} onChange={(e) => setProfileName(e.target.value)} placeholder="Your name" />
          </label>
          <div className="settings-page__form-actions">
            <button type="submit" className="btn-primary" disabled={profileSaving}>{profileSaving ? 'Saving…' : 'Save profile'}</button>
          </div>
        </form>
      </div>

      <div className="card settings-page__section">
        <h2>OpenAI API Key</h2>
        <p className="settings-page__hint">
          Add your OpenAI API key to enable “Parse recipe” and other AI features. Your key is stored securely and never used by our servers except to call OpenAI when you use those features.
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
            <button type="button" className="btn-delete" onClick={handleClearKey} disabled={saving}>
              Clear key
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
