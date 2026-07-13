export default function Sheet({ open, title, onClose, children }) {
  if (!open) return null

  return (
    <div className="sheet-backdrop" onClick={onClose} role="presentation">
      <div className="sheet" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <div className="sheet-handle" />
        <div className="sheet-head">
          <h3>{title}</h3>
          <button type="button" className="btn-ghost" onClick={onClose}>
            Chiudi
          </button>
        </div>
        <div className="sheet-body">{children}</div>
      </div>
    </div>
  )
}
