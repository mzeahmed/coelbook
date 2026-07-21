export default function StepWelcome() {
  return (
    <div className="text-center py-3">
      <div className="d-inline-flex align-items-center justify-content-center rounded-3 mb-4 pb-brand-mark">
        <i className="fa-solid fa-book-bookmark text-white" style={{ fontSize: '1.1rem' }}></i>
      </div>

      <h1 className="h4 fw-bold mb-2">Welcome to Coelbook</h1>
      <p className="small mb-0" style={{ color: 'var(--pb-text-muted)' }}>
        Let's set up your instance. You'll create the administrator account and
        configure a few instance settings — it only takes a minute.
      </p>
    </div>
  )
}