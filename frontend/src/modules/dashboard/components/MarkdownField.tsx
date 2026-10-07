import { useState } from 'react'

import Markdown from './Markdown'

interface MarkdownFieldProps {
  id: string
  value: string
  onChange: (value: string) => void
  invalid?: boolean
  rows?: number
}

// MarkdownField is a textarea with a "Écrire / Aperçu" toggle that renders
// the value exactly as the incident page will.
export default function MarkdownField({ id, value, onChange, invalid = false, rows = 5 }: MarkdownFieldProps) {
  const [preview, setPreview] = useState(false)

  return (
    <div>
      <div className="d-flex gap-1 mb-2" role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={!preview}
          aria-controls={id}
          className={`btn btn-sm py-0 px-2 ${!preview ? 'btn-secondary' : 'btn-outline-secondary border-0'}`}
          onClick={() => setPreview(false)}
        >
          Écrire
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={preview}
          className={`btn btn-sm py-0 px-2 ${preview ? 'btn-secondary' : 'btn-outline-secondary border-0'}`}
          onClick={() => setPreview(true)}
        >
          Aperçu
        </button>
      </div>

      {preview ? (
        <div className="border rounded-3 p-3 small" style={{ minHeight: `${rows * 1.5}rem` }}>
          {value.trim() ? (
            <Markdown>{value}</Markdown>
          ) : (
            <span style={{ color: 'var(--pb-text-muted)' }}>Rien à prévisualiser.</span>
          )}
        </div>
      ) : (
        <textarea
          id={id}
          className={`form-control ${invalid ? 'is-invalid' : ''}`}
          rows={rows}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      )}

      <div className="form-text small">
        Markdown pris en charge : <strong>**gras**</strong>, <code>`code`</code>, listes, liens, blocs <code>```bash</code>.
      </div>
    </div>
  )
}
