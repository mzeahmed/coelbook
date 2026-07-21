export default function LoginView() {
  return (
    <div className="pb-wizard-shell d-flex align-items-center justify-content-center p-3">
      <div
        className="pb-card border rounded-4 p-4 p-sm-5 text-center"
        style={{ width: '100%', maxWidth: '24rem' }}
      >
        <div className="d-inline-flex align-items-center justify-content-center rounded-3 mb-4 pb-brand-mark">
          <i className="fa-solid fa-book-bookmark text-white" style={{ fontSize: '1.1rem' }}></i>
        </div>
        <h1 className="h5 fw-bold mb-2">Playbook is ready</h1>
        <p className="small mb-0" style={{ color: 'var(--pb-text-muted)' }}>
          Setup is complete. The login page is coming soon.
        </p>
      </div>
    </div>
  )
}