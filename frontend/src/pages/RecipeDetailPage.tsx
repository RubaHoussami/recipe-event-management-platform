import { useState } from 'react'
import { useParams, useNavigate, Link, useOutletContext } from 'react-router-dom'
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
import { listShares } from '../api/shares'
import type { UserMe } from '../api/auth'
import { ShareModal } from '../components/ShareModal'
import { ParseRecipeModal } from '../components/ParseRecipeModal'
import './RecipeDetailPage.css'

export function RecipeDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { user } = useOutletContext<{ user: UserMe | null }>()
  const [shareOpen, setShareOpen] = useState(false)
  const [parseOpen, setParseOpen] = useState(false)
  const [newTag, setNewTag] = useState('')

  const { data: recipe, isLoading, error } = useQuery({
    queryKey: ['recipe', id],
    queryFn: () => getRecipe(id!),
    enabled: !!id,
  })
  const { data: shares } = useQuery({
    queryKey: ['recipe-shares', id],
    queryFn: () => listShares(id!),
    enabled: !!id && shareOpen,
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

  if (!id) return <p>Invalid recipe.</p>
  if (isLoading) return <p>Loading…</p>
  if (error || !recipe) return <p>Recipe not found.</p>

  const tags = recipe.tags ?? []
  const statuses = recipe.statuses ?? []

  return (
    <div className="recipe-detail">
      <div className="recipe-detail__nav">
        <Link to="/dashboard/recipes">← Recipes</Link>
      </div>
      <div className="recipe-detail__head">
        <h1>{recipe.title}</h1>
        <div className="recipe-detail__actions">
          <button type="button" className="btn-secondary" onClick={() => setShareOpen(true)}>Share</button>
          {user?.openai_configured && (
            <button type="button" className="btn-secondary" onClick={() => setParseOpen(true)}>Parse from text</button>
          )}
          <Link to={'/dashboard/recipes/' + id + '/edit'} className="btn-secondary">Edit</Link>
          <button type="button" className="btn-secondary" onClick={() => deleteMutation.mutate()} disabled={deleteMutation.isPending}>
            Delete
          </button>
        </div>
      </div>
      {recipe.cuisine && <p className="recipe-detail__cuisine">Cuisine: {recipe.cuisine}</p>}
      {recipe.description && <p>{recipe.description}</p>}
      <section>
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
      </section>
      <section>
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
      </section>
      <section>
        <h2>Ingredients</h2>
        <ul>{recipe.ingredients.map((i, idx) => <li key={idx}>{i}</li>)}</ul>
      </section>
      <section>
        <h2>Steps</h2>
        <ol>{recipe.steps.map((s, idx) => <li key={idx}>{s}</li>)}</ol>
      </section>
      {shareOpen && (
        <ShareModal
          recipeId={id}
          shares={shares ?? []}
          onClose={() => setShareOpen(false)}
          onUpdated={() => queryClient.invalidateQueries({ queryKey: ['recipe-shares', id] })}
        />
      )}
      {parseOpen && (
        <ParseRecipeModal
          onClose={() => setParseOpen(false)}
          onCreated={() => {
            setParseOpen(false)
            queryClient.invalidateQueries({ queryKey: ['recipes'] })
          }}
        />
      )}
    </div>
  )
}
