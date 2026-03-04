import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useOutletContext } from 'react-router-dom'
import { parseRecipe } from '../api/ai'
import type { UserMe } from '../api/auth'
import { AlertModal, getApiKeyErrorDetail } from '../components/AlertModal'
import './ParseRecipePage.css'

export function ParseRecipePage() {
  const navigate = useNavigate()
  const { user } = useOutletContext<{ user: UserMe | null }>()
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
      const res = await parseRecipe(freeText, useOpenai)
      const parsed = {
        title: res.title ?? '',
        description: res.description ?? '',
        ingredients: Array.isArray(res.ingredients) && res.ingredients.length > 0 ? res.ingredients : [''],
        steps: Array.isArray(res.steps) && res.steps.length > 0 ? res.steps : [''],
        cuisine: res.cuisine ?? null,
        shareWith: Array.isArray(res.share_with) && res.share_with.length > 0 ? res.share_with : [''],
      }
      navigate('/dashboard/recipes/new', { state: { parsed } })
    } catch (err: unknown) {
      const apiKeyMsg = getApiKeyErrorDetail(err)
      if (apiKeyMsg) setApiKeyError(apiKeyMsg)
      else setError(err && typeof err === 'object' && 'detail' in err ? String((err as { detail: unknown }).detail) : 'Parse failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="parse-recipe-page">
      {apiKeyError && (
        <AlertModal
          title="OpenAI API key"
          message={apiKeyError}
          onClose={() => setApiKeyError(null)}
        />
      )}
      <Link to="/dashboard/recipes" className="parse-recipe-page__back">← Back to recipes</Link>
      <h1>Parse recipe</h1>
      <p className="parse-recipe-page__intro">Paste recipe text below. We’ll extract title, ingredients, and steps, then open the new recipe form with the fields filled so you can edit and save.</p>

      <form onSubmit={handleParse} className="parse-recipe-page__form">
        <label className="parse-recipe-page__label">
          <span>Recipe text</span>
          <textarea
            className="parse-recipe-page__textarea"
            placeholder="Paste recipe text here…"
            value={freeText}
            onChange={(e) => setFreeText(e.target.value)}
            rows={12}
            required
          />
        </label>
        <label
          className={`parse-recipe-page__checkbox${!user?.openai_configured ? ' parse-recipe-page__checkbox--disabled' : ''}`}
          title={!user?.openai_configured ? 'To use this, add API key in Settings' : undefined}
        >
          <input
            type="checkbox"
            checked={useOpenai}
            onChange={(e) => user?.openai_configured && setUseOpenai(e.target.checked)}
            disabled={!user?.openai_configured}
          />
          <span>Use OpenAI for better parsing</span>
        </label>
        <div className="parse-recipe-page__actions">
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Parsing…' : 'Parse'}
          </button>
          <Link to="/dashboard/recipes/new" className="btn-secondary">Add recipe manually</Link>
        </div>
      </form>

      {error && <p className="parse-recipe-page__error">{error}</p>}
    </div>
  )
}
