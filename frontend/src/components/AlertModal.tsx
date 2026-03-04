import './modal.css'

interface AlertModalProps {
  title: string
  message: string
  onClose: () => void
}

/** Returns the error message if this is an API-key/OpenAI 403 error; otherwise null. */
export function getApiKeyErrorDetail(err: unknown): string | null {
  if (!err || typeof err !== 'object' || !('status' in err)) return null
  const status = (err as { status?: number }).status
  const detail = (err as { detail?: unknown }).detail
  if (status !== 403) return null
  const msg = typeof detail === 'string' ? detail : (detail && typeof detail === 'object' && 'message' in detail ? String((detail as { message: unknown }).message) : null)
  if (!msg) return null
  const lower = msg.toLowerCase()
  if (lower.includes('api key') || lower.includes('openai')) return msg
  return null
}

export function AlertModal({ title, message, onClose }: AlertModalProps) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal__head">
          <h2>{title}</h2>
          <button type="button" onClick={onClose} aria-label="Close">×</button>
        </div>
        <p className="modal__error" style={{ marginTop: 0 }}>{message}</p>
        <div style={{ marginTop: '1rem' }}>
          <button type="button" className="btn-primary" onClick={onClose}>OK</button>
        </div>
      </div>
    </div>
  )
}
