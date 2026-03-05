import { useState } from 'react'
import { Link, useNavigate, useOutletContext } from 'react-router-dom'
import { parseEvent } from '../api/ai'
import type { UserMe } from '../api/auth'
import { AlertModal, getApiKeyErrorDetail } from '../components/AlertModal'
import './ParseEventPage.css'

function toDatetimeLocal(iso: string): string {
  const d = new Date(iso)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const h = String(d.getHours()).padStart(2, '0')
  const min = String(d.getMinutes()).padStart(2, '0')
  return `${y}-${m}-${day}T${h}:${min}`
}

const canUseAi = (u: UserMe | null) =>
  (u?.ai_preference === 'my_key' && u?.openai_configured) ||
  (u?.ai_preference === 'hosted' && u?.azure_ai_available && u?.email_verified)

export function ParseEventPage() {
  const navigate = useNavigate()
  const { user } = useOutletContext<{ user: UserMe | null }>()
  const aiEnabled = canUseAi(user)
  const [freeText, setFreeText] = useState('')
  const [useOpenai, setUseOpenai] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [apiKeyError, setApiKeyError] = useState<string | null>(null)

  async function handleParse(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setApiKeyError(null)
    setLoading(true)
    try {
      const res = await parseEvent(freeText.trim(), useOpenai)
      const parsed = {
        title: res.title ?? '',
        location: res.location ?? null,
        startTime: toDatetimeLocal(res.start_time),
        endTime: res.end_time ? toDatetimeLocal(res.end_time) : null,
      }
      navigate('/dashboard/events/new', { state: { parsed } })
    } catch (err: unknown) {
      const apiKeyMsg = getApiKeyErrorDetail(err)
      if (apiKeyMsg) setApiKeyError(apiKeyMsg)
      else setError(err && typeof err === 'object' && 'detail' in err ? String((err as { detail: unknown }).detail) : 'Parse failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="parse-event-page">
      {apiKeyError && (
        <AlertModal
          title="AI / API key"
          message={apiKeyError}
          onClose={() => setApiKeyError(null)}
        />
      )}
      <Link to="/dashboard/events" className="parse-event-page__back">← Back to events</Link>
      <h1>Parse event</h1>
      <p className="parse-event-page__intro">
        Paste event text below (e.g. &quot;Team lunch next Friday at 12:30 at Mario&apos;s&quot;). We&apos;ll extract title, time, and location, then open the new event form with the fields filled so you can edit and save.
      </p>

      <form onSubmit={handleParse} className="parse-event-page__form">
        <label className="parse-event-page__label">
          <span>Event description</span>
          <textarea
            className="parse-event-page__textarea"
            placeholder="e.g. Dinner party Saturday 7pm at my place"
            value={freeText}
            onChange={(e) => setFreeText(e.target.value)}
            rows={8}
            required
          />
        </label>
        <label
          className={`parse-event-page__checkbox${!aiEnabled ? ' parse-event-page__checkbox--disabled' : ''}`}
          title={!aiEnabled ? 'Enable AI in Settings (My API key or Use hosted model)' : undefined}
        >
          <input
            type="checkbox"
            checked={useOpenai}
            onChange={(e) => aiEnabled && setUseOpenai(e.target.checked)}
            disabled={!aiEnabled}
          />
          <span>Use AI for better parsing</span>
        </label>
        <div className="parse-event-page__actions">
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Parsing…' : 'Parse'}
          </button>
          <Link to="/dashboard/events/new" className="btn-secondary">Add event manually</Link>
        </div>
      </form>

      {error && <p className="parse-event-page__error">{error}</p>}
    </div>
  )
}
