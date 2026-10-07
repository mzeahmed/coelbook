import { useEffect, useId, useRef, useState, type KeyboardEvent } from 'react'
import { useNavigate } from 'react-router-dom'

import { ApiError } from '@/http/client'
import { errorMessage } from '@/http/errors'
import { listIncidents, type IncidentSummary } from '../api'
import { categoryBadgeClass, STATUS_LABEL } from '../lib/format'
import { slugify } from '../lib/slug'
import Highlighted from './Highlighted'

const MAX_INCIDENTS = 8
const SEARCH_DEBOUNCE_MS = 150

// Pages and actions the palette can jump to. Matched on their label and
// keywords, accent- and case-insensitively.
const ACTIONS: { label: string; to: string; icon: string; keywords: string }[] = [
  { label: 'Nouveau coelbook', to: '/incidents/new', icon: 'fa-plus', keywords: 'creer ajouter incident' },
  { label: 'Tableau de bord', to: '/overview', icon: 'fa-layer-group', keywords: 'accueil statistiques overview' },
  { label: 'Coelbooks', to: '/dashboard', icon: 'fa-file-code', keywords: 'liste incidents tous' },
  { label: 'Catégories', to: '/categories', icon: 'fa-folder-tree', keywords: 'gerer categories' },
  { label: 'Aide', to: '/help', icon: 'fa-circle-question', keywords: 'aide markdown recherche syntaxe' },
]

type Item =
  | { kind: 'action'; key: string; label: string; to: string; icon: string }
  | { kind: 'incident'; key: string; to: string; incident: IncidentSummary }

// matches compares the way users type: accents, case and punctuation are
// ignored ("categ" finds "Catégories").
function matches(query: string, text: string): boolean {
  return slugify(text).includes(slugify(query))
}

interface CommandPaletteProps {
  onClose: () => void
}

// CommandPalette is a quick-search dialog: it lists the matching actions and
// incidents (full-text search, most relevant first; the most recent ones
// when nothing is typed) and opens the selected one. Keyboard: ↑/↓ to move,
// Enter to open, Escape to close.
export default function CommandPalette({ onClose }: CommandPaletteProps) {
  const navigate = useNavigate()
  const listId = useId()
  const listRef = useRef<HTMLUListElement>(null)

  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState(0)
  // Incidents are tagged with the query they answer, so a slow response to
  // an older query is never shown, and "searching" is derived from it.
  const [result, setResult] = useState<{ query: string; incidents: IncidentSummary[]; error: string } | null>(null)

  const trimmed = query.trim()

  useEffect(() => {
    let cancelled = false

    const timeout = setTimeout(
      () => {
        listIncidents({ q: trimmed, perPage: MAX_INCIDENTS })
          .then((res) => {
            if (!cancelled) setResult({ query: trimmed, incidents: res.incidents, error: '' })
          })
          .catch((err: unknown) => {
            if (cancelled) return

            if (err instanceof ApiError && err.code === 401) {
              onClose()
              navigate('/login')

              return
            }

            setResult({ query: trimmed, incidents: [], error: errorMessage(err) })
          })
      },
      // The recent incidents shown on open don't need to wait.
      trimmed ? SEARCH_DEBOUNCE_MS : 0,
    )

    return () => {
      cancelled = true
      clearTimeout(timeout)
    }
  }, [trimmed, navigate, onClose])

  const searching = result?.query !== trimmed
  const incidents = searching ? [] : result.incidents
  const error = searching ? '' : result.error

  const actions = trimmed ? ACTIONS.filter((a) => matches(trimmed, `${a.label} ${a.keywords}`)) : ACTIONS
  const items: Item[] = [
    ...actions.map((a) => ({ kind: 'action' as const, key: `action:${a.to}`, label: a.label, to: a.to, icon: a.icon })),
    ...incidents.map((incident) => ({
      kind: 'incident' as const,
      key: `incident:${incident.slug}`,
      to: `/incidents/${incident.slug}`,
      incident,
    })),
  ]

  // The list changes under the selection while typing; keep it in range.
  const active = Math.min(selected, Math.max(items.length - 1, 0))
  const activeItem = items[active]

  useEffect(() => {
    listRef.current?.querySelector('[aria-selected="true"]')?.scrollIntoView({ block: 'nearest' })
  }, [active, items.length])

  function open(item: Item | undefined) {
    if (!item) return

    onClose()
    navigate(item.to)
  }

  function onKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelected(items.length ? (active + 1) % items.length : 0)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelected(items.length ? (active - 1 + items.length) % items.length : 0)
    } else if (e.key === 'Enter') {
      e.preventDefault()
      open(activeItem)
    } else if (e.key === 'Escape') {
      e.preventDefault()
      onClose()
    }
  }

  const optionId = (item: Item) => `${listId}-${item.key}`

  return (
    <>
      <div className="pb-palette-backdrop" onClick={onClose}></div>

      <div className="pb-palette pb-card border rounded-4" role="dialog" aria-modal="true" aria-label="Recherche rapide">
        <div className="d-flex align-items-center gap-2 px-3 border-bottom">
          <i className="fa-solid fa-magnifying-glass" style={{ fontSize: '0.8rem', color: 'var(--pb-text-muted)' }}></i>
          <input
            className="form-control border-0 shadow-none px-1 py-3"
            placeholder="Rechercher un coelbook ou une page…"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              setSelected(0)
            }}
            onKeyDown={onKeyDown}
            autoFocus
            role="combobox"
            aria-expanded="true"
            aria-controls={listId}
            aria-activedescendant={activeItem ? optionId(activeItem) : undefined}
            aria-autocomplete="list"
          />
          {searching && trimmed && (
            <span className="spinner-border spinner-border-sm flex-shrink-0" role="status" aria-label="Recherche en cours"></span>
          )}
        </div>

        <ul ref={listRef} id={listId} role="listbox" aria-label="Résultats" className="list-unstyled mb-0 p-2 pb-palette-list">
          {items.map((item, i) => {
            const isActive = i === active
            const isFirstIncident = item.kind === 'incident' && (i === 0 || items[i - 1]?.kind === 'action')

            return (
              <li key={item.key} role="presentation">
                {i === 0 && item.kind === 'action' && <div className="pb-palette-group">Pages</div>}
                {isFirstIncident && <div className="pb-palette-group">{trimmed ? 'Coelbooks' : 'Coelbooks récents'}</div>}

                <div
                  id={optionId(item)}
                  role="option"
                  aria-selected={isActive}
                  className={`pb-palette-item d-flex align-items-center gap-3 rounded-3 px-3 py-2 ${isActive ? 'is-active' : ''}`}
                  onMouseMove={() => setSelected(i)}
                  onClick={() => open(item)}
                >
                  {item.kind === 'action' ? (
                    <>
                      <i className={`fa-solid ${item.icon} text-center`} style={{ width: '1rem', color: 'var(--pb-text-muted)' }}></i>
                      <span className="small fw-medium">{item.label}</span>
                    </>
                  ) : (
                    <>
                      <i className="fa-regular fa-file-lines text-center" style={{ width: '1rem', color: 'var(--pb-text-muted)' }}></i>
                      <div className="flex-grow-1 min-w-0">
                        <div className="small fw-medium text-truncate">
                          <Highlighted text={item.incident.highlight?.title ?? item.incident.title} />
                        </div>
                        {item.incident.summary && (
                          <div className="text-truncate" style={{ fontSize: '0.75rem', color: 'var(--pb-text-muted)' }}>
                            <Highlighted text={item.incident.highlight?.summary ?? item.incident.summary} />
                          </div>
                        )}
                      </div>
                      <span className={`badge-soft ${categoryBadgeClass(item.incident.category.slug)} flex-shrink-0`}>
                        {item.incident.category.name}
                      </span>
                      <span className="flex-shrink-0 d-none d-sm-inline" style={{ fontSize: '0.7rem', color: 'var(--pb-text-muted)' }}>
                        {STATUS_LABEL[item.incident.status]}
                      </span>
                    </>
                  )}
                </div>
              </li>
            )
          })}

          {items.length === 0 && !searching && !error && (
            <li role="presentation" className="small text-center py-4" style={{ color: 'var(--pb-text-muted)' }}>
              Aucun résultat pour « {trimmed} ».
            </li>
          )}

          {error && (
            <li role="presentation" className="badge-danger-soft rounded-3 small m-2 py-2 px-3">
              {error}
            </li>
          )}
        </ul>

        <div className="pb-palette-footer d-flex align-items-center gap-3 px-3 py-2 border-top">
          <span><kbd>↑</kbd> <kbd>↓</kbd> naviguer</span>
          <span><kbd>Entrée</kbd> ouvrir</span>
          <span><kbd>Échap</kbd> fermer</span>
        </div>
      </div>
    </>
  )
}
