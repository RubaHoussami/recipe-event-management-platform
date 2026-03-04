import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { listRecipes, RECIPE_STATUSES } from '../api/recipes'
import type { Recipe } from '../api/recipes'
import './RecipesPage.css'

const STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: '', label: 'Any status' },
  ...RECIPE_STATUSES.map((s) => ({ value: s, label: s === 'favorite' ? 'Favorite' : s === 'to_try' ? 'To try' : 'Made before' })),
]

export function RecipesPage() {
  const [q, setQ] = useState('')
  const [search, setSearch] = useState('')
  const [filterTag, setFilterTag] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const { data, isLoading, error } = useQuery({
    queryKey: ['recipes', { q: search, tag: filterTag || undefined, status: filterStatus || undefined, limit: 20, offset: 0 }],
    queryFn: () => listRecipes({
      q: search || undefined,
      tag: filterTag.trim() || undefined,
      status: filterStatus || undefined,
      limit: 20,
      offset: 0,
    }),
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
          placeholder="Search title, description…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && setSearch(q)}
        />
        <button type="button" className="btn-primary" onClick={() => setSearch(q)}>Search</button>
      </div>
      <div className="recipes-page__filters">
        <label className="recipes-page__filter">
          <span className="recipes-page__filter-label">Tag</span>
          <input
            type="text"
            placeholder="Filter by tag"
            value={filterTag}
            onChange={(e) => setFilterTag(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && setSearch(q)}
          />
        </label>
        <label className="recipes-page__filter">
          <span className="recipes-page__filter-label">Status</span>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            aria-label="Filter by status"
          >
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value || 'any'} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </label>
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
