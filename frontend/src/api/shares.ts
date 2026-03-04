import { apiRequest } from './http'
import type { Recipe } from './recipes'

export interface Share {
  id: string
  recipe_id: string
  shared_with_user_id: string
  shared_with_email?: string | null
  permission: string
  created_at: string
}

export interface ShareCreate {
  shared_with_email?: string
  shared_with_user_id?: string
  permission: 'viewer' | 'editor'
}

export function listShares(recipeId: string): Promise<Share[]> {
  return apiRequest<Share[]>('/recipes/' + recipeId + '/shares')
}

export function createShare(recipeId: string, body: ShareCreate): Promise<Share> {
  return apiRequest<Share>('/recipes/' + recipeId + '/shares', { method: 'POST', body: JSON.stringify(body) })
}

export function deleteShare(recipeId: string, shareId: string): Promise<void> {
  return apiRequest<void>('/recipes/' + recipeId + '/shares/' + shareId, { method: 'DELETE' })
}

export interface SharedRecipeItem {
  recipe: Recipe
  permission: 'viewer' | 'editor'
}

export interface PaginatedSharedRecipes {
  items: SharedRecipeItem[]
  total: number
  limit: number
  offset: number
}

/** List recipes shared with the current user (includes permission per recipe) */
export function listSharedRecipes(params: { limit?: number; offset?: number } = {}): Promise<PaginatedSharedRecipes> {
  const sp = new URLSearchParams()
  if (params.limit != null) sp.set('limit', String(params.limit))
  if (params.offset != null) sp.set('offset', String(params.offset))
  const qs = sp.toString()
  return apiRequest<PaginatedSharedRecipes>('/shared/recipes' + (qs ? '?' + qs : ''))
}
