// A validation error attached to one form input, identified by the API's
// field path (e.g. "title", "snippets[2].content").
export interface FieldError {
  field: string
  message: string
}

// fieldInputId maps an API field path to the DOM id of its input, so the
// form can focus the input an error is about.
export function fieldInputId(field: string): string {
  return `incident-${field.replace(/[^a-zA-Z0-9]+/g, '-').replace(/-$/, '')}`
}

// messageFor returns the error message for field, if error is about it.
export function messageFor(error: FieldError | null, field: string): string | undefined {
  return error?.field === field ? error.message : undefined
}

// Editable list rows carry a client-only key so React keeps each row's
// inputs (and focus) stable while rows are added, removed or reordered.
export type Row<T> = T & { key: number }

let nextKey = 0

export function withKey<T extends object>(value: T): Row<T> {
  return { ...value, key: nextKey++ }
}

export function withoutKey<T extends object>(row: Row<T>): T {
  const value: Partial<Row<T>> = { ...row }
  delete value.key

  return value as T
}

export function moveRow<T>(rows: T[], from: number, to: number): T[] {
  if (to < 0 || to >= rows.length) return rows

  const next = [...rows]
  const [row] = next.splice(from, 1)
  next.splice(to, 0, row!)

  return next
}
