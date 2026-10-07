import type { IncidentStatus } from '../api'

const CATEGORY_BADGES = ['badge-blue', 'badge-purple', 'badge-amber', 'badge-red', 'badge-green', 'badge-cyan']

// categoryBadgeClass picks a stable color for a category from its slug, so
// the same category always gets the same badge color without needing a
// color field in the data model.
export function categoryBadgeClass(slug: string): string {
  let hash = 0
  for (let i = 0; i < slug.length; i++) {
    hash = (hash * 31 + slug.charCodeAt(i)) >>> 0
  }

  return CATEGORY_BADGES[hash % CATEGORY_BADGES.length]!
}

export const STATUS_LABEL: Record<IncidentStatus, string> = {
  published: 'Publié',
  draft: 'Brouillon',
  archived: 'Archivé',
}

export const STATUS_BADGE: Record<IncidentStatus, string> = {
  published: 'badge-success-soft',
  draft: 'badge-warning-soft',
  archived: 'badge-muted-soft',
}

export function timeAgo(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime()
  const minutes = Math.floor(diffMs / 60000)

  if (minutes < 1) return 'à l\'instant'
  if (minutes < 60) return `il y a ${minutes} minute${minutes === 1 ? '' : 's'}`

  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `il y a ${hours} heure${hours === 1 ? '' : 's'}`

  const days = Math.floor(hours / 24)
  if (days < 30) return `il y a ${days} jour${days === 1 ? '' : 's'}`

  const months = Math.floor(days / 30)
  if (months < 12) return `il y a ${months} mois`

  const years = Math.floor(months / 12)
  return `il y a ${years} an${years === 1 ? '' : 's'}`
}
