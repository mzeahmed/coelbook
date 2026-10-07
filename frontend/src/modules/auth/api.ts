import { apiFetch } from '@/http/client'

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
