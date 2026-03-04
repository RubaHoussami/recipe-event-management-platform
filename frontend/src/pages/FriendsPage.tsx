import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { listFriends, addFriendByEmail, removeFriend, listPeople } from '../api/friends'
import type { Friend, Person } from '../api/friends'
import { useUserAvatarUrl } from '../hooks/useUserAvatarUrl'
import './FriendsPage.css'

function UserAvatar({ userId, name, className }: { userId: string; name: string; className?: string }) {
  const avatarUrl = useUserAvatarUrl(userId)
  if (avatarUrl) return <img src={avatarUrl} alt="" className={className} />
  return <span className={className ? `${className} friends-page__avatar--placeholder` : 'friends-page__avatar friends-page__avatar--placeholder'}>{name[0].toUpperCase()}</span>
}

export function FriendsPage() {
  const queryClient = useQueryClient()
  const [email, setEmail] = useState('')
  const [searchPeople, setSearchPeople] = useState('')

  const { data: friends, isLoading: friendsLoading } = useQuery({
    queryKey: ['friends'],
    queryFn: () => listFriends(),
  })
  const { data: people, isLoading: peopleLoading } = useQuery({
    queryKey: ['people', searchPeople],
    queryFn: () => listPeople({ q: searchPeople || undefined, limit: 20 }),
    enabled: true,
  })

  const addMutation = useMutation({
    mutationFn: (e: string) => addFriendByEmail(e),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['friends'] }),
  })
  const removeMutation = useMutation({
    mutationFn: (userId: string) => removeFriend(userId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['friends'] }),
  })

  const friendIds = new Set((friends ?? []).map((f) => f.friend_id))

  function handleAddFriend(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim()) return
    addMutation.mutate(email.trim(), {
      onSuccess: () => setEmail(''),
      onError: () => {},
    })
  }

  return (
    <div className="friends-page">
      <div className="page-header">
        <h1>Friends</h1>
      </div>

      <section className="card friends-page__section">
        <h2>Add friend by email</h2>
        <form onSubmit={handleAddFriend} className="friends-page__add-form">
          <input
            type="email"
            placeholder="Friend's email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <button type="submit" className="btn-primary" disabled={addMutation.isPending}>
            {addMutation.isPending ? 'Adding…' : 'Add friend'}
          </button>
        </form>
        {addMutation.isError && (
          <p className="friends-page__error">{(addMutation.error as { detail?: string })?.detail ?? 'Could not add friend.'}</p>
        )}
      </section>

      <section className="card friends-page__section">
        <h2>My friends</h2>
        {friendsLoading && <p>Loading…</p>}
        {friends != null && friends.length === 0 && <p className="friends-page__empty">No friends yet. Add someone by email above.</p>}
        {friends != null && friends.length > 0 && (
          <ul className="friends-page__list">
            {friends.map((f: Friend) => (
              <li key={f.friend_id} className="friends-page__item">
                <div className="friends-page__item-info">
                  <UserAvatar userId={f.friend_id} name={f.friend_name || f.friend_email} className="friends-page__avatar" />
                  <div>
                    <strong>{f.friend_name || f.friend_email}</strong>
                    {f.friend_name && <span className="friends-page__email">{f.friend_email}</span>}
                  </div>
                </div>
                <button type="button" className="btn-delete" onClick={() => removeMutation.mutate(f.friend_id)} disabled={removeMutation.isPending}>
                  Remove
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="card friends-page__section">
        <h2>People</h2>
        <p className="friends-page__hint">Search and add people you know.</p>
        <input
          type="search"
          placeholder="Search by name or email…"
          value={searchPeople}
          onChange={(e) => setSearchPeople(e.target.value)}
          className="friends-page__search"
        />
        {peopleLoading && <p>Loading…</p>}
        {people != null && people.length === 0 && <p className="friends-page__empty">No results.</p>}
        {people != null && people.length > 0 && (
          <ul className="friends-page__list">
            {people.map((p: Person) => (
              <li key={p.id} className="friends-page__item">
                <div className="friends-page__item-info">
                  <UserAvatar userId={p.id} name={p.name || p.email} className="friends-page__avatar" />
                  <div>
                    <strong>{p.name || p.email}</strong>
                    {p.name && <span className="friends-page__email">{p.email}</span>}
                  </div>
                </div>
                {friendIds.has(p.id) ? (
                  <span className="friends-page__badge">Friend</span>
                ) : (
                  <button type="button" className="btn-primary" onClick={() => addMutation.mutate(p.email)} disabled={addMutation.isPending}>
                    Add
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
