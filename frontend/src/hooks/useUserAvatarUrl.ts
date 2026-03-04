import { useEffect, useState } from 'react'
import { fetchUserAvatarBlob } from '../api/users'

/** Returns an object URL for a user's avatar by id. Fetches with auth; revokes on cleanup. Returns null if no avatar or error. */
export function useUserAvatarUrl(userId: string | null): string | null {
  const [url, setUrl] = useState<string | null>(null)

  useEffect(() => {
    if (!userId) {
      setUrl(null)
      return
    }
    let revoked = false
    fetchUserAvatarBlob(userId)
      .then((blob) => {
        if (revoked || !blob) return
        setUrl(URL.createObjectURL(blob))
      })
      .catch(() => setUrl(null))
    return () => {
      revoked = true
      setUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev)
        return null
      })
    }
  }, [userId])

  return url
}
