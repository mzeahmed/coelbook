import type {AdminInput, InstanceInput} from "@/modules/wizard/api.ts";

interface StepFinishProps {
  admin: AdminInput
  instance: InstanceInput
}

export default function StepFinish({ admin, instance }: StepFinishProps) {
  return (
    <div>
      <h2 className="h5 fw-semibold mb-1">Récapitulatif</h2>
      <p className="small mb-4" style={{ color: 'var(--pb-text-muted)' }}>
        Vérifiez que tout est correct, puis terminez l&apos;installation.
      </p>

      <div className="pb-surface border rounded-3 p-3 mb-3">
        <p
          className="text-uppercase fw-semibold mb-2"
          style={{ fontSize: '0.625rem', letterSpacing: '0.08em', color: 'var(--pb-text-muted)' }}
        >
          Administrateur
        </p>
        <div className="d-flex justify-content-between small mb-1">
          <span style={{ color: 'var(--pb-text-muted)' }}>Nom</span>
          <span className="fw-medium">
            {admin.first_name} {admin.last_name}
          </span>
        </div>
        <div className="d-flex justify-content-between small">
          <span style={{ color: 'var(--pb-text-muted)' }}>E-mail</span>
          <span className="fw-medium">{admin.email}</span>
        </div>
      </div>

      <div className="pb-surface border rounded-3 p-3">
        <p
          className="text-uppercase fw-semibold mb-2"
          style={{ fontSize: '0.625rem', letterSpacing: '0.08em', color: 'var(--pb-text-muted)' }}
        >
          Instance
        </p>
        <div className="d-flex justify-content-between small mb-1">
          <span style={{ color: 'var(--pb-text-muted)' }}>Nom</span>
          <span className="fw-medium">{instance.name}</span>
        </div>
        <div className="d-flex justify-content-between small mb-1">
          <span style={{ color: 'var(--pb-text-muted)' }}>Fuseau horaire</span>
          <span className="fw-medium font-mono" style={{ fontSize: '0.75rem' }}>
            {instance.timezone}
          </span>
        </div>
        <div className="d-flex justify-content-between small">
          <span style={{ color: 'var(--pb-text-muted)' }}>Langue</span>
          <span className="fw-medium">{instance.locale}</span>
        </div>
      </div>
    </div>
  )
}