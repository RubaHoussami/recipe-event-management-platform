import { useRef, useState, useEffect } from 'react'
import { useOutletContext } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { deleteAvatar, resendOtp, setAiPreference, setOpenAIKey, uploadAvatar, updateMe, verifyEmail } from '../api/auth'
import type { AiPreference, UserMe } from '../api/auth'
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
  const [preferenceSaving, setPreferenceSaving] = useState(false)
  const [profileSaving, setProfileSaving] = useState(false)
  const [avatarSaving, setAvatarSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [otpCode, setOtpCode] = useState('')
  const [verifySaving, setVerifySaving] = useState(false)
  const [resendCooldown, setResendCooldown] = useState(0)

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

  async function handleVerifyEmail(e: React.FormEvent) {
    e.preventDefault()
    if (!user?.email || !otpCode.trim()) return
    setMessage(null)
    setVerifySaving(true)
    try {
      await verifyEmail(user.email, otpCode.trim())
      setOtpCode('')
      queryClient.invalidateQueries({ queryKey: ['auth', 'me'] })
      setMessage({ type: 'success', text: 'Email verified.' })
    } catch (err: unknown) {
      const detail = typeof err === 'object' && err !== null && 'detail' in err ? String((err as { detail: unknown }).detail) : 'Verification failed.'
      setMessage({ type: 'error', text: detail })
    } finally {
      setVerifySaving(false)
    }
  }

  async function handleResendOtp() {
    if (!user?.email) return
    setMessage(null)
    try {
      await resendOtp(user.email)
      setResendCooldown(60)
      setMessage({ type: 'success', text: 'Verification code sent to your email.' })
    } catch (err: unknown) {
      const detail = typeof err === 'object' && err !== null && 'detail' in err ? String((err as { detail: unknown }).detail) : 'Could not resend code.'
      setMessage({ type: 'error', text: detail })
    }
  }

  useEffect(() => {
    if (resendCooldown <= 0) return
    const t = setInterval(() => setResendCooldown((p) => (p <= 1 ? 0 : p - 1)), 1000)
    return () => clearInterval(t)
  }, [resendCooldown])

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

  async function handleAiPreferenceChange(pref: AiPreference) {
    if (pref === (user?.ai_preference ?? 'my_key')) return
    setMessage(null)
    setPreferenceSaving(true)
    try {
      await setAiPreference(pref)
      queryClient.invalidateQueries({ queryKey: ['auth', 'me'] })
      setMessage({ type: 'success', text: 'AI preference updated.' })
    } catch {
      setMessage({ type: 'error', text: 'Failed to update preference.' })
    } finally {
      setPreferenceSaving(false)
    }
  }

  const canUseAi =
    (user?.ai_preference === 'my_key' && user?.openai_configured) ||
    (user?.ai_preference === 'hosted' && user?.azure_ai_available && user?.email_verified)
  const hostedAvailableToUser = Boolean(user?.azure_ai_available && user?.email_verified)

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

      {user && !user.email_verified && (
        <div className="card settings-page__section">
          <h2>Verify your email</h2>
          <p className="settings-page__hint">We sent a 6-digit code to <strong>{user.email}</strong>. Enter it below to verify.</p>
          <p className="settings-page__hint settings-page__hint-small">If you don't see it, check your junk or spam folder.</p>
          <form onSubmit={handleVerifyEmail} className="settings-page__form">
            <label>
              <span>Verification code</span>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                placeholder="000000"
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                autoComplete="one-time-code"
              />
            </label>
            <div className="settings-page__form-actions">
              <button type="submit" className="btn-primary" disabled={verifySaving || otpCode.length !== 6}>
                {verifySaving ? 'Verifying…' : 'Verify email'}
              </button>
              <button type="button" className="btn-secondary" onClick={handleResendOtp} disabled={resendCooldown > 0}>
                {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend code'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="card settings-page__section settings-page__ai-section">
        <div className="settings-page__ai-header">
          <h2 className="settings-page__ai-title">AI (recipe parsing & suggestions)</h2>
          <p className="settings-page__ai-desc">
            Choose how to use AI. Rate limits apply. The hosted model is only available to verified accounts.
          </p>
        </div>
        <div className="settings-page__ai-options">
          <label className={`settings-page__ai-option${(user?.ai_preference ?? 'my_key') === 'off' ? ' settings-page__ai-option--active' : ''}`}>
            <input
              type="radio"
              name="ai_preference"
              checked={(user?.ai_preference ?? 'my_key') === 'off'}
              onChange={() => handleAiPreferenceChange('off')}
              disabled={preferenceSaving}
            />
            <span className="settings-page__ai-option-label">Off</span>
            <span className="settings-page__ai-option-hint">No AI features</span>
          </label>
          <label className={`settings-page__ai-option${(user?.ai_preference ?? 'my_key') === 'my_key' ? ' settings-page__ai-option--active' : ''}`}>
            <input
              type="radio"
              name="ai_preference"
              checked={(user?.ai_preference ?? 'my_key') === 'my_key'}
              onChange={() => handleAiPreferenceChange('my_key')}
              disabled={preferenceSaving}
            />
            <span className="settings-page__ai-option-label">My API key</span>
            <span className="settings-page__ai-option-hint">Use your own OpenAI key (stored securely)</span>
          </label>
          {user?.azure_ai_available && (
            <label className={`settings-page__ai-option${(user?.ai_preference ?? 'my_key') === 'hosted' ? ' settings-page__ai-option--active' : ''}${!hostedAvailableToUser ? ' settings-page__ai-option--disabled' : ''}`}>
              <input
                type="radio"
                name="ai_preference"
                checked={(user?.ai_preference ?? 'my_key') === 'hosted'}
                onChange={() => hostedAvailableToUser && handleAiPreferenceChange('hosted')}
                disabled={preferenceSaving || !hostedAvailableToUser}
              />
              <span className="settings-page__ai-option-label">Use hosted model</span>
              <span className="settings-page__ai-option-hint">
                {hostedAvailableToUser ? 'App’s hosted model (verified only)' : 'Verify your email to use the hosted model'}
              </span>
            </label>
          )}
        </div>
        {(user?.ai_preference ?? 'my_key') === 'my_key' && (
          <form onSubmit={handleSaveKey} className="settings-page__form settings-page__form--key">
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
        )}
        {canUseAi && <p className="settings-page__status success">AI is enabled for your account.</p>}
        {message && (
          <p className={`settings-page__message ${message.type === 'error' ? 'error' : 'success'}`}>
            {message.text}
          </p>
        )}
      </div>
    </div>
  )
}
