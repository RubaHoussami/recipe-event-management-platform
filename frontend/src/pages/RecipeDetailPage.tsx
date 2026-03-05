import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link, useLocation, useOutletContext } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getRecipe,
  deleteRecipe,
  addRecipeTag,
  removeRecipeTag,
  addRecipeStatus,
  removeRecipeStatus,
  RECIPE_STATUSES,
} from '../api/recipes'
import { listShares, deleteShare } from '../api/shares'
import { assignCuisine } from '../api/ai'
import type { UserMe } from '../api/auth'
import { ShareModal } from '../components/ShareModal'
import { AlertModal, getApiKeyErrorDetail } from '../components/AlertModal'
import './RecipeDetailPage.css'

export function RecipeDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const location = useLocation()
  const queryClient = useQueryClient()
  const { user } = useOutletContext<{ user: UserMe | null }>()
  const canUseAi =
    (user?.ai_preference === 'my_key' && user?.openai_configured) ||
    (user?.ai_preference === 'hosted' && user?.azure_ai_available && user?.email_verified)
  const [shareOpen, setShareOpen] = useState(false)
  const [newTag, setNewTag] = useState('')
  const [shareErrors, setShareErrors] = useState<string[]>([])
  const [apiKeyError, setApiKeyError] = useState<string | null>(null)

  useEffect(() => {
    const state = location.state as { shareErrors?: string[] } | null
    if (state?.shareErrors?.length) {
      setShareErrors(state.shareErrors)
      navigate(location.pathname, { replace: true, state: {} })
    }
  }, [location.state, location.pathname, navigate])

  const { data: recipe, isLoading, error } = useQuery({
    queryKey: ['recipe', id],
    queryFn: () => getRecipe(id!),
    enabled: !!id,
  })
  const { data: shares } = useQuery({
    queryKey: ['recipe-shares', id],
    queryFn: () => listShares(id!),
    enabled: !!id && recipe?.access === 'owner',
  })

  const deleteMutation = useMutation({
    mutationFn: () => deleteRecipe(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recipes'] })
      navigate('/dashboard/recipes')
    },
  })

  const addTagMutation = useMutation({
    mutationFn: (tag: string) => addRecipeTag(id!, tag),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['recipe', id] }),
  })
  const removeTagMutation = useMutation({
    mutationFn: (tag: string) => removeRecipeTag(id!, tag),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['recipe', id] }),
  })
  const addStatusMutation = useMutation({
    mutationFn: (status: string) => addRecipeStatus(id!, status),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['recipe', id] }),
  })
  const removeStatusMutation = useMutation({
    mutationFn: (status: string) => removeRecipeStatus(id!, status),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['recipe', id] }),
  })
  const assignCuisineMutation = useMutation({
    mutationFn: () => assignCuisine(id!),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['recipe', id] }),
    onError: (err) => {
      const msg = getApiKeyErrorDetail(err)
      if (msg) setApiKeyError(msg)
    },
  })
  const removeShareMutation = useMutation({
    mutationFn: (shareId: string) => deleteShare(id!, shareId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['recipe-shares', id] }),
  })

  const backTo = (location.state as { from?: string } | null)?.from ?? '/dashboard/recipes'

  if (!id) return <p>Invalid recipe.</p>
  if (isLoading) return <p>Loading…</p>
  if (error || !recipe) return <p>Recipe not found.</p>

  const tags = recipe.tags ?? []
  const statuses = recipe.statuses ?? []

  return (
    <div className="recipe-detail">
      {apiKeyError && (
        <AlertModal
          title="OpenAI API key"
          message={apiKeyError}
          onClose={() => setApiKeyError(null)}
        />
      )}
      <div className="recipe-detail__nav">
        <Link to={backTo}>← Back</Link>
      </div>
      <div className="recipe-detail__head">
        <h1>{recipe.title}</h1>
        <div className="recipe-detail__actions">
          {(recipe.access === 'owner' || recipe.access === 'editor') && (
            <>
              <button type="button" className="btn-secondary" onClick={() => setShareOpen(true)}>Share</button>
              <Link to={'/dashboard/recipes/' + id + '/edit'} state={location.state} className="btn-secondary">Edit</Link>
              {recipe.access === 'owner' && (
                <button type="button" className="btn-delete" onClick={() => window.confirm('Delete this recipe?') && deleteMutation.mutate()} disabled={deleteMutation.isPending}>
                  {deleteMutation.isPending ? 'Deleting…' : 'Delete'}
                </button>
              )}
            </>
          )}
        </div>
      </div>
      <div className="recipe-detail__cuisine-row">
        {recipe.cuisine ? (
          <p className="recipe-detail__cuisine">Cuisine: {recipe.cuisine}</p>
        ) : (
          <p className="recipe-detail__cuisine recipe-detail__cuisine--empty">Cuisine: —</p>
        )}
        {(recipe.access === 'owner' || recipe.access === 'editor') && (
          <button
            type="button"
            className={`btn-secondary recipe-detail__detect-cuisine${!canUseAi ? ' recipe-detail__detect-cuisine--disabled' : ''}`}
            onClick={() => canUseAi && assignCuisineMutation.mutate()}
            disabled={assignCuisineMutation.isPending || !canUseAi}
            title={!canUseAi ? 'Enable AI in Settings (My API key or Use hosted model)' : undefined}
          >
            {assignCuisineMutation.isPending ? 'Detecting…' : 'Detect cuisine'}
          </button>
        )}
      </div>
      {shareErrors.length > 0 && (
        <div className="recipe-detail__share-errors card">
          <p className="recipe-detail__share-errors-title">Recipe created, but failed to share with:</p>
          <ul>{shareErrors.map((e, i) => <li key={i}>{e}</li>)}</ul>
        </div>
      )}
      {(recipe.access === 'owner' || recipe.access === 'editor') && (
        <section className="recipe-detail__shared-section">
          <h2 className="recipe-detail__shared-heading">Shared with</h2>
          {shares && shares.length > 0 ? (
            <ul className="recipe-detail__shared-list">
              {shares.map((s) => (
                <li key={s.id} className="recipe-detail__shared-item">
                  <span>{s.shared_with_email || s.shared_with_user_id}</span>
                  <span className="recipe-detail__shared-permission">({s.permission})</span>
                  <button
                    type="button"
                    className="btn-delete recipe-detail__shared-remove"
                    onClick={() => removeShareMutation.mutate(s.id)}
                    disabled={removeShareMutation.isPending}
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="recipe-detail__shared-empty">Not shared with anyone yet.</p>
          )}
          <button type="button" className="btn-secondary" onClick={() => setShareOpen(true)}>Share</button>
        </section>
      )}
      {recipe.description && (
        <div className="recipe-detail__description">
          <p style={{ margin: 0 }}>{recipe.description}</p>
        </div>
      )}
      <div className="recipe-detail__grid">
        <section className="recipe-detail__section">
          <h2>Ingredients</h2>
          <ul className="recipe-detail__list">{recipe.ingredients.map((i, idx) => <li key={idx}>{i}</li>)}</ul>
        </section>
        <section className="recipe-detail__section">
          <h2>Steps</h2>
          <ol className="recipe-detail__list recipe-detail__list--steps">{recipe.steps.map((s, idx) => <li key={idx}>{s}</li>)}</ol>
        </section>
      </div>
      {(recipe.access === 'owner' || recipe.access === 'editor') && (
        <section className="recipe-detail__meta-row">
          <div className="recipe-detail__section">
            <h2>Tags</h2>
            <div className="recipe-detail__tags">
              {tags.map((t) => (
                <span key={t} className="recipe-detail__tag">
                  {t}
                  <button type="button" onClick={() => removeTagMutation.mutate(t)} aria-label="Remove tag">×</button>
                </span>
              ))}
            </div>
            <form
              className="recipe-detail__add-tag"
              onSubmit={(e) => {
                e.preventDefault()
                if (newTag.trim()) addTagMutation.mutate(newTag.trim(), { onSuccess: () => setNewTag('') })
              }}
            >
              <input value={newTag} onChange={(e) => setNewTag(e.target.value)} placeholder="Add tag" />
              <button type="submit" className="btn-primary">Add</button>
            </form>
          </div>
          <div className="recipe-detail__section">
            <h2>Status</h2>
            <div className="recipe-detail__statuses">
              {RECIPE_STATUSES.map((s) => (
                <span key={s} className="recipe-detail__status">
                  {s}
                  {statuses.includes(s) ? (
                    <button type="button" onClick={() => removeStatusMutation.mutate(s)}>Remove</button>
                  ) : (
                    <button type="button" onClick={() => addStatusMutation.mutate(s)}>Add</button>
                  )}
                </span>
              ))}
            </div>
          </div>
        </section>
      )}
      {shareOpen && (
        <ShareModal
          target="recipe"
          resourceId={id}
          onClose={() => setShareOpen(false)}
          onUpdated={() => queryClient.invalidateQueries({ queryKey: ['recipe-shares', id] })}
        />
      )}
    </div>
  )
}
