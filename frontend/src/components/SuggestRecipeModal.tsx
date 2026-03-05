import { useState } from 'react'
import { suggestRecipes } from '../api/ai'
import type { RecipeSuggestionItem } from '../api/ai'
import { AlertModal } from './AlertModal'
import './modal.css'

interface SuggestRecipeModalProps {
  onClose: () => void
  onSelect: (suggestion: RecipeSuggestionItem, cuisine?: string) => void
  disabled?: boolean
}

export function SuggestRecipeModal({ onClose, onSelect, disabled }: SuggestRecipeModalProps) {
  const [cuisine, setCuisine] = useState('')
  const [loading, setLoading] = useState(false)
  const [suggestions, setSuggestions] = useState<RecipeSuggestionItem[]>([])
  const [error, setError] = useState<string | null>(null)
  const [apiError, setApiError] = useState<string | null>(null)

  async function handleGetSuggestions(e: React.FormEvent) {
    e.preventDefault()
    const c = cuisine.trim()
    if (!c) return
    setError(null)
    setApiError(null)
    setSuggestions([])
    setLoading(true)
    try {
      const res = await suggestRecipes(c)
      setSuggestions(res.suggestions || [])
      if (!res.suggestions?.length) setError('No suggestions returned. Try another cuisine.')
    } catch (err: unknown) {
      const msg = err && typeof err === 'object' && 'detail' in err ? String((err as { detail: unknown }).detail) : 'Failed to get suggestions.'
      setApiError(msg)
    } finally {
      setLoading(false)
    }
  }

  function handleUse(s: RecipeSuggestionItem) {
    onSelect(s, cuisine.trim())
    onClose()
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal--suggest" onClick={(e) => e.stopPropagation()}>
        <div className="modal__head">
          <h2>Suggest recipe by cuisine</h2>
          <button type="button" onClick={onClose} aria-label="Close">×</button>
        </div>
        <p className="modal__intro">Enter a cuisine and we’ll suggest recipe ideas. Pick one to fill the form.</p>
        <form onSubmit={handleGetSuggestions} className="modal__form">
          <label>
            <span>Cuisine</span>
            <input
              type="text"
              value={cuisine}
              onChange={(e) => setCuisine(e.target.value)}
              placeholder="e.g. Italian, Mexican, Japanese"
              required
              disabled={disabled}
            />
          </label>
          <button type="submit" className="btn-primary" disabled={loading || disabled}>
            {loading ? 'Getting suggestions…' : 'Get suggestions'}
          </button>
        </form>
        {error && <p className="modal__error">{error}</p>}
        {suggestions.length > 0 && (
          <div className="modal__suggestions">
            <p className="modal__suggestions-title">Pick a recipe to use:</p>
            <ul className="modal__suggestions-list">
              {suggestions.map((s, i) => (
                <li key={i} className="modal__suggestion-item">
                  <div className="modal__suggestion-info">
                    <strong>{s.title || 'Untitled'}</strong>
                    <span className="modal__suggestion-meta">
                      {s.ingredients?.length ?? 0} ingredients, {s.steps?.length ?? 0} steps
                    </span>
                  </div>
                  <button type="button" className="btn-secondary modal__suggestion-use" onClick={() => handleUse(s)}>
                    Use this
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
      {apiError && (
        <AlertModal title="AI suggestion" message={apiError} onClose={() => setApiError(null)} />
      )}
    </div>
  )
}
