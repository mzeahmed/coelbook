import { useState, type SubmitEvent } from 'react'
import { useNavigate } from 'react-router-dom'

import { ApiError } from '@/http/client'
import { login } from '../api'
import { saveSession } from '../session'

export default function LoginView() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const navigate = useNavigate()

  async function handleSubmit(e: SubmitEvent<HTMLFormElement>) {
    e.preventDefault()
    setSubmitting(true)
    setError('')

    try {
      const result = await login({ email, password })
      saveSession(result.token, result.user, rememberMe)
      navigate('/dashboard')
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
          <div
            className="d-inline-flex align-items-center justify-content-center rounded-3 pb-brand-mark"
            style={{ width: '2.25rem', height: '2.25rem' }}
          >
            <i className="fa-solid fa-book-bookmark text-white" style={{ fontSize: '0.9rem' }}></i>
          </div>
          <span className="fw-bold fs-5">Coelbook</span>
        </div>

        <div className="pb-card border rounded-4 p-4 p-sm-5">
          <h1 className="h4 fw-bold mb-1">Welcome back</h1>
          <p className="small mb-4" style={{ color: 'var(--pb-text-muted)' }}>
            Sign in to your knowledge base
          </p>

          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label className="form-label small fw-medium" htmlFor="login-email">
                Email address
              </label>
              <input
                id="login-email"
                type="email"
                className="form-control"
                placeholder="you@company.com"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="mb-3">
              <label className="form-label small fw-medium" htmlFor="login-password">
                Password
              </label>

              <div className="position-relative">
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  className="form-control pe-5"
                  placeholder="••••••••"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  className="btn btn-sm border-0 position-absolute top-50 end-0 translate-middle-y me-1"
                  style={{ color: 'var(--pb-text-muted)' }}
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  <i className={`fa-solid ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                </button>
              </div>
            </div>

            <div className="form-check mb-4">
              <input
                id="login-remember"
                type="checkbox"
                className="form-check-input"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
              />
              <label
                className="form-check-label small"
                htmlFor="login-remember"
                style={{ color: 'var(--pb-text-muted)' }}
              >
                Remember me
              </label>
            </div>

            {error && (
              <div className="badge-danger-soft rounded-3 small mb-3 py-2 px-3" role="alert">
                {error}
              </div>
            )}

            <button type="submit" className="btn btn-primary w-100 fw-medium" disabled={submitting}>
              {submitting && (
                <span
                  className="spinner-border spinner-border-sm me-2"
                  role="status"
                  aria-hidden="true"
                ></span>
              )}
              Sign in
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}