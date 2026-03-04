import { API_BASE, getAuthHeader } from './http'

/** Fetch another user's avatar as Blob. Returns null if no avatar or error (e.g. 404). */
export async function fetchUserAvatarBlob(userId: string): Promise<Blob | null> {
  const url = `${API_BASE}/users/${encodeURIComponent(userId)}/avatar`
  const auth = getAuthHeader()
  const res = await fetch(url, { headers: auth ? { Authorization: auth } : {} })
  if (!res.ok) return null
  return res.blob()
}
