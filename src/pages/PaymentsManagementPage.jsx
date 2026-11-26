import { useState, useEffect } from 'react'
import UiIcon from '../components/UiIcon'
import { formatCurrency } from '../utils/formatters'
import { fetchPayments, recordPayment, fetchReceipt } from '../services/financialService'
import ReceiptModal from '../components/ReceiptModal'

export default function PaymentsManagementPage({
  selectedMonth,
  users = [],
  preselectedMember = null,
  canEdit = true,
  onPaymentSaved,
}) {
  const [year, monthStr] = selectedMonth.split('-')
  const month = parseInt(monthStr, 10)

  const [payments, setPayments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Payment Record Modal state
  const [showPaymentModal, setShowPaymentModal] = useState(Boolean(preselectedMember))
  const [selectedResidentId, setSelectedResidentId] = useState(preselectedMember?.residentId || '')
  const [paymentAmount, setPaymentAmount] = useState(preselectedMember?.remainingBalance ? String(preselectedMember.remainingBalance) : '')
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().slice(0, 10))
  const [paymentMethod, setPaymentMethod] = useState('cash')
  const [paymentReference, setPaymentReference] = useState('')
  const [paymentNotes, setPaymentNotes] = useState('')
  const [savingPayment, setSavingPayment] = useState(false)

  // Receipt Modal state
  const [activeReceipt, setActiveReceipt] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')

  async function loadPayments() {
    setLoading(true)
    setError('')
    try {
      const data = await fetchPayments(year, month)
      setPayments(data)
    } catch (err) {
      setError(err.message || 'Failed to load payments.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadPayments()
  }, [selectedMonth])

  useEffect(() => {
    if (preselectedMember) {
      setSelectedResidentId(preselectedMember.residentId)
      setPaymentAmount(preselectedMember.remainingBalance ? String(preselectedMember.remainingBalance) : '')
      setShowPaymentModal(true)
    }
  }, [preselectedMember])

  async function handleRecordPaymentSubmit(e) {
    e.preventDefault()
    if (!selectedResidentId) {
      setError('Please select a member.')
      return
    }
    const amt = parseFloat(paymentAmount)
    if (isNaN(amt) || amt <= 0) {
      setError('Please enter a valid payment amount.')
      return
    }

    setSavingPayment(true)
    setError('')
    try {
      const result = await recordPayment({
        residentId: selectedResidentId,
        month,
        year: Number(year),
        amount: amt,
        method: paymentMethod,
        reference: paymentReference,
        notes: paymentNotes,
        paymentDate,
      })

      setSuccess(`Payment of Rs. ${amt.toLocaleString()} recorded successfully!`)
      setShowPaymentModal(false)
      // Open receipt immediately!
      setActiveReceipt(result.payment)
      setPaymentAmount('')
      setPaymentReference('')
      setPaymentNotes('')
      await loadPayments()
      if (onPaymentSaved) onPaymentSaved()
    } catch (err) {
      setError(err.message || 'Could not record payment.')
    } finally {
      setSavingPayment(false)
    }
  }

  async function handleViewReceipt(paymentId) {
    try {
      const r = await fetchReceipt(paymentId)
      setActiveReceipt(r)
    } catch (err) {
      setError(err.message)
    }
  }

  const filteredPayments = payments.filter((p) => {
    if (!searchQuery.trim()) return true
    const q = searchQuery.toLowerCase()
    return (
      p.memberName.toLowerCase().includes(q) ||
      (p.receiptNumber && p.receiptNumber.toLowerCase().includes(q)) ||
      (p.reference && p.reference.toLowerCase().includes(q))
    )
  })

  const totalCollectedThisMonth = payments.reduce((sum, p) => sum + p.amount, 0)

  const monthLabel = new Intl.DateTimeFormat('en-US', {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(Date.UTC(Number(year), month - 1, 1)))

  return (
    <div className="payments-management-page">
      {/* Header */}
      <div className="page-header-flex">
        <div>
          <h1 className="page-title">Recorded Payments & Receipts</h1>
          <p className="page-subtitle">
            Record partial or full member payments for <strong>{monthLabel}</strong>, generate official receipts, and audit transactions.
          </p>
        </div>
        {canEdit && (
          <button
            type="button"
            className="primary-button"
            onClick={() => {
              setSelectedResidentId(users[0]?.id || '')
              setPaymentAmount('')
              setShowPaymentModal(true)
            }}
          >
            <UiIcon name="plus" /> Record Payment
          </button>
        )}
      </div>

      {error && <div className="app-alert app-alert--error">{error}</div>}
      {success && <div className="app-alert app-alert--success">{success}</div>}

      {/* Summary Chips */}
      <div className="balances-metrics-grid">
        <div className="metric-card">
          <span className="metric-card__label">Total Collected ({monthLabel})</span>
          <strong className="metric-card__value is-success">{formatCurrency(totalCollectedThisMonth)}</strong>
          <span className="metric-card__hint">{payments.length} transactions recorded</span>
        </div>
        <div className="metric-card">
          <span className="metric-card__label">Cash Payments</span>
          <strong className="metric-card__value">
            {formatCurrency(payments.filter((p) => p.method === 'cash').reduce((s, p) => s + p.amount, 0))}
          </strong>
          <span className="metric-card__hint">In-hand collection</span>
        </div>
        <div className="metric-card">
          <span className="metric-card__label">Bank & Online Transfers</span>
          <strong className="metric-card__value is-indigo">
            {formatCurrency(payments.filter((p) => p.method !== 'cash').reduce((s, p) => s + p.amount, 0))}
          </strong>
          <span className="metric-card__hint">Direct deposits</span>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="card-panel mt-6">
        <div className="table-filter-bar">
          <div className="search-box">
            <UiIcon name="search" />
            <input
              type="text"
              placeholder="Search by member, receipt #, or reference..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="table-search-input"
            />
          </div>
        </div>

        {loading ? (
          <div className="empty-state">Loading payment transactions...</div>
        ) : filteredPayments.length === 0 ? (
          <div className="empty-state">
            <p>No payments recorded for {monthLabel} yet.</p>
            {canEdit && (
              <button
                type="button"
                className="primary-button mt-4"
                onClick={() => setShowPaymentModal(true)}
              >
                Record First Payment
              </button>
            )}
          </div>
        ) : (
          <div className="table-responsive">
            <table className="modern-table">
              <thead>
                <tr>
                  <th>Receipt #</th>
                  <th>Date</th>
                  <th>Member Name</th>
                  <th>Room</th>
                  <th>Amount</th>
                  <th>Method</th>
                  <th>Reference</th>
                  <th>Notes</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredPayments.map((p) => (
                  <tr key={p.id}>
                    <td>
                      <span className="receipt-tag">{p.receiptNumber}</span>
                    </td>
                    <td>{new Date(p.paidDate).toLocaleDateString('en-GB')}</td>
                    <td><strong>{p.memberName}</strong></td>
                    <td>{p.roomNumber ? `Room ${p.roomNumber}` : '—'}</td>
                    <td><strong className="text-success">{formatCurrency(p.amount)}</strong></td>
                    <td>
                      <span className="method-pill">{p.method.replace('_', ' ')}</span>
                    </td>
                    <td><small>{p.reference || '—'}</small></td>
                    <td><small className="text-muted">{p.notes || '—'}</small></td>
                    <td>
                      <button
                        type="button"
                        className="table-link-btn"
                        onClick={() => handleViewReceipt(p.id)}
                      >
                        📄 View Receipt
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* RECORD PAYMENT MODAL */}
      {showPaymentModal && (
        <div className="receipt-modal-backdrop" onClick={() => setShowPaymentModal(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-card-header">
              <h3>Record Member Payment</h3>
              <button
                className="receipt-close-btn"
                type="button"
                onClick={() => setShowPaymentModal(false)}
              >
                <UiIcon name="close" />
              </button>
            </div>

            <form onSubmit={handleRecordPaymentSubmit} className="modal-form">
              <div className="form-group">
                <label>Select Boarding Member *</label>
                <select
                  value={selectedResidentId}
                  onChange={(e) => setSelectedResidentId(e.target.value)}
                  className="form-input"
                  required
                >
                  <option value="">-- Choose Member --</option>
                  {users.filter((u) => u.status === 'active').map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.fullName} {u.roomNumber ? `(Room ${u.roomNumber})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Payment Amount (LKR) *</label>
                <input
                  type="number"
                  min="1"
                  step="0.01"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  placeholder="e.g. 5000"
                  className="form-input"
                  required
                />
                <small className="text-muted">Partial payments are supported and preserved.</small>
              </div>

              <div className="form-row-2">
                <div className="form-group">
                  <label>Payment Date *</label>
                  <input
                    type="date"
                    value={paymentDate}
                    onChange={(e) => setPaymentDate(e.target.value)}
                    className="form-input"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Payment Method *</label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="form-input"
                    required
                  >
                    <option value="cash">Cash</option>
                    <option value="bank_transfer">Bank Transfer</option>
                    <option value="online">Online Payment</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>Payment Reference / Bank Slip No (Optional)</label>
                <input
                  type="text"
                  value={paymentReference}
                  onChange={(e) => setPaymentReference(e.target.value)}
                  placeholder="e.g. BOK-REF-99218"
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label>Payment Note (Optional)</label>
                <input
                  type="text"
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                  placeholder="e.g. Settle water and electricity portion"
                  className="form-input"
                />
              </div>

              <div className="modal-card-footer">
                <button
                  type="button"
                  className="ghost-button"
                  onClick={() => setShowPaymentModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="primary-button" disabled={savingPayment}>
                  {savingPayment ? 'Recording...' : 'Record Payment & Generate Receipt'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* RECEIPT MODAL */}
      {activeReceipt && (
        <ReceiptModal receipt={activeReceipt} onClose={() => setActiveReceipt(null)} />
      )}
    </div>
  )
}
