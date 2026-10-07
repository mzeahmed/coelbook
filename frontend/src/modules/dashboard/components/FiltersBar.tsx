import type { IncidentCategory, IncidentTag } from '../api'

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
  // tag is a tag slug ('' for no filter).
  tag: string
  onTagChange: (value: string) => void
  tagOptions: IncidentTag[]
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
          placeholder="Rechercher dans les coelbooks…"
          aria-label="Rechercher dans les coelbooks"
          className="form-control form-control-sm rounded-3"
          style={{ paddingLeft: '2rem' }}
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

      {/* A select rather than one chip per tag: a real knowledge base has
          dozens of tags, which would wrap over several rows. */}
      {tagOptions.length > 0 && (
        <select
          className="form-select form-select-sm rounded-3 w-auto"
          aria-label="Filtrer par tag"
          style={{ color: 'var(--pb-text-muted)' }}
          value={tag}
          onChange={(e) => onTagChange(e.target.value)}
        >
          <option value="">Tous les tags</option>
          {tagOptions.map((t) => (
            <option key={t.slug} value={t.slug}>
              {t.name} ({t.incident_count})
            </option>
          ))}
        </select>
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
