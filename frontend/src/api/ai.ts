import { apiRequest } from './http'

export interface ParseRecipeResponse {
  title: string | null
  description?: string | null
  ingredients: string[] | null
  steps: string[] | null
  cuisine?: string | null
  share_with?: string[] | null
}

export function parseRecipe(freeText: string, useOpenai: boolean = false): Promise<ParseRecipeResponse> {
  return apiRequest<ParseRecipeResponse>('/ai/recipes/parse', {
    method: 'POST',
    body: JSON.stringify({ free_text: freeText, use_openai: useOpenai }),
  })
}

export function assignCuisine(recipeId: string): Promise<{ cuisine: string | null; id: string }> {
  return apiRequest('/ai/recipes/assign-cuisine', {
    method: 'POST',
    body: JSON.stringify({ recipe_id: recipeId }),
  })
}

export interface RecipeSuggestionItem {
  title: string
  ingredients: string[]
  steps: string[]
}

export function suggestRecipes(cuisine: string): Promise<{ suggestions: RecipeSuggestionItem[] }> {
  return apiRequest<{ suggestions: RecipeSuggestionItem[] }>('/ai/recipes/suggest', {
    method: 'POST',
    body: JSON.stringify({ cuisine }),
  })
}
