import type {InstanceInput} from "@/modules/wizard/api.ts";
import type {InstanceErrors} from "@/modules/wizard/validators.ts";
import {LOCALES, timezoneOptions} from "@/modules/wizard/options.ts";


interface StepInstanceProps {
  instance: InstanceInput
  onChange: (patch: Partial<InstanceInput>) => void
  errors: InstanceErrors
}

export default function StepInstance({ instance, onChange, errors }: StepInstanceProps) {
  return (
    <div>
      <h2 className="h5 fw-semibold mb-1">Configuration de l&apos;instance</h2>
      <p className="small mb-4" style={{ color: 'var(--pb-text-muted)' }}>
        Les informations de base de cette instance Coelbook.
      </p>

      <div className="mb-3">
        <label className="form-label small fw-medium" htmlFor="instance-name">
          Nom de l&apos;instance
        </label>
        <input
          id="instance-name"
          type="text"
          className={`form-control ${errors.name ? 'is-invalid' : ''}`}
          placeholder="ex. Acme Engineering"
          value={instance.name}
          onChange={(e) => onChange({ name: e.target.value })}
        />
        {errors.name && <div className="invalid-feedback d-block small">{errors.name}</div>}
      </div>

      <div className="row g-3">
        <div className="col-sm-7">
          <label className="form-label small fw-medium" htmlFor="instance-timezone">
            Fuseau horaire
          </label>
          <select
            id="instance-timezone"
            className={`form-select ${errors.timezone ? 'is-invalid' : ''}`}
            value={instance.timezone}
            onChange={(e) => onChange({ timezone: e.target.value })}
          >
            {timezoneOptions(instance.timezone).map((tz) => (
              <option key={tz} value={tz}>
                {tz}
              </option>
            ))}
          </select>
          {errors.timezone && <div className="invalid-feedback d-block small">{errors.timezone}</div>}
        </div>
        <div className="col-sm-5">
          <label className="form-label small fw-medium" htmlFor="instance-locale">
            Langue
          </label>
          <select
            id="instance-locale"
            className="form-select"
            value={instance.locale}
            onChange={(e) => onChange({ locale: e.target.value })}
          >
            {LOCALES.map((locale) => (
              <option key={locale.value} value={locale.value}>
                {locale.label}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  )
}