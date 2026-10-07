// Thin fetch wrapper that unwraps the API's standard JSON envelope
// ({code, success, error, message, data}), so callers only ever deal with the
// typed payload or a thrown ApiError — network failures, timeouts, and
// non-JSON responses (e.g. an nginx error page) are all normalized into
// the same ApiError type instead of leaking a raw fetch/parse exception.

const DEFAULT_TIMEOUT_MS = 15000

export interface ApiEnvelope<T> {
  code: number
  success: boolean
  // Stable machine-readable error code, set on error responses only.
  error?: string
  message: string
  data: T
}

// Error codes for failures detected client-side, before or instead of a
// usable API envelope. They share the namespace of the API's own codes so
// errorMessage() can translate both the same way.
export const CLIENT_ERROR_CODES = {
  timeout: 'timeout',
  network: 'network_error',
  invalidResponse: 'invalid_response',
} as const

export class ApiError extends Error {
  // HTTP status (0 when no response was received).
  code: number
  // Stable error code, from the API envelope or CLIENT_ERROR_CODES; empty
  // if the API didn't send one. Use errorMessage() to display it.
  errorCode: string

  constructor (code: number, errorCode: string, message: string) {
    super(message)
    this.name = 'ApiError'
    this.code = code
    this.errorCode = errorCode
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
      throw new ApiError(0, CLIENT_ERROR_CODES.timeout, 'request timed out')
    }

    throw new ApiError(0, CLIENT_ERROR_CODES.network, 'unable to reach the server')
  } finally {
    if (timeoutId !== null) clearTimeout(timeoutId)
  }

  let body: ApiEnvelope<T>

  try {
    body = (await res.json()) as ApiEnvelope<T>
  } catch {
    throw new ApiError(res.status, CLIENT_ERROR_CODES.invalidResponse, 'unexpected non-JSON response')
  }

  if (!body.success) {
    throw new ApiError(body.code, body.error ?? '', body.message)
  }

  return body.data
}
