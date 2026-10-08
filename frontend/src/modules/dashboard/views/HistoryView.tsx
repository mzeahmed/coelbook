import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'

import { ApiError } from '@/http/client'
import { errorMessage } from '@/http/errors'
import { clearSession } from '@/modules/auth/session'
import {
  getIncidentVersion,
  listIncidentVersions,
  type IncidentSnapshot,
  type IncidentVersion,
  type IncidentVersionSummary,
  type SnapshotField,
} from '../api'
import AppLayout from '../components/AppLayout'
import { diffLines } from '../lib/diff'
import { STATUS_LABEL, timeAgo } from '../lib/format'

// Fields in the order an incident reads, with their French labels.
const FIELDS: { key: SnapshotField; label: string }[] = [
  { key: 'title', label: 'Titre' },
  { key: 'status', label: 'Statut' },
  { key: 'category', label: 'Catégorie' },
  { key: 'tags', label: 'Tags' },
  { key: 'summary', label: 'Résumé' },
  { key: 'problem', label: 'Problème' },
  { key: 'diagnosis', label: 'Diagnostic' },
  { key: 'root_cause', label: 'Cause racine' },
  { key: 'solution', label: 'Solution' },
  { key: 'prevention', label: 'Prévention' },
  { key: 'snippets', label: 'Snippets' },
  { key: 'links', label: 'Liens' },
]

const longDate = new Intl.DateTimeFormat('fr-FR', { dateStyle: 'long', timeStyle: 'short' })

// changedLabels lists changed fields in reading order (the API sorts them
// alphabetically).
function changedLabels(fields: SnapshotField[]): string {
  return FIELDS.filter((f) => fields.includes(f.key))
    .map((f) => f.label)
    .join(', ')
}

function authorName(v: IncidentVersionSummary): string {
  return v.author ? `${v.author.first_name} ${v.author.last_name}` : 'Utilisateur supprimé'
}

// asText turns a field into lines, so lists (snippets, links) can be
// compared with the same line diff as the Markdown sections.
function asText(snapshot: IncidentSnapshot, key: SnapshotField): string {
  switch (key) {
    case 'status':
      return STATUS_LABEL[snapshot.status]
    case 'category':
      return snapshot.category.name
    case 'tags':
      return snapshot.tags.join('\n')
    case 'snippets':
      return snapshot.snippets.map((s) => `▸ ${s.title} (${s.language})\n${s.content}`).join('\n\n')
    case 'links':
      return snapshot.links.map((l) => (l.title === l.url ? l.url : `${l.title} — ${l.url}`)).join('\n')
    default:
      return snapshot[key]
  }
}

export default function HistoryView() {
  const navigate = useNavigate()
  const { slug = '' } = useParams()
  const [params, setParams] = useSearchParams()

  const [versions, setVersions] = useState<IncidentVersionSummary[] | null>(null)
  const [loaded, setLoaded] = useState<Record<number, IncidentVersion>>({})
  const [error, setError] = useState('')

  const fail = useCallback(
    (err: unknown) => {
      if (err instanceof ApiError && err.code === 401) {
        clearSession()
        navigate('/login')

        return
      }

      setError(errorMessage(err))
    },
    [navigate],
  )

  useEffect(() => {
    let cancelled = false

    listIncidentVersions(slug)
      .then((list) => {
        if (!cancelled) setVersions(list)
      })
      .catch((err: unknown) => {
        if (!cancelled) fail(err)
      })

    return () => {
      cancelled = true
    }
  }, [slug, fail])

  // The selection lives in the URL (?v=3&compare=2) so a comparison can be
  // shared; by default the latest version against the one before it.
  const latest = versions?.[0]?.version ?? 0
  const selected = Number(params.get('v')) || latest
  const compareParam = params.get('compare')
  const compareTo = compareParam !== null ? Number(compareParam) : selected - 1

  // Both versions being compared are fetched together (and only once): a
  // single state update, so the effect re-running on it finds nothing left
  // to fetch instead of cancelling a request still in flight.
  useEffect(() => {
    // The latest version too: its title is the incident's current one.
    const needed = [...new Set([selected, compareTo, latest])].filter((n) => n >= 1 && !loaded[n])
    if (needed.length === 0) return

    let cancelled = false

    Promise.all(needed.map((n) => getIncidentVersion(slug, n)))
      .then((fetched) => {
        if (!cancelled) setLoaded((all) => Object.assign({ ...all }, ...fetched.map((v) => ({ [v.version]: v }))))
      })
      .catch((err: unknown) => {
        if (!cancelled) fail(err)
      })

    return () => {
      cancelled = true
    }
  }, [slug, selected, compareTo, latest, loaded, fail])

  function select(version: number) {
    setParams({ v: String(version) }, { replace: true })
  }

  function setCompare(version: number) {
    setParams({ v: String(selected), compare: String(version) }, { replace: true })
  }

  const after = loaded[selected]
  const before = compareTo >= 1 ? loaded[compareTo] : undefined
  const ready = after && (compareTo < 1 || before)
  const title = loaded[latest]?.snapshot.title ?? ''

  return (
    <AppLayout current="Historique">
      <div className="mx-auto px-4 px-lg-5 py-4" style={{ maxWidth: '72rem' }}>
        <Link
          to={`/incidents/${slug}`}
          className="small text-decoration-none d-inline-flex align-items-center gap-2 mb-3"
          style={{ color: 'var(--pb-text-muted)' }}
        >
          <i className="fa-solid fa-arrow-left" style={{ fontSize: '0.7rem' }}></i> Retour au coelbook
        </Link>

        <h1 className="h4 fw-bold mb-1">Historique</h1>
        <p className="small mb-4" style={{ color: 'var(--pb-text-muted)' }}>
          {title ? `« ${title} » — ` : ''}chaque enregistrement qui modifie le coelbook crée une version.
        </p>

        {error && (
          <div className="badge-danger-soft rounded-3 small mb-4 py-2 px-3" role="alert">
            {error}
          </div>
        )}

        {!error && versions === null && (
          <div className="text-center py-5" style={{ color: 'var(--pb-text-muted)' }}>
            <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
            Chargement de l&apos;historique…
          </div>
        )}

        {versions && (
          <div className="row g-4">
            <div className="col-lg-4">
              <ol className="pb-card border rounded-4 list-unstyled mb-0 p-2" aria-label="Versions">
                {versions.map((v) => (
                  <li key={v.version}>
                    <button
                      type="button"
                      className={`pb-version-item w-100 text-start border-0 rounded-3 px-3 py-2 ${v.version === selected ? 'is-active' : ''}`}
                      onClick={() => select(v.version)}
                      aria-current={v.version === selected ? 'true' : undefined}
                    >
                      <div className="d-flex align-items-center justify-content-between gap-2">
                        <span className="fw-semibold small">Version {v.version}</span>
                        <span style={{ fontSize: '0.7rem', color: 'var(--pb-text-muted)' }} title={longDate.format(new Date(v.created_at))}>
                          {timeAgo(v.created_at)}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--pb-text-muted)' }}>
                        {authorName(v)} ·{' '}
                        {v.version === 1 ? 'Création' : changedLabels(v.changed_fields)}
                      </div>
                    </button>
                  </li>
                ))}
              </ol>
            </div>

            <div className="col-lg-8">
              <section className="pb-card border rounded-4 p-4">
                <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-3">
                  <h2 className="fs-6 fw-semibold mb-0">
                    Version {selected}
                    {after && (
                      <span className="fw-normal small ms-2" style={{ color: 'var(--pb-text-muted)' }}>
                        {longDate.format(new Date(after.created_at))} · {authorName(after)}
                      </span>
                    )}
                  </h2>

                  {selected > 1 && (
                    <label className="small d-flex align-items-center gap-2">
                      Comparer avec
                      <select
                        className="form-select form-select-sm w-auto"
                        value={compareTo}
                        onChange={(e) => setCompare(Number(e.target.value))}
                      >
                        {versions
                          .filter((v) => v.version < selected)
                          .map((v) => (
                            <option key={v.version} value={v.version}>
                              la version {v.version}
                            </option>
                          ))}
                      </select>
                    </label>
                  )}
                </div>

                {!ready ? (
                  <div className="small py-4 text-center" style={{ color: 'var(--pb-text-muted)' }}>
                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                    Chargement de la version…
                  </div>
                ) : (
                  <VersionDiff before={before?.snapshot} after={after.snapshot} />
                )}
              </section>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  )
}

// VersionDiff shows what differs between two snapshots, field by field: a
// line diff for text, removed/added values for the rest. With no "before"
// (version 1), it shows the content the incident was created with.
function VersionDiff({ before, after }: { before?: IncidentSnapshot; after: IncidentSnapshot }) {
  const fields = FIELDS.filter(({ key }) =>
    before ? JSON.stringify(before[key]) !== JSON.stringify(after[key]) : asText(after, key).trim() !== '',
  )

  if (fields.length === 0) {
    return (
      <div className="small" style={{ color: 'var(--pb-text-muted)' }}>
        Aucune différence entre ces deux versions.
      </div>
    )
  }

  return (
    <div className="d-flex flex-column gap-3">
      {!before && (
        <div className="small" style={{ color: 'var(--pb-text-muted)' }}>
          Contenu lors de la création du coelbook.
        </div>
      )}

      {fields.map(({ key, label }) => (
        <div key={key}>
          <div className="small fw-semibold mb-1">{label}</div>
          <FieldDiff field={key} before={before} after={after} />
        </div>
      ))}
    </div>
  )
}

function FieldDiff({ field, before, after }: { field: SnapshotField; before?: IncidentSnapshot; after: IncidentSnapshot }) {
  // Tags are a set: show which were removed and added, not a line diff.
  if (field === 'tags' && before) {
    const removed = before.tags.filter((t) => !after.tags.includes(t))
    const added = after.tags.filter((t) => !before.tags.includes(t))

    return (
      <div className="d-flex flex-wrap gap-2">
        {removed.map((t) => (
          <span key={`-${t}`} className="pb-diff-chip is-del">− {t}</span>
        ))}
        {added.map((t) => (
          <span key={`+${t}`} className="pb-diff-chip is-add">+ {t}</span>
        ))}
      </div>
    )
  }

  const lines = diffLines(before ? asText(before, field) : '', asText(after, field))

  return (
    <pre className="pb-diff font-mono rounded-3 mb-0">
      {lines.map((line, i) => (
        <div key={i} className={`pb-diff-line is-${line.kind}`}>
          <span className="pb-diff-sign" aria-hidden="true">
            {line.kind === 'add' ? '+' : line.kind === 'del' ? '−' : ' '}
          </span>
          <span className="visually-hidden">{line.kind === 'add' ? 'Ajouté : ' : line.kind === 'del' ? 'Supprimé : ' : ''}</span>
          {line.text || ' '}
        </div>
      ))}
    </pre>
  )
}
