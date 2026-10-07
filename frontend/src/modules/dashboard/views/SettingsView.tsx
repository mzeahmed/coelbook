import { useEffect, useState, type FormEvent, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'

import { ApiError } from '@/http/client'
import { errorMessage } from '@/http/errors'
import { changePassword, getAccount, updateAccount, type ProfileInput } from '@/modules/auth/api'
import { clearSession, updateSession } from '@/modules/auth/session'
import { LOCALES, timezoneOptions } from '@/modules/wizard/options'
import { getSettings, updateSettings, type InstanceSettings } from '../api'
import AppLayout from '../components/AppLayout'

const SECTION = { label: 'Paramètres', to: '/settings' }

// The outcome of a save: a confirmation, or an error shown next to the
// field the API pointed at (or above the button when it pointed nowhere).
type SaveState = { kind: 'idle' } | { kind: 'saved'; message: string } | { kind: 'error'; field: string; message: string }

const IDLE: SaveState = { kind: 'idle' }

function fieldError(state: SaveState, field: string): string {
  return state.kind === 'error' && state.field === field ? state.message : ''
}

function Field({ id, label, error, children }: { id: string; label: string; error: string; children: ReactNode }) {
  return (
    <div>
      <label className="form-label small fw-medium" htmlFor={id}>
        {label}
      </label>
      {children}
      {error && <div className="invalid-feedback d-block small">{error}</div>}
    </div>
  )
}

function SaveBar({ state, busy, label }: { state: SaveState; busy: boolean; label: string }) {
  return (
    <div className="d-flex align-items-center justify-content-end gap-3 flex-wrap mt-3">
      {state.kind === 'saved' && (
        <span className="small d-flex align-items-center gap-1" style={{ color: 'var(--pb-success)' }} role="status">
          <i className="fa-solid fa-check" style={{ fontSize: '0.7rem' }}></i> {state.message}
        </span>
      )}
      {state.kind === 'error' && !state.field && (
        <span className="badge-danger-soft rounded-3 small py-1 px-2" role="alert">
          {state.message}
        </span>
      )}
      <button type="submit" className="btn btn-primary btn-sm fw-medium" disabled={busy}>
        {busy && <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>}
        {label}
      </button>
    </div>
  )
}

export default function SettingsView() {
  const navigate = useNavigate()

  const [profile, setProfile] = useState<ProfileInput | null>(null)
  const [instance, setInstance] = useState<InstanceSettings | null>(null)
  const [loadError, setLoadError] = useState('')

  // Every API failure goes through here so an expired session always sends
  // the user back to the login page.
  function handleAuth(err: unknown): boolean {
    if (err instanceof ApiError && err.code === 401) {
      clearSession()
      navigate('/login')

      return true
    }

    return false
  }

  useEffect(() => {
    let cancelled = false

    Promise.all([getAccount(), getSettings()])
      .then(([account, settings]) => {
        if (cancelled) return

        setProfile({ first_name: account.first_name, last_name: account.last_name, email: account.email })
        setInstance(settings)
      })
      .catch((err: unknown) => {
        if (cancelled) return

        if (err instanceof ApiError && err.code === 401) {
          clearSession()
          navigate('/login')

          return
        }

        setLoadError(errorMessage(err))
      })

    return () => {
      cancelled = true
    }
  }, [navigate])

  return (
    <AppLayout section={SECTION}>
      <div className="mx-auto px-4 px-lg-5 py-4" style={{ maxWidth: '48rem' }}>
        <div className="mb-4">
          <h1 className="h4 fw-bold mb-1">Paramètres</h1>
          <p className="small mb-0" style={{ color: 'var(--pb-text-muted)' }}>
            Votre compte et la configuration de cette instance Coelbook.
          </p>
        </div>

        {loadError && (
          <div className="badge-danger-soft rounded-3 small mb-4 py-2 px-3" role="alert">
            {loadError}
          </div>
        )}

        {!loadError && (!profile || !instance) && (
          <div className="text-center py-5" style={{ color: 'var(--pb-text-muted)' }}>
            <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
            Chargement des paramètres…
          </div>
        )}

        {profile && instance && (
          <div className="d-flex flex-column gap-3">
            <ProfileForm initial={profile} onAuthError={handleAuth} />
            <PasswordForm onAuthError={handleAuth} />
            <InstanceForm initial={instance} onAuthError={handleAuth} />
          </div>
        )}
      </div>
    </AppLayout>
  )
}

function ProfileForm({ initial, onAuthError }: { initial: ProfileInput; onAuthError: (err: unknown) => boolean }) {
  const [form, setForm] = useState(initial)
  const [busy, setBusy] = useState(false)
  const [state, setState] = useState<SaveState>(IDLE)

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setState(IDLE)
    setBusy(true)

    try {
      const user = await updateAccount(form)
      // The sidebar shows the stored user: keep it in sync.
      updateSession({ user })
      setForm({ first_name: user.first_name, last_name: user.last_name, email: user.email })
      setState({ kind: 'saved', message: 'Profil enregistré.' })
    } catch (err) {
      if (!onAuthError(err)) setState({ kind: 'error', field: err instanceof ApiError ? err.field : '', message: errorMessage(err) })
    } finally {
      setBusy(false)
    }
  }

  const input = (field: keyof ProfileInput) => ({
    id: `account-${field}`,
    className: `form-control ${fieldError(state, field) ? 'is-invalid' : ''}`,
    value: form[field],
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => setForm((f) => ({ ...f, [field]: e.target.value })),
  })

  return (
    <form onSubmit={handleSubmit} noValidate className="pb-card border rounded-4 p-4">
      <h2 className="fs-6 fw-semibold mb-3">Mon compte</h2>
      <div className="row g-3">
        <div className="col-sm-6">
          <Field id="account-first_name" label="Prénom" error={fieldError(state, 'first_name')}>
            <input {...input('first_name')} autoComplete="given-name" maxLength={100} />
          </Field>
        </div>
        <div className="col-sm-6">
          <Field id="account-last_name" label="Nom" error={fieldError(state, 'last_name')}>
            <input {...input('last_name')} autoComplete="family-name" maxLength={100} />
          </Field>
        </div>
        <div className="col-12">
          <Field id="account-email" label="Adresse e-mail" error={fieldError(state, 'email')}>
            <input {...input('email')} type="email" autoComplete="email" />
          </Field>
          <div className="form-text small">C&apos;est l&apos;adresse utilisée pour vous connecter.</div>
        </div>
      </div>
      <SaveBar state={state} busy={busy} label="Enregistrer" />
    </form>
  )
}

function PasswordForm({ onAuthError }: { onAuthError: (err: unknown) => boolean }) {
  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')
  const [confirm, setConfirm] = useState('')
  const [busy, setBusy] = useState(false)
  const [state, setState] = useState<SaveState>(IDLE)

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setState(IDLE)

    // Only the API knows the current password; the confirmation is a typo
    // check the API never sees.
    if (next !== confirm) {
      setState({ kind: 'error', field: 'confirm_password', message: 'Les mots de passe ne correspondent pas.' })

      return
    }

    setBusy(true)

    try {
      const { token } = await changePassword(current, next)
      // Every previous token is now invalid, this one included.
      updateSession({ token })
      setCurrent('')
      setNext('')
      setConfirm('')
      setState({ kind: 'saved', message: 'Mot de passe modifié. Vos autres sessions ont été déconnectées.' })
    } catch (err) {
      if (!onAuthError(err)) setState({ kind: 'error', field: err instanceof ApiError ? err.field : '', message: errorMessage(err) })
    } finally {
      setBusy(false)
    }
  }

  const cls = (field: string) => `form-control ${fieldError(state, field) ? 'is-invalid' : ''}`

  return (
    <form onSubmit={handleSubmit} noValidate className="pb-card border rounded-4 p-4">
      <h2 className="fs-6 fw-semibold mb-1">Mot de passe</h2>
      <p className="small mb-3" style={{ color: 'var(--pb-text-muted)' }}>
        Au moins 8 caractères. Vos autres sessions seront déconnectées.
      </p>
      <div className="row g-3">
        <div className="col-12">
          <Field id="password-current" label="Mot de passe actuel" error={fieldError(state, 'current_password')}>
            <input
              id="password-current"
              type="password"
              className={cls('current_password')}
              autoComplete="current-password"
              value={current}
              onChange={(e) => setCurrent(e.target.value)}
            />
          </Field>
        </div>
        <div className="col-sm-6">
          <Field id="password-new" label="Nouveau mot de passe" error={fieldError(state, 'new_password')}>
            <input
              id="password-new"
              type="password"
              className={cls('new_password')}
              autoComplete="new-password"
              value={next}
              onChange={(e) => setNext(e.target.value)}
            />
          </Field>
        </div>
        <div className="col-sm-6">
          <Field id="password-confirm" label="Confirmer le nouveau mot de passe" error={fieldError(state, 'confirm_password')}>
            <input
              id="password-confirm"
              type="password"
              className={cls('confirm_password')}
              autoComplete="new-password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
            />
          </Field>
        </div>
      </div>
      <SaveBar state={state} busy={busy} label="Changer le mot de passe" />
    </form>
  )
}

function InstanceForm({ initial, onAuthError }: { initial: InstanceSettings; onAuthError: (err: unknown) => boolean }) {
  const [form, setForm] = useState(initial)
  const [busy, setBusy] = useState(false)
  const [state, setState] = useState<SaveState>(IDLE)

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setState(IDLE)
    setBusy(true)

    try {
      setForm(await updateSettings(form))
      setState({ kind: 'saved', message: 'Paramètres de l\'instance enregistrés.' })
    } catch (err) {
      if (!onAuthError(err)) setState({ kind: 'error', field: err instanceof ApiError ? err.field : '', message: errorMessage(err) })
    } finally {
      setBusy(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="pb-card border rounded-4 p-4">
      <h2 className="fs-6 fw-semibold mb-1">Instance</h2>
      <p className="small mb-3" style={{ color: 'var(--pb-text-muted)' }}>
        Les réglages choisis lors de l&apos;installation.
      </p>
      <div className="row g-3">
        <div className="col-12">
          <Field id="instance-name" label="Nom de l'instance" error={fieldError(state, 'instance_name')}>
            <input
              id="instance-name"
              className={`form-control ${fieldError(state, 'instance_name') ? 'is-invalid' : ''}`}
              value={form.instance_name}
              onChange={(e) => setForm((f) => ({ ...f, instance_name: e.target.value }))}
              maxLength={100}
            />
          </Field>
        </div>
        <div className="col-sm-7">
          <Field id="instance-timezone" label="Fuseau horaire" error={fieldError(state, 'timezone')}>
            <select
              id="instance-timezone"
              className={`form-select ${fieldError(state, 'timezone') ? 'is-invalid' : ''}`}
              value={form.timezone}
              onChange={(e) => setForm((f) => ({ ...f, timezone: e.target.value }))}
            >
              {timezoneOptions(form.timezone).map((tz) => (
                <option key={tz} value={tz}>
                  {tz}
                </option>
              ))}
            </select>
          </Field>
        </div>
        <div className="col-sm-5">
          <Field id="instance-locale" label="Langue" error={fieldError(state, 'locale')}>
            <select
              id="instance-locale"
              className={`form-select ${fieldError(state, 'locale') ? 'is-invalid' : ''}`}
              value={form.locale}
              onChange={(e) => setForm((f) => ({ ...f, locale: e.target.value }))}
            >
              {LOCALES.map((l) => (
                <option key={l.value} value={l.value}>
                  {l.label}
                </option>
              ))}
            </select>
          </Field>
        </div>
      </div>
      <SaveBar state={state} busy={busy} label="Enregistrer" />
    </form>
  )
}
