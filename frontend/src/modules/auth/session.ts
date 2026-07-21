import type {AuthUser} from './api'

const TOKEN_KEY = 'coelbook_token'
const USER_KEY = 'coelbook_user'

// saveSession persists the access token and user returned by login.
// persist=true (the "Remember me" checkbox) survives browser restarts
// (localStorage); persist=false is cleared when the tab closes
// (sessionStorage).
export function saveSession (token: string, user: AuthUser, persist: boolean) {
  const storage = persist ? localStorage : sessionStorage

  storage.setItem(TOKEN_KEY, token)
  storage.setItem(USER_KEY, JSON.stringify(user))
}

export function clearSession () {
  for (const storage of [localStorage, sessionStorage]) {
    storage.removeItem(TOKEN_KEY)
    storage.removeItem(USER_KEY)
  }
}

export function getToken (): string | null {
  return localStorage.getItem(TOKEN_KEY) ?? sessionStorage.getItem(TOKEN_KEY)
}

export function getUser (): AuthUser | null {
  const raw = localStorage.getItem(USER_KEY) ?? sessionStorage.getItem(USER_KEY)

  return raw ? (JSON.parse(raw) as AuthUser) : null
}