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
}

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

// IncidentWriteRequest is the body of a create or update. It replaces
// every editable field: on update, an empty field or tag list clears it.
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
}

function authHeaders(): Record<string, string> {
  const token = getToken()

  return token ? { Authorization: `Bearer ${token}` } : {}
}

export function listCategories(): Promise<IncidentCategory[]> {
  return apiFetch<IncidentCategory[]>('/api/categories', { headers: authHeaders() })
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
