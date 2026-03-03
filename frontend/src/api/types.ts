export interface PaginatedResponse<T> {
  items: T[]
  total: number
  limit: number
  offset: number
}

export interface Recipe {
  id: string
  owner_id: string
  title: string
  description: string | null
  cuisine: string | null
  ingredients: string[]
  steps: string[]
  tags: string[]
  statuses: string[]
  created_at: string
  updated_at: string
}

export interface RecipeShare {
  id: string
  recipe_id: string
  shared_with_user_id: string
  permission: string
  created_at: string
}

export interface ParseRecipeResult {
  title: string
  ingredients: string[]
  steps: string[]
}

export interface RecipeSuggestionItem {
  title: string
  ingredients: string[]
  steps: string[]
}
