import type { IncidentLinkInput } from '../api'
import { fieldInputId, messageFor, moveRow, withKey, type FieldError, type Row } from '../lib/fields'
import RowActions from './RowActions'

interface LinksFieldProps {
  rows: Row<IncidentLinkInput>[]
  onChange: (rows: Row<IncidentLinkInput>[]) => void
  error: FieldError | null
}

export default function LinksField({ rows, onChange, error }: LinksFieldProps) {
  function patch(index: number, value: Partial<IncidentLinkInput>) {
    onChange(rows.map((r, i) => (i === index ? { ...r, ...value } : r)))
  }

  const listError = messageFor(error, 'links')

  return (
    <section id={`${fieldInputId('links')}-section`} className="pb-card border rounded-4 p-4">
      <div className="d-flex align-items-center justify-content-between mb-1">
        <h2 className="form-label fw-semibold mb-0 fs-6">Liens</h2>
        <button
          type="button"
          className="btn btn-sm btn-outline-secondary fw-medium d-flex align-items-center gap-2"
          onClick={() => onChange([...rows, withKey({ title: '', url: '' })])}
        >
          <i className="fa-solid fa-plus" style={{ fontSize: '0.7rem' }}></i> Ajouter un lien
        </button>
      </div>
      <div className="small mb-3" style={{ color: 'var(--pb-text-muted)' }}>
        Documentation, tickets ou articles utiles. Sans titre, l&apos;URL est affichée.
      </div>

      {listError && <div className="invalid-feedback d-block small mb-3">{listError}</div>}

      {rows.length === 0 && (
        <div className="small" style={{ color: 'var(--pb-text-muted)' }}>
          Aucun lien.
        </div>
      )}

      <div className="d-flex flex-column gap-2">
        {rows.map((row, i) => {
          const urlField = `links[${i}].url`
          const urlError = messageFor(error, urlField)

          return (
            <div key={row.key}>
              <div className="d-flex gap-2 align-items-start">
                <input
                  className="form-control form-control-sm"
                  style={{ maxWidth: '14rem' }}
                  placeholder="Titre (facultatif)"
                  aria-label={`Titre du lien ${i + 1}`}
                  value={row.title}
                  onChange={(e) => patch(i, { title: e.target.value })}
                />
                <div className="flex-grow-1">
                  <input
                    id={fieldInputId(urlField)}
                    className={`form-control form-control-sm ${urlError ? 'is-invalid' : ''}`}
                    placeholder="https://…"
                    aria-label={`URL du lien ${i + 1}`}
                    inputMode="url"
                    value={row.url}
                    onChange={(e) => patch(i, { url: e.target.value })}
                  />
                  {urlError && <div className="invalid-feedback d-block small">{urlError}</div>}
                </div>
                <RowActions
                  label={`le lien ${i + 1}`}
                  isFirst={i === 0}
                  isLast={i === rows.length - 1}
                  onMoveUp={() => onChange(moveRow(rows, i, i - 1))}
                  onMoveDown={() => onChange(moveRow(rows, i, i + 1))}
                  onRemove={() => onChange(rows.filter((_, j) => j !== i))}
                />
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}
