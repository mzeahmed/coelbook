import type { IncidentSnippetInput } from '../api'
import { fieldInputId, messageFor, moveRow, withKey, type FieldError, type Row } from '../lib/fields'
import RowActions from './RowActions'

// Suggestions only: any language name is accepted.
const LANGUAGES = ['bash', 'shell', 'sql', 'yaml', 'json', 'go', 'javascript', 'typescript', 'python', 'php', 'dockerfile', 'nginx', 'text']

interface SnippetsFieldProps {
  rows: Row<IncidentSnippetInput>[]
  onChange: (rows: Row<IncidentSnippetInput>[]) => void
  error: FieldError | null
}

export default function SnippetsField({ rows, onChange, error }: SnippetsFieldProps) {
  function patch(index: number, value: Partial<IncidentSnippetInput>) {
    onChange(rows.map((r, i) => (i === index ? { ...r, ...value } : r)))
  }

  const listError = messageFor(error, 'snippets')

  return (
    <section id={`${fieldInputId('snippets')}-section`} className="pb-card border rounded-4 p-4">
      <div className="d-flex align-items-center justify-content-between mb-1">
        <h2 className="form-label fw-semibold mb-0 fs-6">Snippets</h2>
        <button
          type="button"
          className="btn btn-sm btn-outline-secondary fw-medium d-flex align-items-center gap-2"
          onClick={() => onChange([...rows, withKey({ title: '', language: '', content: '' })])}
        >
          <i className="fa-solid fa-plus" style={{ fontSize: '0.7rem' }}></i> Ajouter un snippet
        </button>
      </div>
      <div className="small mb-3" style={{ color: 'var(--pb-text-muted)' }}>
        Commandes ou extraits de code réutilisables.
      </div>

      {listError && <div className="invalid-feedback d-block small mb-3">{listError}</div>}

      {rows.length === 0 && (
        <div className="small" style={{ color: 'var(--pb-text-muted)' }}>
          Aucun snippet.
        </div>
      )}

      <datalist id="snippet-languages">
        {LANGUAGES.map((l) => (
          <option key={l} value={l} />
        ))}
      </datalist>

      <div className="d-flex flex-column gap-3">
        {rows.map((row, i) => {
          const titleField = `snippets[${i}].title`
          const contentField = `snippets[${i}].content`
          const titleError = messageFor(error, titleField)
          const contentError = messageFor(error, contentField)

          return (
            <div key={row.key} className="border rounded-3 p-3">
              <div className="d-flex gap-2 align-items-start mb-2">
                <div className="flex-grow-1">
                  <input
                    id={fieldInputId(titleField)}
                    className={`form-control form-control-sm ${titleError ? 'is-invalid' : ''}`}
                    placeholder="Titre"
                    aria-label={`Titre du snippet ${i + 1}`}
                    value={row.title}
                    onChange={(e) => patch(i, { title: e.target.value })}
                  />
                  {titleError && <div className="invalid-feedback d-block small">{titleError}</div>}
                </div>
                <input
                  className="form-control form-control-sm font-mono"
                  style={{ width: '9rem' }}
                  placeholder="Langage"
                  aria-label={`Langage du snippet ${i + 1}`}
                  list="snippet-languages"
                  value={row.language}
                  onChange={(e) => patch(i, { language: e.target.value })}
                />
                <RowActions
                  label={`le snippet ${i + 1}`}
                  isFirst={i === 0}
                  isLast={i === rows.length - 1}
                  onMoveUp={() => onChange(moveRow(rows, i, i - 1))}
                  onMoveDown={() => onChange(moveRow(rows, i, i + 1))}
                  onRemove={() => onChange(rows.filter((_, j) => j !== i))}
                />
              </div>
              <textarea
                id={fieldInputId(contentField)}
                className={`form-control form-control-sm font-mono ${contentError ? 'is-invalid' : ''}`}
                rows={4}
                spellCheck={false}
                placeholder="Contenu"
                aria-label={`Contenu du snippet ${i + 1}`}
                value={row.content}
                onChange={(e) => patch(i, { content: e.target.value })}
              />
              {contentError && <div className="invalid-feedback d-block small">{contentError}</div>}
            </div>
          )
        })}
      </div>
    </section>
  )
}
