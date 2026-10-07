import { useState, type SubmitEvent } from 'react'
import { Link, useSearchParams } from 'react-router-dom'

import { ApiError } from '@/http/client'
import { confirmPasswordReset } from '../api'
import { clearSession } from '../session'

export default function ResetPasswordView() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token') ?? ''
  const [password, setPassword] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [completed, setCompleted] = useState(false)

  async function handleSubmit(e: SubmitEvent<HTMLFormElement>) {
    e.preventDefault()
    if (password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }
    if (password !== confirmation) {
      setError('Passwords do not match.')
      return
    }

    setSubmitting(true)
    setError('')
    try {
      await confirmPasswordReset({ token, password })
      clearSession()
      setCompleted(true)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Something went wrong. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="pb-wizard-shell d-flex align-items-center justify-content-center p-3">
      <div style={{ width: '100%', maxWidth: '26rem' }}>
        <div className="d-flex align-items-center justify-content-center gap-2 mb-4">
          <div className="d-inline-flex align-items-center justify-content-center rounded-3 pb-brand-mark" style={{ width: '2.25rem', height: '2.25rem' }}>
            <i className="fa-solid fa-book-bookmark text-white" style={{ fontSize: '0.9rem' }}></i>
          </div>
          <span className="fw-bold fs-5">Coelbook</span>
        </div>

        <div className="pb-card border rounded-4 p-4 p-sm-5">
          <h1 className="h4 fw-bold mb-1">Choose a new password</h1>
          <p className="small mb-4" style={{ color: 'var(--pb-text-muted)' }}>Your new password must contain at least 8 characters.</p>

          {!token ? (
            <div className="text-center">
              <div className="badge-danger-soft rounded-3 small mb-3 py-2 px-3" role="alert">This reset link is invalid or incomplete.</div>
              <Link className="btn btn-primary w-100 fw-medium" to="/forgot-password">Request a new link</Link>
            </div>
          ) : completed ? (
            <div className="text-center">
              <div className="alert alert-success small" role="status">Your password has been reset. Please sign in again.</div>
              <Link className="btn btn-primary w-100 fw-medium" to="/login">Sign in</Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <label className="form-label small fw-medium" htmlFor="new-password">New password</label>
                <input id="new-password" type="password" className="form-control" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} required />
              </div>
              <div className="mb-4">
                <label className="form-label small fw-medium" htmlFor="confirm-password">Confirm new password</label>
                <input id="confirm-password" type="password" className="form-control" autoComplete="new-password" value={confirmation} onChange={(e) => setConfirmation(e.target.value)} required />
              </div>

              {error && <div className="badge-danger-soft rounded-3 small mb-3 py-2 px-3" role="alert">{error}</div>}

              <button type="submit" className="btn btn-primary w-100 fw-medium" disabled={submitting}>
                {submitting && <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>}
                Reset password
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
