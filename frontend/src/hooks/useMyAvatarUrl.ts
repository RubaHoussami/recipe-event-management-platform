import { useEffect, useState } from 'react'
import { fetchMeAvatarBlob } from '../api/auth'
import type { UserMe } from '../api/auth'

/** Returns an object URL for the current user's avatar when has_avatar is true. Revokes on cleanup. */
export function useMyAvatarUrl(user: UserMe | null): string | null {
  const [url, setUrl] = useState<string | null>(null)

  useEffect(() => {
    if (!user?.has_avatar) {
      setUrl(null)
      return
    }
    let revoked = false
    fetchMeAvatarBlob()
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
  }, [user?.has_avatar])

  return url
}
