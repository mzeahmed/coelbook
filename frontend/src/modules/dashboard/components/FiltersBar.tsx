import type { IncidentCategory } from '../api'

const STATUS_OPTIONS = [
  { value: 'published', label: 'Publié' },
  { value: 'draft', label: 'Brouillon' },
  { value: 'archived', label: 'Archivé' },
]

interface FiltersBarProps {
  search: string
  onSearchChange: (value: string) => void
  category: string
  onCategoryChange: (value: string) => void
  categoryOptions: IncidentCategory[]
  status: string
  onStatusChange: (value: string) => void
  tag: string
  onTagChange: (value: string) => void
  tagOptions: string[]
  onClear: () => void
}

export default function FiltersBar({
  search,
  onSearchChange,
  category,
  onCategoryChange,
  categoryOptions,
  status,
  onStatusChange,
  tag,
  onTagChange,
  tagOptions,
  onClear,
}: FiltersBarProps) {
  const hasActiveFilters = Boolean(search || category || status || tag)

  return (
    <div className="d-flex flex-wrap align-items-center gap-3 mb-4">
      <div className="position-relative" style={{ flex: '1 1 200px', maxWidth: '20rem' }}>
        <i
          className="fa-solid fa-magnifying-glass position-absolute top-50 translate-middle-y"
          style={{ left: '0.75rem', fontSize: '0.7rem', color: 'var(--pb-text-muted)' }}
        ></i>
        <input
          type="text"
          placeholder="Filtrer par mot-clé…"
          aria-label="Filtrer par mot-clé"
          className="form-control form-control-sm rounded-3 ps-4"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>

      <select
        className="form-select form-select-sm rounded-3 w-auto"
        aria-label="Filtrer par catégorie"
        style={{ color: 'var(--pb-text-muted)' }}
        value={category}
        onChange={(e) => onCategoryChange(e.target.value)}
      >
        <option value="">Toutes les catégories</option>
        {categoryOptions.map((c) => (
          <option key={c.slug} value={c.slug}>
            {c.name}
          </option>
        ))}
      </select>

      <select
        className="form-select form-select-sm rounded-3 w-auto"
        aria-label="Filtrer par statut"
        style={{ color: 'var(--pb-text-muted)' }}
        value={status}
        onChange={(e) => onStatusChange(e.target.value)}
      >
        <option value="">Tous les statuts</option>
        {STATUS_OPTIONS.map((s) => (
          <option key={s.value} value={s.value}>
            {s.label}
          </option>
        ))}
      </select>

      {tagOptions.length > 0 && (
        <div className="d-flex align-items-center gap-2 flex-wrap">
          {tagOptions.map((t) => (
            <button
              key={t}
              type="button"
              className={`tag-pill d-inline-flex align-items-center gap-1 px-2 py-1 rounded-2 small fw-medium border-0 ${
                tag === t ? 'filter-active pb-surface' : ''
              }`}
              onClick={() => onTagChange(tag === t ? '' : t)}
            >
              <i className="fa-solid fa-tag" style={{ fontSize: '0.55rem' }}></i> {t}
              {tag === t && <i className="fa-solid fa-xmark ms-1" style={{ fontSize: '0.55rem', opacity: 0.7 }}></i>}
            </button>
          ))}
        </div>
      )}

      {hasActiveFilters && (
        <button
          type="button"
          className="btn btn-sm ms-auto d-flex align-items-center gap-1"
          style={{ color: 'var(--pb-text-muted)' }}
          onClick={onClear}
        >
          <i className="fa-solid fa-xmark" style={{ fontSize: '0.625rem' }}></i> Effacer les filtres
        </button>
      )}
    </div>
  )
}
