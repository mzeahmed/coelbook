import type { InstanceInput } from '../api'
import type { InstanceErrors } from './validators'

const timezones: string[] =
  typeof Intl.supportedValuesOf === 'function' ? Intl.supportedValuesOf('timeZone') : ['UTC']

const locales = [
  { value: 'en', label: 'English' },
  { value: 'fr', label: 'Français' },
  { value: 'es', label: 'Español' },
  { value: 'de', label: 'Deutsch' },
]

interface StepInstanceProps {
  instance: InstanceInput
  onChange: (patch: Partial<InstanceInput>) => void
  errors: InstanceErrors
}

export default function StepInstance({ instance, onChange, errors }: StepInstanceProps) {
  return (
    <div>
      <h2 className="h5 fw-semibold mb-1">Instance configuration</h2>
      <p className="small mb-4" style={{ color: 'var(--pb-text-muted)' }}>
        Basic details about this Playbook instance.
      </p>

      <div className="mb-3">
        <label className="form-label small fw-medium" htmlFor="instance-name">
          Instance name
        </label>
        <input
          id="instance-name"
          type="text"
          className={`form-control ${errors.name ? 'is-invalid' : ''}`}
          placeholder="e.g. Acme Engineering"
          value={instance.name}
          onChange={(e) => onChange({ name: e.target.value })}
        />
        {errors.name && <div className="invalid-feedback d-block small">{errors.name}</div>}
      </div>

      <div className="row g-3">
        <div className="col-sm-7">
          <label className="form-label small fw-medium" htmlFor="instance-timezone">
            Timezone
          </label>
          <select
            id="instance-timezone"
            className={`form-select ${errors.timezone ? 'is-invalid' : ''}`}
            value={instance.timezone}
            onChange={(e) => onChange({ timezone: e.target.value })}
          >
            {timezones.map((tz) => (
              <option key={tz} value={tz}>
                {tz}
              </option>
            ))}
          </select>
          {errors.timezone && <div className="invalid-feedback d-block small">{errors.timezone}</div>}
        </div>
        <div className="col-sm-5">
          <label className="form-label small fw-medium" htmlFor="instance-locale">
            Locale
          </label>
          <select
            id="instance-locale"
            className="form-select"
            value={instance.locale}
            onChange={(e) => onChange({ locale: e.target.value })}
          >
            {locales.map((locale) => (
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