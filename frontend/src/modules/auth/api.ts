import { apiFetch } from '@/http/client'
import { getToken } from './session'

export interface LoginInput {
  email: string
  password: string
}

export interface AuthUser {
  id: string
  email: string
  first_name: string
  last_name: string
}

export interface LoginResult {
  token: string
  user: AuthUser
}

export interface PasswordResetRequestInput {
  email: string
}

export interface PasswordResetConfirmInput {
  token: string
  password: string
}

// login exchanges an email/password pair for a JWT access token, matching
// POST /api/auth/login. There is no public registration: the only account
// created outside of an authenticated session is the administrator created
// by the setup wizard.
export function login(input: LoginInput): Promise<LoginResult> {
  return apiFetch<LoginResult>('/api/auth/login', {
    method: 'POST',
    payload: input,
  })
}

// requestPasswordReset always resolves with the same success message when the
// request is valid, whether or not the email belongs to an account.
export function requestPasswordReset(input: PasswordResetRequestInput): Promise<null> {
  return apiFetch<null>('/api/auth/password-reset', {
    method: 'POST',
    payload: input,
  })
}

export function confirmPasswordReset(input: PasswordResetConfirmInput): Promise<null> {
  return apiFetch<null>('/api/auth/password-reset/confirm', {
    method: 'POST',
    payload: input,
  })
}

export interface ProfileInput {
  first_name: string
  last_name: string
  email: string
}

function authHeaders(): Record<string, string> {
  const token = getToken()

  return token ? { Authorization: `Bearer ${token}` } : {}
}

export function getAccount(): Promise<AuthUser> {
  return apiFetch<AuthUser>('/api/account', { headers: authHeaders() })
}

export function updateAccount(payload: ProfileInput): Promise<AuthUser> {
  return apiFetch<AuthUser>('/api/account', { method: 'PUT', payload, headers: authHeaders() })
}

// changePassword signs the user out of every session and returns a new
// token for this one; store it with updateSession.
export function changePassword(currentPassword: string, newPassword: string): Promise<{ token: string }> {
  return apiFetch<{ token: string }>('/api/account/password', {
    method: 'PUT',
    payload: { current_password: currentPassword, new_password: newPassword },
    headers: authHeaders(),
  })
}
