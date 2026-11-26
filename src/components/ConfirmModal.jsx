function ConfirmModal({ open, title, message, onCancel, onConfirm }) {
  if (!open) return null
  return (
    <div className="modal-backdrop" role="presentation">
      <section className="panel modal-card" role="dialog" aria-modal="true" aria-labelledby="confirm-title">
        <h2 id="confirm-title">{title}</h2>
        <p>{message}</p>
        <div className="payment-actions">
          <button className="ghost-button" type="button" onClick={onCancel}>Cancel</button>
          <button className="primary-button" type="button" onClick={onConfirm}>Confirm</button>
        </div>
      </section>
    </div>
  )
}

export default ConfirmModal
