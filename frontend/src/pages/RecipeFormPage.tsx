import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getRecipe, createRecipe, updateRecipe } from '../api/recipes'
import type { RecipeCreate } from '../api/recipes'
import './RecipeFormPage.css'

export function RecipeFormPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const isEdit = !!id

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [ingredients, setIngredients] = useState<string[]>([''])
  const [steps, setSteps] = useState<string[]>([''])

  const { data: recipe, isLoading: recipeLoading } = useQuery({
    queryKey: ['recipe', id],
    queryFn: () => getRecipe(id!),
    enabled: isEdit,
  })

  useEffect(() => {
    if (recipe) {
      setTitle(recipe.title)
      setDescription(recipe.description ?? '')
      setIngredients(recipe.ingredients.length ? recipe.ingredients : [''])
      setSteps(recipe.steps.length ? recipe.steps : [''])
    }
  }, [recipe])

  const createMutation = useMutation({
    mutationFn: (body: RecipeCreate) => createRecipe(body),
    onSuccess: (r) => {
      queryClient.invalidateQueries({ queryKey: ['recipes'] })
      navigate('/dashboard/recipes/' + r.id)
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

  function collectIngredients(): string[] {
    return ingredients.filter((s) => s.trim() !== '')
  }
  function collectSteps(): string[] {
    return steps.filter((s) => s.trim() !== '')
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const body: RecipeCreate = {
      title: title.trim(),
      description: description.trim() || null,
      ingredients: collectIngredients(),
      steps: collectSteps(),
    }
    if (isEdit) updateMutation.mutate(body)
    else createMutation.mutate(body)
  }

  const loading = createMutation.isPending || updateMutation.isPending
  const error = createMutation.error || updateMutation.error
  if (isEdit && recipeLoading) return <p>Loading…</p>

  return (
    <div className="recipe-form-page">
      <Link to={isEdit ? '/dashboard/recipes/' + id : '/dashboard/recipes'} className="recipe-form-page__back">← Back to recipes</Link>
      <h1>{isEdit ? 'Edit recipe' : 'New recipe'}</h1>
      <form onSubmit={handleSubmit}>
        <label>
          Title
          <input value={title} onChange={(e) => setTitle(e.target.value)} required />
        </label>
        <label>
          Description
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} />
        </label>
        <label>
          Ingredients (one per line)
          <div className="recipe-form-page__row">
            {ingredients.map((val, i) => (
              <input
                key={i}
                value={val}
                onChange={(e) => {
                  const next = [...ingredients]
                  next[i] = e.target.value
                  setIngredients(next)
                }}
                onBlur={() => {
                  if (i === ingredients.length - 1 && ingredients[i]?.trim()) setIngredients([...ingredients, ''])
                  else if (ingredients.length > 1 && !ingredients[i]?.trim())
                    setIngredients(ingredients.filter((_, j) => j !== i))
                }}
              />
            ))}
          </div>
        </label>
        <label>
          Steps (one per line)
          <div className="recipe-form-page__row">
            {steps.map((val, i) => (
              <input
                key={i}
                value={val}
                onChange={(e) => {
                  const next = [...steps]
                  next[i] = e.target.value
                  setSteps(next)
                }}
                onBlur={() => {
                  if (i === steps.length - 1 && steps[i]?.trim()) setSteps([...steps, ''])
                  else if (steps.length > 1 && !steps[i]?.trim()) setSteps(steps.filter((_, j) => j !== i))
                }}
              />
            ))}
          </div>
        </label>
        {error && <p className="recipe-form-page__error">Failed to save.</p>}
        <div className="recipe-form-page__actions">
          <button type="submit" className="btn-primary" disabled={loading}>{loading ? 'Saving…' : isEdit ? 'Update' : 'Create'}</button>
          <Link to={isEdit ? '/dashboard/recipes/' + id : '/dashboard/recipes'} className="btn-secondary">Cancel</Link>
        </div>
      </form>
    </div>
  )
}
