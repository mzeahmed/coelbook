import { useEffect, useMemo, useState } from 'react'

import { copyText } from '../lib/clipboard'
import { highlight } from '../lib/highlight'

type CopyState = 'idle' | 'copied' | 'failed'

const COPY_LABEL: Record<CopyState, string> = {
  idle: 'Copier',
  copied: 'Copié !',
  failed: 'Échec de la copie',
}

const COPY_ICON: Record<CopyState, string> = {
  idle: 'fa-regular fa-copy',
  copied: 'fa-solid fa-check',
  failed: 'fa-solid fa-xmark',
}

interface CodeBlockProps {
  // Omitted for code blocks inside Markdown, which have no title.
  title?: string
  language: string
  code: string
}

// CodeBlock renders a snippet with its title, language, syntax
// highlighting and a copy button.
export default function CodeBlock({ title, language, code }: CodeBlockProps) {
  const html = useMemo(() => highlight(code, language), [code, language])
  const [copy, setCopy] = useState<CopyState>('idle')

  // The "Copié !" / failure feedback reverts to the idle label after a
  // moment, so the button can be used again.
  useEffect(() => {
    if (copy === 'idle') return

    const timeout = setTimeout(() => setCopy('idle'), 2000)

    return () => clearTimeout(timeout)
  }, [copy])

  function handleCopy() {
    copyText(code)
      .then(() => setCopy('copied'))
      .catch(() => setCopy('failed'))
  }

  return (
    <div className="pb-code-block rounded-3 overflow-hidden">
      <div className="pb-code-header d-flex align-items-center justify-content-between gap-2 px-3 py-2">
        <span className="small fw-medium text-truncate">{title}</span>
        <div className="d-flex align-items-center gap-3 flex-shrink-0">
          {language && (
            <span className="font-mono" style={{ fontSize: '0.7rem', color: 'var(--pb-text-muted)' }}>
              {language}
            </span>
          )}
          <button
            type="button"
            className={`pb-copy-btn btn btn-sm d-flex align-items-center gap-1 py-0 px-2 ${copy === 'copied' ? 'is-copied' : ''}`}
            onClick={handleCopy}
            aria-live="polite"
          >
            <i className={COPY_ICON[copy]} style={{ fontSize: '0.7rem' }}></i>
            <span style={{ fontSize: '0.7rem' }}>{COPY_LABEL[copy]}</span>
          </button>
        </div>
      </div>
      <pre className="pb-code font-mono p-3 mb-0">
        {html !== null ? (
          <code className="hljs" dangerouslySetInnerHTML={{ __html: html }} />
        ) : (
          <code>{code}</code>
        )}
      </pre>
    </div>
  )
}
