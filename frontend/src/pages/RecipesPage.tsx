import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { listRecipes } from '../api/recipes'
import type { Recipe } from '../api/recipes'
import './RecipesPage.css'

export function RecipesPage() {
  const [q, setQ] = useState('')
  const [search, setSearch] = useState('')
  const { data, isLoading, error } = useQuery({
    queryKey: ['recipes', { q: search, limit: 20, offset: 0 }],
    queryFn: () => listRecipes({ q: search || undefined, limit: 20, offset: 0 }),
  })

  return (
    <div className="recipes-page">
      <div className="page-header">
        <h1>Recipes</h1>
        <div className="recipes-page__header-actions">
          <Link to="/dashboard/recipes/new" className="btn-primary recipes-page__new">New recipe</Link>
          <Link to="/dashboard/recipes/new/parse" className="btn-secondary">Parse recipe</Link>
        </div>
      </div>
      <div className="recipes-page__toolbar">
        <input
          type="search"
          placeholder="Search recipes…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && setSearch(q)}
        />
        <button type="button" className="btn-primary" onClick={() => setSearch(q)}>Search</button>
      </div>
      {isLoading && <p className="recipes-page__loading">Loading…</p>}
      {error && <p className="recipes-page__error">Failed to load recipes.</p>}
      {data && (
        <ul className="recipes-page__list">
          {data.items.length === 0 && (
            <li className="recipes-page__empty">No recipes yet. <Link to="/dashboard/recipes/new">Create one</Link> to get started.</li>
          )}
          {data.items.map((r: Recipe) => (
            <li key={r.id} className="recipes-page__item">
              <Link to={'/dashboard/recipes/' + r.id} className="recipes-page__item-link">
                <span className="recipes-page__item-title">{r.title}</span>
                {r.cuisine && <span className="recipes-page__item-meta">{r.cuisine}</span>}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
