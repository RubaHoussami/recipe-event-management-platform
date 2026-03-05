import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate, Link, useLocation, useOutletContext } from 'react-router-dom'
import type { UserMe } from '../api/auth'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getRecipe, createRecipe, updateRecipe } from '../api/recipes'
import type { RecipeCreate } from '../api/recipes'
import { createShare, listShares, deleteShare } from '../api/shares'
import { assignCuisine } from '../api/ai'
import type { RecipeSuggestionItem } from '../api/ai'
import { AlertModal, getApiKeyErrorDetail } from '../components/AlertModal'
import { ShareModal } from '../components/ShareModal'
import { SuggestRecipeModal } from '../components/SuggestRecipeModal'
import './RecipeFormPage.css'

function errDetailToString(err: unknown): string {
  if (err && typeof err === 'object' && 'detail' in err) {
    const d = (err as { detail: unknown }).detail
    if (typeof d === 'string') return d
    if (Array.isArray(d)) return d.map((e) => (e?.msg ?? e?.loc?.join('.') ?? JSON.stringify(e))).join('; ')
    if (d && typeof d === 'object') return (d as { msg?: string }).msg ?? (d as { message?: string }).message ?? JSON.stringify(d)
  }
  return 'Failed to share'
}

interface ParsedState {
  title?: string
  description?: string
  ingredients?: string[]
  steps?: string[]
  cuisine?: string | null
  shareWith?: string[]
}

export function RecipeFormPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const location = useLocation()
  const queryClient = useQueryClient()
  const { user } = useOutletContext<{ user: UserMe | null }>()
  const canUseAi =
    (user?.ai_preference === 'my_key' && user?.openai_configured) ||
    (user?.ai_preference === 'hosted' && user?.azure_ai_available && user?.email_verified)
  const isEdit = !!id
  const appliedParsedRef = useRef(false)

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [cuisine, setCuisine] = useState('')
  const [ingredients, setIngredients] = useState<string[]>([''])
  const [steps, setSteps] = useState<string[]>([''])
  type ShareWithEntry = { email: string; permission: 'viewer' | 'editor' }
  const [shareWith, setShareWith] = useState<ShareWithEntry[]>([ { email: '', permission: 'viewer' } ])
  const [apiKeyError, setApiKeyError] = useState<string | null>(null)
  const [shareOpen, setShareOpen] = useState(false)
  const [suggestModalOpen, setSuggestModalOpen] = useState(false)

  const { data: recipe, isLoading: recipeLoading } = useQuery({
    queryKey: ['recipe', id],
    queryFn: () => getRecipe(id!),
    enabled: isEdit,
  })
  const { data: shares } = useQuery({
    queryKey: ['recipe-shares', id],
    queryFn: () => listShares(id!),
    enabled: isEdit && !!id,
  })

  useEffect(() => {
    if (recipe) {
      setTitle(recipe.title)
      setDescription(recipe.description ?? '')
      setCuisine(recipe.cuisine ?? '')
      setIngredients(recipe.ingredients.length ? recipe.ingredients : [''])
      setSteps(recipe.steps.length ? recipe.steps : [''])
    }
  }, [recipe])

  useEffect(() => {
    if (isEdit && recipe?.access === 'viewer') {
      navigate('/dashboard/recipes/' + id, { replace: true })
    }
  }, [isEdit, recipe?.access, id, navigate])

  useEffect(() => {
    if (isEdit || appliedParsedRef.current) return
    const state = location.state as { parsed?: ParsedState } | null
    const parsed = state?.parsed
    if (!parsed) return
    appliedParsedRef.current = true
    if (parsed.title != null) setTitle(parsed.title)
    if (parsed.description != null) setDescription(parsed.description)
    if (parsed.cuisine != null) setCuisine(parsed.cuisine)
    if (parsed.ingredients != null && parsed.ingredients.length > 0) setIngredients(parsed.ingredients)
    if (parsed.steps != null && parsed.steps.length > 0) setSteps(parsed.steps)
    if (parsed.shareWith != null && parsed.shareWith.length > 0) {
      setShareWith(parsed.shareWith.map((email) => ({ email, permission: 'viewer' as const })))
    }
    navigate(location.pathname, { replace: true, state: {} })
  }, [isEdit, location.state, location.pathname, navigate])

  const createMutation = useMutation({
    mutationFn: async ({ body, shareWith: entries }: { body: RecipeCreate; shareWith: ShareWithEntry[] }) => {
      const r = await createRecipe(body)
      const list = entries.filter((e) => e.email.trim() !== '')
      const shareErrors: string[] = []
      for (const { email, permission } of list) {
        try {
          await createShare(r.id, { shared_with_email: email.trim(), permission })
        } catch (err: unknown) {
          const msg = errDetailToString(err)
          shareErrors.push(`${email}: ${msg}`)
        }
      }
      return { recipe: r, shareErrors }
    },
    onSuccess: ({ recipe: r, shareErrors }) => {
      queryClient.invalidateQueries({ queryKey: ['recipes'] })
      queryClient.invalidateQueries({ queryKey: ['recipe-shares', r.id] })
      navigate('/dashboard/recipes/' + r.id, { state: shareErrors.length ? { shareErrors } : undefined })
    },
  })
  const updateMutation = useMutation({
    mutationFn: (body: RecipeCreate) => updateRecipe(id!, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recipe', id] })
      queryClient.invalidateQueries({ queryKey: ['recipes'] })
      navigate('/dashboard/recipes/' + id)
    },
  })
  const assignCuisineMutation = useMutation({
    mutationFn: () => assignCuisine(id!),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['recipe', id] })
      if (data?.cuisine) setCuisine(data.cuisine)
    },
    onError: (err) => {
      const msg = getApiKeyErrorDetail(err)
      if (msg) setApiKeyError(msg)
    },
  })
  const removeShareMutation = useMutation({
    mutationFn: (shareId: string) => deleteShare(id!, shareId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['recipe-shares', id] }),
  })

  function collectIngredients(): string[] {
    return ingredients.filter((s) => s.trim() !== '')
  }
  function collectSteps(): string[] {
    return steps.filter((s) => s.trim() !== '')
  }

  function addIngredient() {
    setIngredients((prev) => [...prev, ''])
  }
  function removeIngredient(index: number) {
    setIngredients((prev) => (prev.length <= 1 ? [''] : prev.filter((_, i) => i !== index)))
  }
  function addStep() {
    setSteps((prev) => [...prev, ''])
  }
  function removeStep(index: number) {
    setSteps((prev) => (prev.length <= 1 ? [''] : prev.filter((_, i) => i !== index)))
  }
  function addShareWith() {
    setShareWith((prev) => [...prev, { email: '', permission: 'viewer' }])
  }
  function removeShareWith(index: number) {
    setShareWith((prev) => (prev.length <= 1 ? [{ email: '', permission: 'viewer' }] : prev.filter((_, i) => i !== index)))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const body: RecipeCreate = {
      title: title.trim(),
      description: description.trim() || null,
      cuisine: cuisine.trim() || null,
      ingredients: collectIngredients(),
      steps: collectSteps(),
    }
    if (isEdit) {
      updateMutation.mutate(body)
    } else {
      createMutation.mutate({ body, shareWith })
    }
  }

  function applySuggestion(s: RecipeSuggestionItem, cuisineStr?: string) {
    if (s.title) setTitle(s.title)
    if (cuisineStr) setCuisine(cuisineStr)
    if (s.ingredients?.length) setIngredients(s.ingredients.length ? s.ingredients : [''])
    else if (s.ingredients && Array.isArray(s.ingredients)) setIngredients(s.ingredients)
    if (s.steps?.length) setSteps(s.steps.length ? s.steps : [''])
    else if (s.steps && Array.isArray(s.steps)) setSteps(s.steps)
  }

  const loading = createMutation.isPending || updateMutation.isPending
  const error = createMutation.error || updateMutation.error
  if (isEdit && recipeLoading) return <p>Loading…</p>

  return (
    <div className="recipe-form-page">
      {apiKeyError && (
        <AlertModal
          title="OpenAI API key"
          message={apiKeyError}
          onClose={() => setApiKeyError(null)}
        />
      )}
      <Link to={isEdit ? '/dashboard/recipes/' + id : '/dashboard/recipes'} state={isEdit ? location.state : undefined} className="recipe-form-page__back">← Back</Link>
      <div className="recipe-form-page__title-row">
        <h1>{isEdit ? 'Edit recipe' : 'New recipe'}</h1>
        {!isEdit && (
          <button
            type="button"
            className={`btn-secondary recipe-form-page__suggest-btn${!canUseAi ? ' recipe-form-page__suggest-btn--disabled' : ''}`}
            onClick={() => canUseAi && setSuggestModalOpen(true)}
            disabled={!canUseAi}
            title={!canUseAi ? 'Enable AI in Settings to use suggestions' : undefined}
          >
            Suggest by cuisine
          </button>
        )}
      </div>
      {suggestModalOpen && (
        <SuggestRecipeModal
          onClose={() => setSuggestModalOpen(false)}
          onSelect={applySuggestion}
          disabled={!canUseAi}
        />
      )}
      <form onSubmit={handleSubmit}>
        <label>
          Title
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Spaghetti Carbonara" required />
        </label>
        <label>
          Description
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Optional" rows={2} />
        </label>
        <label className="recipe-form-page__cuisine-row">
          <span>Cuisine</span>
          <input value={cuisine} onChange={(e) => setCuisine(e.target.value)} placeholder="Optional" />
          {isEdit && (
            <button
              type="button"
              className={`btn-secondary recipe-form-page__detect-cuisine${!canUseAi ? ' recipe-form-page__detect-cuisine--disabled' : ''}`}
              onClick={() => canUseAi && assignCuisineMutation.mutate()}
              disabled={assignCuisineMutation.isPending || !canUseAi}
              title={!canUseAi ? 'Enable AI in Settings (My API key or Use hosted model)' : undefined}
            >
              {assignCuisineMutation.isPending ? 'Detecting…' : 'Detect cuisine'}
            </button>
          )}
        </label>

        <fieldset className="recipe-form-page__fieldset">
          <legend>Ingredients</legend>
          <p className="recipe-form-page__hint">Add each ingredient on its own row. Use the button below to add more.</p>
          {ingredients.map((val, i) => (
            <div key={i} className="recipe-form-page__row-item">
              <input
                value={val}
                onChange={(e) => {
                  const next = [...ingredients]
                  next[i] = e.target.value
                  setIngredients(next)
                }}
                placeholder={`Ingredient ${i + 1}`}
              />
              <button type="button" className="recipe-form-page__remove" onClick={() => removeIngredient(i)} title="Remove">Remove</button>
            </div>
          ))}
          <button type="button" className="recipe-form-page__add" onClick={addIngredient}>+ Add ingredient</button>
        </fieldset>

        <fieldset className="recipe-form-page__fieldset">
          <legend>Steps</legend>
          <p className="recipe-form-page__hint">Add each step on its own row. Use the button below to add more.</p>
          {steps.map((val, i) => (
            <div key={i} className="recipe-form-page__row-item">
              <input
                value={val}
                onChange={(e) => {
                  const next = [...steps]
                  next[i] = e.target.value
                  setSteps(next)
                }}
                placeholder={`Step ${i + 1}`}
              />
              <button type="button" className="recipe-form-page__remove" onClick={() => removeStep(i)} title="Remove">Remove</button>
            </div>
          ))}
          <button type="button" className="recipe-form-page__add" onClick={addStep}>+ Add step</button>
        </fieldset>

        {!isEdit && (
          <fieldset className="recipe-form-page__fieldset">
            <legend>Share with</legend>
            <p className="recipe-form-page__hint">Add email addresses and choose Viewer (can only view) or Editor (can edit).</p>
            {shareWith.map((entry, i) => (
              <div key={i} className="recipe-form-page__row-item recipe-form-page__share-row">
                <input
                  type="email"
                  value={entry.email}
                  onChange={(e) => {
                    const next = [...shareWith]
                    next[i] = { ...next[i], email: e.target.value }
                    setShareWith(next)
                  }}
                  placeholder="email@example.com"
                />
                <select
                  value={entry.permission}
                  onChange={(e) => {
                    const next = [...shareWith]
                    next[i] = { ...next[i], permission: e.target.value as 'viewer' | 'editor' }
                    setShareWith(next)
                  }}
                  title="Permission"
                  className="recipe-form-page__permission-select"
                >
                  <option value="viewer">Viewer</option>
                  <option value="editor">Editor</option>
                </select>
                <button type="button" className="recipe-form-page__remove" onClick={() => removeShareWith(i)} title="Remove">Remove</button>
              </div>
            ))}
            <button type="button" className="recipe-form-page__add" onClick={addShareWith}>+ Add person</button>
          </fieldset>
        )}
        {isEdit && id && (
          <fieldset className="recipe-form-page__fieldset">
            <legend>Share with</legend>
            {shares && shares.length > 0 ? (
              <ul className="recipe-form-page__shared-list">
                {shares.map((s) => (
                  <li key={s.id} className="recipe-form-page__shared-item">
                    <span>{s.shared_with_email || s.shared_with_user_id}</span>
                    <span className="recipe-form-page__shared-permission">({s.permission})</span>
                    <button type="button" className="recipe-form-page__remove" onClick={() => removeShareMutation.mutate(s.id)} disabled={removeShareMutation.isPending}>Remove</button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="recipe-form-page__hint">Not shared with anyone yet.</p>
            )}
            <button type="button" className="btn-secondary" onClick={() => setShareOpen(true)}>Share</button>
          </fieldset>
        )}

        {shareOpen && id && (
          <ShareModal
            target="recipe"
            resourceId={id}
            onClose={() => setShareOpen(false)}
            onUpdated={() => queryClient.invalidateQueries({ queryKey: ['recipe-shares', id] })}
          />
        )}
        {error && <p className="recipe-form-page__error">Failed to save.</p>}
        <div className="recipe-form-page__actions">
          <button type="submit" className="btn-primary" disabled={loading}>{loading ? 'Saving…' : isEdit ? 'Update' : 'Create'}</button>
          <Link to={isEdit ? '/dashboard/recipes/' + id : '/dashboard/recipes'} state={isEdit ? location.state : undefined} className="btn-secondary">Cancel</Link>
        </div>
      </form>
    </div>
  )
}
