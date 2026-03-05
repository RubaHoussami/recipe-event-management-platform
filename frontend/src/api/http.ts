/** In production, set VITE_API_PROXY_TARGET (or VITE_API_URL) in the build (e.g. from GitHub Secrets). In dev, use relative /api (Vite proxy). */
export const API_BASE = (import.meta.env.VITE_API_URL ?? import.meta.env.VITE_API_PROXY_TARGET) ?? '/api'

export type ApiError = { status?: number; detail: unknown }

function onUnauthorized(): void {
  try {
    localStorage.removeItem('access_token')
  } catch {
    // ignore
  }
  window.location.replace('/')
}

export function getAuthHeader(): string | undefined {
  const token = localStorage.getItem('access_token')
  return token ? `Bearer ${token}` : undefined
}

export async function apiRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const url = path.startsWith('http') ? path : `${API_BASE}${path}`
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  }
  const auth = getAuthHeader()
  if (auth) headers['Authorization'] = auth

  const res = await fetch(url, { ...options, headers })
  const text = await res.text()
  let data: unknown = null
  if (text) {
    try {
      data = JSON.parse(text)
    } catch {
      // non-JSON
    }
  }

  if (res.status === 401) {
    onUnauthorized()
    throw { status: 401, detail: (typeof data === 'object' && data !== null && 'detail' in data) ? (data as { detail: unknown }).detail : 'Unauthorized' }
  }
  if (!res.ok) {
    const err = typeof data === 'object' && data !== null && 'detail' in data
      ? (data as { detail: unknown })
      : { detail: text || res.statusText }
    throw { status: res.status, ...err }
  }

  return (data ?? {}) as T
}

export function getToken(): string | null {
  return localStorage.getItem('access_token')
}

export function setToken(token: string): void {
  localStorage.setItem('access_token', token)
}

export function clearToken(): void {
  localStorage.removeItem('access_token')
}
