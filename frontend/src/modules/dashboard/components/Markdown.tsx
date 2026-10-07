import { useMemo, type ReactElement, type ReactNode } from 'react'
import ReactMarkdown, { type Components } from 'react-markdown'
import remarkBreaks from 'remark-breaks'
import remarkGfm from 'remark-gfm'

import { remarkHeadingIds } from '../lib/headings'
import CodeBlock from './CodeBlock'

// Link schemes allowed in Markdown. Anything else (javascript:, data:…) is
// dropped, leaving the link text; "#anchor" links are kept too.
const ALLOWED_SCHEMES = ['http:', 'https:', 'mailto:']

function safeUrl(url: string): string {
  if (url.startsWith('#')) return url

  try {
    return ALLOWED_SCHEMES.includes(new URL(url).protocol) ? url : ''
  } catch {
    // Relative URLs ("docs/setup") don't point anywhere useful from an
    // incident page, so they're dropped like unsafe ones.
    return ''
  }
}

// textOf flattens the children react-markdown gives a code element into
// the raw code string.
function textOf(node: ReactNode): string {
  if (typeof node === 'string') return node
  if (Array.isArray(node)) return node.map(textOf).join('')

  return ''
}

const components: Components = {
  a: ({ href, children }) =>
    href ? (
      <a href={href} target="_blank" rel="noopener noreferrer">
        {children}
      </a>
    ) : (
      <>{children}</>
    ),

  // Images would load from arbitrary hosts (tracking, broken layouts);
  // until attachments exist they're shown as a link to the image.
  img: ({ src, alt }) => {
    const href = typeof src === 'string' ? safeUrl(src) : ''
    const label = alt || 'image'

    return href ? (
      <a href={href} target="_blank" rel="noopener noreferrer">
        [{label}]
      </a>
    ) : (
      <>[{label}]</>
    )
  },

  // Fenced code blocks get the same highlighting and copy button as
  // snippets; the language comes from the fence (```bash).
  pre: ({ children }) => {
    const code = children as ReactElement<{ className?: string; children?: ReactNode }>
    const language = /language-([\w+-]+)/.exec(code.props.className ?? '')?.[1] ?? ''

    return (
      <div className="my-3">
        <CodeBlock language={language} code={textOf(code.props.children).replace(/\n$/, '')} />
      </div>
    )
  },

  table: ({ children }) => (
    <div className="table-responsive">
      <table className="table table-sm table-bordered">{children}</table>
    </div>
  ),
}

interface MarkdownProps {
  children: string
  // headingIdPrefix, when set, gives every heading an id (see
  // lib/headings.ts) so a table of contents can link to it.
  headingIdPrefix?: string
}

// Markdown renders user-written Markdown (GitHub flavor, single newlines
// kept as line breaks). Raw HTML in the source is ignored, never rendered,
// so the output can't inject markup or scripts.
export default function Markdown({ children, headingIdPrefix }: MarkdownProps) {
  const remarkPlugins = useMemo(
    () => (headingIdPrefix ? [remarkGfm, remarkBreaks, remarkHeadingIds(headingIdPrefix)] : [remarkGfm, remarkBreaks]),
    [headingIdPrefix],
  )

  return (
    <div className="pb-markdown">
      <ReactMarkdown
        remarkPlugins={remarkPlugins}
        skipHtml
        urlTransform={safeUrl}
        components={components}
      >
        {children}
      </ReactMarkdown>
    </div>
  )
}
