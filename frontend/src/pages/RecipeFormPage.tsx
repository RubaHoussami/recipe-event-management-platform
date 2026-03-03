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

        {error && <p className="recipe-form-page__error">Failed to save.</p>}
        <div className="recipe-form-page__actions">
          <button type="submit" className="btn-primary" disabled={loading}>{loading ? 'Saving…' : isEdit ? 'Update' : 'Create'}</button>
          <Link to={isEdit ? '/dashboard/recipes/' + id : '/dashboard/recipes'} className="btn-secondary">Cancel</Link>
        </div>
      </form>
    </div>
  )
}
