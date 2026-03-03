import { apiRequest, clearToken, setToken } from './http'

export interface TokenResponse {
  access_token: string
  token_type: string
}

export interface UserMe {
  id: string
  email: string
  name: string
  role: string
  created_at: string
  openai_configured: boolean
}

export async function register(email: string, name: string, password: string): Promise<TokenResponse> {
  await apiRequest('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ email, name, password }),
  })
  return login(email, password)
}

export async function login(email: string, password: string): Promise<TokenResponse> {
  const data = await apiRequest<TokenResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  })
  setToken(data.access_token)
  return data
}

export function logout(): void {
  clearToken()
}

export async function getMe(): Promise<UserMe> {
  return apiRequest<UserMe>('/auth/me')
}

export async function setOpenAIKey(openaiApiKey: string | null): Promise<void> {
  await apiRequest('/auth/me/ai-key', {
    method: 'PATCH',
    body: JSON.stringify({ openai_api_key: openaiApiKey }),
  })
}
