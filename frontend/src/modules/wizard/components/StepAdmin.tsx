import type {AdminInput} from "@/modules/wizard/api.ts";
import type {AdminErrors} from "@/modules/wizard/validators.ts";

interface StepAdminProps {
  admin: AdminInput
  onChange: (patch: Partial<AdminInput>) => void
  confirmPassword: string
  onConfirmPasswordChange: (value: string) => void
  errors: AdminErrors
}

export default function StepAdmin({
  admin,
  onChange,
  confirmPassword,
  onConfirmPasswordChange,
  errors,
}: StepAdminProps) {
  return (
    <div>
      <h2 className="h5 fw-semibold mb-1">Compte administrateur</h2>
      <p className="small mb-4" style={{ color: 'var(--pb-text-muted)' }}>
        C&apos;est le compte que vous utiliserez pour vous connecter et administrer Coelbook.
      </p>

      <div className="row g-3 mb-3">
        <div className="col-sm-6">
          <label className="form-label small fw-medium" htmlFor="admin-first-name">
            Prénom
          </label>
          <input
            id="admin-first-name"
            type="text"
            className={`form-control ${errors.firstName ? 'is-invalid' : ''}`}
            autoComplete="given-name"
            value={admin.first_name}
            onChange={(e) => onChange({ first_name: e.target.value })}
          />
          {errors.firstName && <div className="invalid-feedback d-block small">{errors.firstName}</div>}
        </div>
        <div className="col-sm-6">
          <label className="form-label small fw-medium" htmlFor="admin-last-name">
            Nom
          </label>
          <input
            id="admin-last-name"
            type="text"
            className={`form-control ${errors.lastName ? 'is-invalid' : ''}`}
            autoComplete="family-name"
            value={admin.last_name}
            onChange={(e) => onChange({ last_name: e.target.value })}
          />
          {errors.lastName && <div className="invalid-feedback d-block small">{errors.lastName}</div>}
        </div>
      </div>

      <div className="mb-3">
        <label className="form-label small fw-medium" htmlFor="admin-email">
          E-mail
        </label>
        <input
          id="admin-email"
          type="email"
          className={`form-control ${errors.email ? 'is-invalid' : ''}`}
          autoComplete="email"
          value={admin.email}
          onChange={(e) => onChange({ email: e.target.value })}
        />
        {errors.email && <div className="invalid-feedback d-block small">{errors.email}</div>}
      </div>

      <div className="row g-3">
        <div className="col-sm-6">
          <label className="form-label small fw-medium" htmlFor="admin-password">
            Mot de passe
          </label>
          <input
            id="admin-password"
            type="password"
            className={`form-control ${errors.password ? 'is-invalid' : ''}`}
            autoComplete="new-password"
            value={admin.password}
            onChange={(e) => onChange({ password: e.target.value })}
          />
          {errors.password && <div className="invalid-feedback d-block small">{errors.password}</div>}
        </div>
        <div className="col-sm-6">
          <label className="form-label small fw-medium" htmlFor="admin-confirm-password">
            Confirmer le mot de passe
          </label>
          <input
            id="admin-confirm-password"
            type="password"
            className={`form-control ${errors.confirmPassword ? 'is-invalid' : ''}`}
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(e) => onConfirmPasswordChange(e.target.value)}
          />
          {errors.confirmPassword && (
            <div className="invalid-feedback d-block small">{errors.confirmPassword}</div>
          )}
        </div>
      </div>
    </div>
  )
}