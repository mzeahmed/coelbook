import { apiFetch } from '@/http/client'
import { getToken } from '@/modules/auth/session'

export type IncidentStatus = 'draft' | 'published' | 'archived'

export interface IncidentCategory {
  name: string
  slug: string
}

export interface IncidentAuthor {
  first_name: string
  last_name: string
}

export interface IncidentSummary {
  id: string
  title: string
  slug: string
  summary: string
  status: IncidentStatus
  category: IncidentCategory
  author: IncidentAuthor
  tags: string[]
  created_at: string
  updated_at: string
  // Only set in a listing filtered by a search query; see Highlighted.
  highlight?: IncidentHighlight
}

// Title and summary of a search result with each matched term wrapped in
// HIGHLIGHT_START / HIGHLIGHT_END.
export interface IncidentHighlight {
  title: string
  summary: string
}

export const HIGHLIGHT_START = '\uE000'
export const HIGHLIGHT_END = '\uE001'

export interface ListIncidentsResult {
  incidents: IncidentSummary[]
  total: number
  page: number
  per_page: number
}

export interface ListIncidentsFilter {
  category?: string
  status?: string
  tag?: string
  q?: string
  page?: number
  perPage?: number
}

// listIncidents fetches a page of incidents matching filter. The route is
// protected, so the caller's access token (if any) is attached as a
// bearer header; an expired or missing token surfaces as an ApiError with
// code 401, which callers should handle by sending the user back to
// /login.
export function listIncidents(filter: ListIncidentsFilter = {}): Promise<ListIncidentsResult> {
  const params = new URLSearchParams()

  if (filter.category) params.set('category', filter.category)
  if (filter.status) params.set('status', filter.status)
  if (filter.tag) params.set('tag', filter.tag)
  if (filter.q) params.set('q', filter.q)
  if (filter.page) params.set('page', String(filter.page))
  if (filter.perPage) params.set('per_page', String(filter.perPage))

  const qs = params.toString()
  const token = getToken()

  return apiFetch<ListIncidentsResult>(`/api/incidents${qs ? `?${qs}` : ''}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  })
}

export interface IncidentSnippet {
  id: string
  title: string
  language: string
  content: string
}

export interface IncidentLink {
  id: string
  title: string
  url: string
}

export interface IncidentDetail extends IncidentSummary {
  problem: string
  diagnosis: string
  root_cause: string
  solution: string
  prevention: string
  snippets: IncidentSnippet[]
  links: IncidentLink[]
}

// getIncident fetches a single incident by slug. Like listIncidents, a
// missing or expired token surfaces as an ApiError with code 401; an
// unknown slug surfaces as code 404.
export function getIncident(slug: string): Promise<IncidentDetail> {
  const token = getToken()

  return apiFetch<IncidentDetail>(`/api/incidents/${encodeURIComponent(slug)}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  })
}

export interface IncidentSnippetInput {
  title: string
  // Blank is stored as "text".
  language: string
  content: string
}

export interface IncidentLinkInput {
  // Blank is replaced by the URL.
  title: string
  url: string
}

// IncidentWriteRequest is the body of a create or update. It replaces
// every editable field: on update, an empty field or list clears it.
export interface IncidentWriteRequest {
  title: string
  summary: string
  problem: string
  diagnosis: string
  root_cause: string
  solution: string
  prevention: string
  status: IncidentStatus
  category: string
  tags: string[]
  // List order is display order.
  snippets: IncidentSnippetInput[]
  links: IncidentLinkInput[]
}

function authHeaders(): Record<string, string> {
  const token = getToken()

  return token ? { Authorization: `Bearer ${token}` } : {}
}

// Category is a category as listed by GET /categories (an incident only
// carries its name and slug, see IncidentCategory).
export interface Category extends IncidentCategory {
  description: string
  incident_count: number
}

export interface CategoryWriteRequest {
  name: string
  description: string
}

export function listCategories(): Promise<Category[]> {
  return apiFetch<Category[]>('/api/categories', { headers: authHeaders() })
}

export function createCategory(payload: CategoryWriteRequest): Promise<Category> {
  return apiFetch<Category>('/api/categories', { method: 'POST', payload, headers: authHeaders() })
}

// updateCategory renames the category identified by slug and replaces its
// description; the slug itself never changes.
export function updateCategory(slug: string, payload: CategoryWriteRequest): Promise<Category> {
  return apiFetch<Category>(`/api/categories/${encodeURIComponent(slug)}`, {
    method: 'PUT',
    payload,
    headers: authHeaders(),
  })
}

// deleteCategory fails with the category_in_use error code while
// incidents still belong to the category.
export function deleteCategory(slug: string): Promise<null> {
  return apiFetch<null>(`/api/categories/${encodeURIComponent(slug)}`, { method: 'DELETE', headers: authHeaders() })
}

export interface IncidentTag {
  name: string
  // Value to pass as the tag filter of listIncidents.
  slug: string
  incident_count: number
}

// listTags returns tags sorted by name with their incident count: only the
// used ones (what the filters need) unless includeUnused is set.
export function listTags(includeUnused = false): Promise<IncidentTag[]> {
  return apiFetch<IncidentTag[]>(`/api/tags${includeUnused ? '?include_unused=true' : ''}`, { headers: authHeaders() })
}

// renameTag renames a tag; its slug follows the new name. Fails with the
// tag_exists error code when another tag already has that name: merge into
// it instead (its slug is slugify(name)).
export function renameTag(slug: string, name: string): Promise<IncidentTag> {
  return apiFetch<IncidentTag>(`/api/tags/${encodeURIComponent(slug)}`, {
    method: 'PUT',
    payload: { name },
    headers: authHeaders(),
  })
}

// mergeTag moves every incident tagged slug onto the tag into, then
// deletes slug. Returns the target tag with its new count.
export function mergeTag(slug: string, into: string): Promise<IncidentTag> {
  return apiFetch<IncidentTag>(`/api/tags/${encodeURIComponent(slug)}/merge`, {
    method: 'POST',
    payload: { into },
    headers: authHeaders(),
  })
}

// deleteTag removes a tag from every incident and deletes it.
export function deleteTag(slug: string): Promise<null> {
  return apiFetch<null>(`/api/tags/${encodeURIComponent(slug)}`, { method: 'DELETE', headers: authHeaders() })
}

// purgeUnusedTags deletes every tag no incident uses.
export function purgeUnusedTags(): Promise<{ deleted: number }> {
  return apiFetch<{ deleted: number }>('/api/tags?unused=true', { method: 'DELETE', headers: authHeaders() })
}

export interface InstanceSettings {
  instance_name: string
  // IANA time zone, e.g. "Europe/Paris".
  timezone: string
  locale: string
}

export function getSettings(): Promise<InstanceSettings> {
  return apiFetch<InstanceSettings>('/api/settings', { headers: authHeaders() })
}

export function updateSettings(payload: InstanceSettings): Promise<InstanceSettings> {
  return apiFetch<InstanceSettings>('/api/settings', { method: 'PUT', payload, headers: authHeaders() })
}

// createIncident stores a new incident authored by the signed-in user. The
// API derives the slug from the title; use the returned incident's slug
// to navigate to it.
export function createIncident(payload: IncidentWriteRequest): Promise<IncidentDetail> {
  return apiFetch<IncidentDetail>('/api/incidents', { method: 'POST', payload, headers: authHeaders() })
}

// updateIncident replaces the editable fields of the incident identified
// by slug. The slug itself never changes.
export function updateIncident(slug: string, payload: IncidentWriteRequest): Promise<IncidentDetail> {
  return apiFetch<IncidentDetail>(`/api/incidents/${encodeURIComponent(slug)}`, {
    method: 'PUT',
    payload,
    headers: authHeaders(),
  })
}

export interface NamedCount {
  name: string
  slug: string
  incident_count: number
}

export interface Stats {
  // Counts include incidents of every status.
  total: number
  by_status: Record<IncidentStatus, number>
  // Every category, sorted by name.
  categories: NamedCount[]
  // Up to 10 most used tags, most used first.
  top_tags: NamedCount[]
  // Up to 5 most recently updated incidents.
  recent: {
    title: string
    slug: string
    status: IncidentStatus
    category: IncidentCategory
    updated_at: string
  }[]
  // Incidents created per week, last 12 weeks, oldest first.
  activity: { week_start: string; total: number }[]
}

export function getStats(): Promise<Stats> {
  return apiFetch<Stats>('/api/stats', { headers: authHeaders() })
}
