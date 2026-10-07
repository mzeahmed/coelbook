export interface TocEntry {
  id: string
  label: string
  // 0 for an incident section, 1–2 for Markdown headings inside it.
  level: 0 | 1 | 2
}

interface TableOfContentsProps {
  entries: TocEntry[]
  activeId: string
}

// TableOfContents lists anchor links to the incident's sections and their
// Markdown headings; activeId (the part being read) is highlighted.
export default function TableOfContents({ entries, activeId }: TableOfContentsProps) {
  return (
    <ol className="pb-toc list-unstyled mb-0 small">
      {entries.map((entry) => (
        <li key={entry.id}>
          <a
            href={`#${entry.id}`}
            className={`pb-toc-link pb-toc-level-${entry.level} ${entry.id === activeId ? 'is-active' : ''}`}
            aria-current={entry.id === activeId ? 'location' : undefined}
          >
            {entry.label}
          </a>
        </li>
      ))}
    </ol>
  )
}
