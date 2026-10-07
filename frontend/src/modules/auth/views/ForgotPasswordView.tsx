import { useState, type SubmitEvent } from 'react'
import { Link } from 'react-router-dom'

import { ApiError } from '@/http/client'
import { requestPasswordReset } from '../api'

export default function ForgotPasswordView() {
  const [email, setEmail] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [submitted, setSubmitted] = useState(false)

  async function handleSubmit(e: SubmitEvent<HTMLFormElement>) {
    e.preventDefault()
    setSubmitting(true)
    setError('')

    try {
      await requestPasswordReset({ email })
      setSubmitted(true)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Une erreur est survenue. Veuillez réessayer.')
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
          <h1 className="h4 fw-bold mb-1">Réinitialiser votre mot de passe</h1>
          <p className="small mb-4" style={{ color: 'var(--pb-text-muted)' }}>
            Saisissez votre adresse e-mail et nous vous enverrons un lien de réinitialisation.
          </p>

          {submitted ? (
            <div className="text-center">
              <div className="alert alert-success small" role="status">
                Si un compte existe pour cette adresse, un lien de réinitialisation a été envoyé.
              </div>
              <Link className="btn btn-primary w-100 fw-medium" to="/login">Retour à la connexion</Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="form-label small fw-medium" htmlFor="reset-email">Adresse e-mail</label>
                <input
                  id="reset-email"
                  type="email"
                  className="form-control"
                  placeholder="vous@entreprise.com"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              {error && <div className="badge-danger-soft rounded-3 small mb-3 py-2 px-3" role="alert">{error}</div>}

              <button type="submit" className="btn btn-primary w-100 fw-medium" disabled={submitting}>
                {submitting && <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>}
                Envoyer le lien
              </button>
              <div className="text-center mt-3">
                <Link className="small text-decoration-none" to="/login">Retour à la connexion</Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
