// Thin fetch wrapper that unwraps the backend's standard JSON envelope
// ({code, success, message, data}), so callers only ever deal with the
// typed payload or a thrown ApiError.

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

export async function apiFetch<T> (input: string, init?: RequestInit): Promise<T> {
  const res = await fetch(input, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...init?.headers,
    },
  })

  const body = (await res.json()) as ApiEnvelope<T>

  if (!body.success) {
    throw new ApiError(body.code, body.message)
  }

  return body.data
}