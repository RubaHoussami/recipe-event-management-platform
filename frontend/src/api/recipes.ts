import { apiRequest } from './http'

export interface Recipe {
  id: string
  owner_id: string
  title: string
  description: string | null
  cuisine: string | null
  ingredients: string[]
  steps: string[]
  tags?: string[]
  statuses?: string[]
  created_at: string
  updated_at: string
  /** Current user's access: owner, editor, or viewer (only in GET single). */
  access?: 'owner' | 'editor' | 'viewer'
}

export interface Paginated<T> {
  items: T[]
  total: number
  limit: number
  offset: number
}

export interface RecipeCreate {
  title: string
  description?: string | null
  cuisine?: string | null
  ingredients: string[]
  steps: string[]
}

export interface RecipeUpdate {
  title?: string
  description?: string | null
  cuisine?: string | null
  ingredients?: string[]
  steps?: string[]
}

function buildQuery(params: { q?: string; tag?: string; status?: string; limit?: number; offset?: number }) {
  const sp = new URLSearchParams()
  if (params.q != null) sp.set('q', params.q)
  if (params.tag != null) sp.set('tag', params.tag)
  if (params.status != null) sp.set('status', params.status)
  if (params.limit != null) sp.set('limit', String(params.limit))
  if (params.offset != null) sp.set('offset', String(params.offset))
  const qs = sp.toString()
  return qs ? '?' + qs : ''
}

export function listRecipes(params: Record<string, unknown> = {}): Promise<Paginated<Recipe>> {
  return apiRequest<Paginated<Recipe>>('/recipes/' + buildQuery(params as { q?: string; tag?: string; status?: string; limit?: number; offset?: number }))
}

export function getRecipe(id: string): Promise<Recipe> {
  return apiRequest<Recipe>('/recipes/' + id)
}

export function createRecipe(body: RecipeCreate): Promise<Recipe> {
  return apiRequest<Recipe>('/recipes/', { method: 'POST', body: JSON.stringify(body) })
}

export function updateRecipe(id: string, body: RecipeUpdate): Promise<Recipe> {
  return apiRequest<Recipe>('/recipes/' + id, { method: 'PATCH', body: JSON.stringify(body) })
}

export function deleteRecipe(id: string): Promise<void> {
  return apiRequest<void>('/recipes/' + id, { method: 'DELETE' })
}

export function addRecipeTag(recipeId: string, tag: string): Promise<void> {
  return apiRequest<void>('/recipes/' + recipeId + '/tags', { method: 'POST', body: JSON.stringify({ tag }) })
}

export function removeRecipeTag(recipeId: string, tag: string): Promise<void> {
  return apiRequest<void>('/recipes/' + recipeId + '/tags/' + encodeURIComponent(tag), { method: 'DELETE' })
}

export const RECIPE_STATUSES = ['favorite', 'to_try', 'made_before'] as const

export function addRecipeStatus(recipeId: string, status: string): Promise<void> {
  return apiRequest<void>('/recipes/' + recipeId + '/statuses', { method: 'POST', body: JSON.stringify({ status }) })
}

export function removeRecipeStatus(recipeId: string, status: string): Promise<void> {
  return apiRequest<void>('/recipes/' + recipeId + '/statuses/' + status, { method: 'DELETE' })
}
