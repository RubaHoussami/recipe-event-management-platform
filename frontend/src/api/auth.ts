import { apiRequest, clearToken, setToken, API_BASE, getAuthHeader } from './http'

export interface TokenResponse {
  access_token: string
  token_type: string
}

export type AiPreference = 'off' | 'my_key' | 'hosted'

export interface UserMe {
  id: string
  email: string
  name: string
  role: string
  created_at: string
  openai_configured: boolean
  has_avatar: boolean
  email_verified: boolean
  ai_preference: AiPreference
  azure_ai_available: boolean
}

export interface RegisterResponse {
  id: string
  email: string
  name: string
  role: string
  message?: string
}

export async function register(email: string, name: string, password: string): Promise<RegisterResponse> {
  return apiRequest<RegisterResponse>('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ email, name, password }),
  })
}

export async function verifyEmail(email: string, code: string): Promise<TokenResponse> {
  const data = await apiRequest<TokenResponse>('/auth/verify-email', {
    method: 'POST',
    body: JSON.stringify({ email, code }),
  })
  setToken(data.access_token)
  return data
}

export async function resendOtp(email: string): Promise<void> {
  await apiRequest('/auth/resend-otp', {
    method: 'POST',
    body: JSON.stringify({ email }),
  })
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

export async function setAiPreference(aiPreference: AiPreference): Promise<void> {
  await apiRequest('/auth/me/ai-preference', {
    method: 'PATCH',
    body: JSON.stringify({ ai_preference: aiPreference }),
  })
}

export interface MeUpdate {
  name?: string
}

export async function updateMe(body: MeUpdate): Promise<void> {
  await apiRequest('/auth/me', {
    method: 'PATCH',
    body: JSON.stringify(body),
  })
}

/** Fetch current user's avatar as Blob. Returns null if no avatar or error. */
export async function fetchMeAvatarBlob(): Promise<Blob | null> {
  const url = `${API_BASE}/auth/me/avatar`
  const auth = getAuthHeader()
  const res = await fetch(url, { headers: auth ? { Authorization: auth } : {} })
  if (!res.ok) return null
  return res.blob()
}

/** Upload avatar image (JPEG, PNG, or WebP; max 2MB). */
export async function uploadAvatar(file: File): Promise<void> {
  const url = `${API_BASE}/auth/me/avatar`
  const auth = getAuthHeader()
  if (!auth) throw new Error('Not authenticated')
  const form = new FormData()
  form.append('file', file)
  const res = await fetch(url, {
    method: 'POST',
    headers: { Authorization: auth },
    body: form,
  })
  if (res.status === 401) {
    try {
      localStorage.removeItem('access_token')
    } catch {}
    window.location.replace('/')
    throw new Error('Unauthorized')
  }
  if (!res.ok) {
    const text = await res.text()
    let detail = text
    try {
      const j = JSON.parse(text)
      if (typeof j?.detail === 'string') detail = j.detail
    } catch {}
    throw { status: res.status, detail }
  }
}

/** Remove uploaded avatar. */
export async function deleteAvatar(): Promise<void> {
  await apiRequest('/auth/me/avatar', { method: 'DELETE' })
}
