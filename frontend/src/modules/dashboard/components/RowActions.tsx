interface RowActionsProps {
  // label names the row in screen-reader labels, e.g. "le snippet 2".
  label: string
  isFirst: boolean
  isLast: boolean
  onMoveUp: () => void
  onMoveDown: () => void
  onRemove: () => void
}

// RowActions renders the move up / move down / remove buttons of an
// editable list row.
export default function RowActions({ label, isFirst, isLast, onMoveUp, onMoveDown, onRemove }: RowActionsProps) {
  return (
    <div className="d-flex gap-1 flex-shrink-0">
      <button
        type="button"
        className="btn btn-sm btn-outline-secondary border-0"
        onClick={onMoveUp}
        disabled={isFirst}
        aria-label={`Monter ${label}`}
        title="Monter"
      >
        <i className="fa-solid fa-arrow-up" style={{ fontSize: '0.7rem' }}></i>
      </button>
      <button
        type="button"
        className="btn btn-sm btn-outline-secondary border-0"
        onClick={onMoveDown}
        disabled={isLast}
        aria-label={`Descendre ${label}`}
        title="Descendre"
      >
        <i className="fa-solid fa-arrow-down" style={{ fontSize: '0.7rem' }}></i>
      </button>
      <button
        type="button"
        className="btn btn-sm btn-outline-danger border-0"
        onClick={onRemove}
        aria-label={`Supprimer ${label}`}
        title="Supprimer"
      >
        <i className="fa-solid fa-trash-can" style={{ fontSize: '0.7rem' }}></i>
      </button>
    </div>
  )
}
