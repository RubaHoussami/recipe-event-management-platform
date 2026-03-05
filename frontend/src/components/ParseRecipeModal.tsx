import { useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { parseRecipe } from '../api/ai'
import { createRecipe } from '../api/recipes'
import type { UserMe } from '../api/auth'
import { AlertModal, getApiKeyErrorDetail } from './AlertModal'
import './modal.css'

interface ParseRecipeModalProps {
  onClose: () => void
  onCreated: () => void
}

const canUseAi = (u: UserMe | null) =>
  (u?.ai_preference === 'my_key' && u?.openai_configured) ||
  (u?.ai_preference === 'hosted' && u?.azure_ai_available && u?.email_verified)

export function ParseRecipeModal({ onClose, onCreated }: ParseRecipeModalProps) {
  const { user } = useOutletContext<{ user: UserMe | null }>()
  const aiEnabled = canUseAi(user)
  const [freeText, setFreeText] = useState('')
  const [useOpenai, setUseOpenai] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [parsed, setParsed] = useState<{ title: string; ingredients: string[]; steps: string[] } | null>(null)
  const [apiKeyError, setApiKeyError] = useState<string | null>(null)

  async function handleParse(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setParsed(null)
    setLoading(true)
    try {
      const res = await parseRecipe(freeText, useOpenai)
      setParsed(res)
    } catch (err: unknown) {
      const apiKeyMsg = getApiKeyErrorDetail(err)
      if (apiKeyMsg) setApiKeyError(apiKeyMsg)
      else setError(err && typeof err === 'object' && 'detail' in err ? String((err as { detail: unknown }).detail) : 'Parse failed')
    } finally {
      setLoading(false)
    }
  }

  async function handleCreate() {
    if (!parsed) return
    setLoading(true)
    setError(null)
    try {
      await createRecipe({
        title: parsed.title,
        ingredients: parsed.ingredients,
        steps: parsed.steps,
      })
      onCreated()
      onClose()
    } catch (err: unknown) {
      setError(err && typeof err === 'object' && 'detail' in err ? String((err as { detail: unknown }).detail) : 'Create failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal__head">
          <h2>Parse recipe from text</h2>
          <button type="button" onClick={onClose} aria-label="Close">×</button>
        </div>
        <form onSubmit={handleParse}>
          <textarea
            placeholder="Paste recipe text…"
            value={freeText}
            onChange={(e) => setFreeText(e.target.value)}
            rows={5}
            required
          />
          <label
            className={!aiEnabled ? 'modal__label--disabled' : ''}
            title={!aiEnabled ? 'Enable AI in Settings (My API key or Use hosted model)' : undefined}
          >
            <input
              type="checkbox"
              checked={useOpenai}
              onChange={(e) => aiEnabled && setUseOpenai(e.target.checked)}
              disabled={!aiEnabled}
            />
            Use AI (if enabled in Settings)
          </label>
          <button type="submit" disabled={loading}>Parse</button>
        </form>
        {error && <p className="modal__error">{error}</p>}
        {parsed && (
          <div className="modal__parsed">
            <p><strong>{parsed.title}</strong></p>
            <p>Ingredients: {parsed.ingredients.length}. Steps: {parsed.steps.length}.</p>
            <button type="button" onClick={handleCreate} disabled={loading}>Create recipe</button>
          </div>
        )}
      </div>
      {apiKeyError && (
        <AlertModal
          title="AI / API key"
          message={apiKeyError}
          onClose={() => setApiKeyError(null)}
        />
      )}
    </div>
  )
}
