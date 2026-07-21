// Thin fetch wrapper that unwraps the backend's standard JSON envelope
// ({code, success, message, data}), so callers only ever deal with the
// typed payload or a thrown ApiError — network failures, timeouts, and
// non-JSON responses (e.g. an nginx error page) are all normalized into
// the same ApiError type instead of leaking a raw fetch/parse exception.

const DEFAULT_TIMEOUT_MS = 15000

export interface ApiEnvelope<T> {
  code: number
  success: boolean
  message: string
  data: T
}

export class ApiError extends Error {
  code: number

  constructor (code: number, message: string) {
    super(message)
    this.name = 'ApiError'
    this.code = code
  }
}

export interface ApiRequestOptions {
  method?: string
  // Plain JSON-serializable body; apiFetch stringifies it, so callers
  // never call JSON.stringify themselves.
  payload?: unknown
  headers?: Record<string, string>
}

// timeoutMs defaults to 15s; pass 0 to disable the timeout entirely.
export async function apiFetch<T>(
  input: string,
  options: ApiRequestOptions = {},
  timeoutMs: number = DEFAULT_TIMEOUT_MS,
): Promise<T> {
  const { method = 'GET', payload, headers } = options

  const controller = new AbortController()
  const timeoutId = timeoutMs > 0 ? setTimeout(() => controller.abort(), timeoutMs) : null

  let res: Response

  try {
    res = await fetch(input, {
      method,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
      body: payload !== undefined ? JSON.stringify(payload) : undefined,
    })
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') {
      throw new ApiError(0, 'The request timed out. Please try again.')
    }

    throw new ApiError(0, 'Unable to reach the server. Check your connection and try again.')
  } finally {
    if (timeoutId !== null) clearTimeout(timeoutId)
  }

  let body: ApiEnvelope<T>

  try {
    body = (await res.json()) as ApiEnvelope<T>
  } catch {
    throw new ApiError(res.status, 'The server returned an unexpected response.')
  }

  if (!body.success) {
    throw new ApiError(body.code, body.message)
  }

  return body.data
}
