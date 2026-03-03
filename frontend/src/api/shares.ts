import { apiRequest } from './http'

export interface Share {
  id: string
  recipe_id: string
  shared_with_user_id: string
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
