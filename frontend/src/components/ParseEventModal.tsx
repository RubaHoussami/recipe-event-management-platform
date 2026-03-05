import { useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { parseEvent } from '../api/ai'
import type { ParseEventResponse } from '../api/ai'
import type { UserMe } from '../api/auth'
import { AlertModal, getApiKeyErrorDetail } from './AlertModal'
import './modal.css'

/** Format ISO string for datetime-local (YYYY-MM-DDTHH:mm) */
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

interface ParseEventModalProps {
  onClose: () => void
  onParsed: (data: ParsedEventForm) => void
}

export interface ParsedEventForm {
  title: string
  description?: string
  location: string | null
  startTime: string
  endTime: string | null
}

export function ParseEventModal({ onClose, onParsed }: ParseEventModalProps) {
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
    setLoading(true)
    try {
      const res: ParseEventResponse = await parseEvent(freeText.trim(), useOpenai)
      onParsed({
        title: res.title,
        location: res.location ?? null,
        startTime: toDatetimeLocal(res.start_time),
        endTime: res.end_time ? toDatetimeLocal(res.end_time) : null,
      })
      onClose()
    } catch (err: unknown) {
      const apiKeyMsg = getApiKeyErrorDetail(err)
      if (apiKeyMsg) setApiKeyError(apiKeyMsg)
      else setError(err && typeof err === 'object' && 'detail' in err ? String((err as { detail: unknown }).detail) : 'Parse failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal--parse-event" onClick={(e) => e.stopPropagation()}>
        <div className="modal__head">
          <h2>Parse event from text</h2>
          <button type="button" onClick={onClose} aria-label="Close">×</button>
        </div>
        <p className="modal__intro">Paste a short event description (e.g. &quot;Team lunch next Friday at 12:30 at Mario&apos;s&quot;). We’ll extract title, time, and location.</p>
        <form onSubmit={handleParse}>
          <label className="modal__textarea-label">
            <span>Event description</span>
            <textarea
              placeholder="e.g. Dinner party Saturday 7pm at my place"
              value={freeText}
              onChange={(e) => setFreeText(e.target.value)}
              rows={4}
              required
            />
          </label>
          <label
            className={!aiEnabled ? 'modal__label--disabled' : ''}
            title={!aiEnabled ? 'Enable AI in Settings to use smart parsing' : undefined}
          >
            <input
              type="checkbox"
              checked={useOpenai}
              onChange={(e) => aiEnabled && setUseOpenai(e.target.checked)}
              disabled={!aiEnabled}
            />
            <span>Use AI for better parsing</span>
          </label>
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Parsing…' : 'Parse'}
          </button>
        </form>
        {error && <p className="modal__error">{error}</p>}
      </div>
      {apiKeyError && (
        <AlertModal title="AI / API key" message={apiKeyError} onClose={() => setApiKeyError(null)} />
      )}
    </div>
  )
}
