import { useEffect, useState } from 'react'
import UiIcon from '../components/UiIcon'
import { fetchBalances } from '../services/financialService'
import { formatCurrency } from '../utils/formatters'

const amountFormatter = new Intl.NumberFormat('en-LK', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

function formatAmount(value) {
  return amountFormatter.format(Number(value ?? 0))
}

export default function OutstandingBalancesPage({
  selectedMonth,
  onRecordPayment,
  canEdit = true,
}) {
  const [year, monthStr] = selectedMonth.split('-')
  const month = parseInt(monthStr, 10)

  const [balances, setBalances] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [selectedMemberBreakdown, setSelectedMemberBreakdown] = useState(null)

  async function loadBalances() {
    setLoading(true)
    setError('')
    try {
      const data = await fetchBalances(year, month)
      setBalances(data)
    } catch (err) {
      setError(err.message || 'Failed to fetch outstanding balances.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadBalances()
  }, [selectedMonth])

  // Show active boarding members only
  const activeBalances = balances.filter((m) => m.status === 'active')

  const filteredBalances = activeBalances
    .filter((member) => {
      if (statusFilter !== 'all' && member.paymentStatus.toLowerCase() !== statusFilter.toLowerCase()) {
        return false
      }
      if (!searchQuery.trim()) return true
      const q = searchQuery.toLowerCase()
      return (
        member.name.toLowerCase().includes(q) ||
        member.roomNumber.toLowerCase().includes(q) ||
        member.phone.toLowerCase().includes(q)
      )
    })
    .sort((a, b) => b.remainingBalance - a.remainingBalance)

  // Totals (Active members only)
  const totalBilled = activeBalances.reduce((sum, m) => sum + m.totalNewCharges, 0)
  const totalDiscount = activeBalances.reduce((sum, m) => sum + (m.discount || 0), 0)
  const totalDue = activeBalances.reduce((sum, m) => sum + m.totalAmountDue, 0)
  const totalCollected = activeBalances.reduce((sum, m) => sum + m.totalPaidAmount, 0)
  const totalOutstanding = activeBalances.reduce((sum, m) => sum + m.remainingBalance, 0)

  const monthLabel = new Intl.DateTimeFormat('en-US', {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(Date.UTC(Number(year), month - 1, 1)))

  function openWhatsAppForMember(member) {
    const cleanPhone = member.phone.replace(/\D/g, '')
    const gross = member.grossAmount ?? (member.totalNewCharges + member.previousOutstanding)
    const discountText = member.discount > 0 ? `\nDiscount: -Rs. ${member.discount.toLocaleString()}` : ''
    const msg = `Hello ${member.name},\n\nYour boarding bill for ${monthLabel}:\nTotal Charges: Rs. ${gross.toLocaleString()}${discountText}\nFinal Amount to Pay: Rs. ${member.totalAmountDue.toLocaleString()}\nPaid: Rs. ${member.totalPaidAmount.toLocaleString()}\nRemaining Balance: Rs. ${member.remainingBalance.toLocaleString()}\n\nPlease settle your outstanding balance.\nThank you!`
    const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`
    window.open(url, '_blank')
  }

  return (
    <div className="outstanding-balances-page">
      {/* Header */}
      <div className="page-header-flex">
        <div>
          <h1 className="page-title">Individual Member Outstanding Balances</h1>
          <p className="page-subtitle">
            Complete member-wise charges breakdown, previous arrears, payments, and remaining balances for <strong>{monthLabel}</strong>.
          </p>
        </div>
      </div>

      {error && <div className="app-alert app-alert--error">{error}</div>}

      {/* Top Summary Stat Grid */}
      <div className="balances-metrics-grid">
        <div className="metric-card">
          <span className="metric-card__label">New Charges ({monthLabel})</span>
          <strong className="metric-card__value is-primary">{formatCurrency(totalBilled)}</strong>
          <span className="metric-card__hint">Total of all 5 bill categories</span>
        </div>
        <div className="metric-card">
          <span className="metric-card__label">Monthly Member Discount</span>
          <strong className="metric-card__value is-success">{formatCurrency(totalDiscount)}</strong>
          <span className="metric-card__hint">Deducted from member totals</span>
        </div>
        <div className="metric-card">
          <span className="metric-card__label">Final Amount Due</span>
          <strong className="metric-card__value is-indigo">{formatCurrency(totalDue)}</strong>
          <span className="metric-card__hint">Net payable across all members</span>
        </div>
        <div className="metric-card">
          <span className="metric-card__label">Total Amount Collected</span>
          <strong className="metric-card__value is-success">{formatCurrency(totalCollected)}</strong>
          <span className="metric-card__hint">
            {totalDue > 0 ? Math.round((totalCollected / totalDue) * 100) : 0}% collection rate
          </span>
        </div>
        <div className="metric-card">
          <span className="metric-card__label">Remaining Outstanding</span>
          <strong className="metric-card__value is-danger">{formatCurrency(totalOutstanding)}</strong>
          <span className="metric-card__hint">Unsettled boarding balance</span>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="card-panel mt-6">
        <div className="table-filter-bar">
          <div className="search-box">
            <UiIcon name="search" />
            <input
              type="text"
              placeholder="Search by member name, room, or phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="table-search-input"
            />
          </div>

          <div className="filter-group">
            <label>Status:</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="filter-select"
            >
              <option value="all">All Statuses</option>
              <option value="unpaid">Unpaid</option>
              <option value="partially paid">Partially Paid</option>
              <option value="paid">Paid</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="empty-state">Loading financial records...</div>
        ) : filteredBalances.length === 0 ? (
          <div className="empty-state">No matching members found.</div>
        ) : (
          <div className="table-responsive">
            <table className="modern-table modern-table--compact">
              <thead>
                <tr>
                  <th style={{ width: '17%' }}>Member & Room</th>
                  <th style={{ width: '10%', textAlign: 'right' }}>Prev. Arrears</th>
                  <th style={{ width: '10%', textAlign: 'right' }}>New Total</th>
                  <th style={{ width: '10%', textAlign: 'right', color: '#16a34a' }}>Discount</th>
                  <th style={{ width: '10%', textAlign: 'right', color: '#2563eb' }}>Final Due</th>
                  <th style={{ width: '10%', textAlign: 'right' }}>Paid</th>
                  <th style={{ width: '10%', textAlign: 'right' }}>Remaining</th>
                  <th style={{ width: '10%', textAlign: 'right' }}>Status</th>
                  <th style={{ width: '13%', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredBalances.map((m) => {
                  const statusClass =
                    m.paymentStatus === 'Paid'
                      ? 'paid'
                      : m.paymentStatus === 'Partially Paid'
                        ? 'partial'
                        : 'pending'

                  const initials = m.name
                    ? m.name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase()
                    : 'M'

                  return (
                    <tr key={m.residentId} className={m.remainingBalance > 0 ? 'row-owing' : ''}>
                      <td>
                        <div className="table-member-cell">
                          <div className="table-avatar-chip">{initials}</div>
                          <div className="table-member-info">
                            <strong className="table-member-name">{m.name}</strong>
                            <div className="table-member-subline">
                              <span className="room-badge-chip">
                                {m.roomNumber ? `Room ${m.roomNumber}` : 'No Room'}
                              </span>
                              {/* <span className="member-phone-text">{m.phone}</span> */}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <span className={m.previousOutstanding > 0 ? 'text-danger font-medium' : m.previousOutstanding < 0 ? 'text-success font-medium' : 'text-muted'}>
                          {formatAmount(m.previousOutstanding)}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <strong>{formatAmount(m.totalNewCharges)}</strong>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        {m.discount > 0 ? (
                          <span className="text-success font-medium" style={{ fontWeight: 600 }}>
                            - {formatAmount(m.discount)}
                          </span>
                        ) : (
                          <span className="text-muted">—</span>
                        )}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <strong className="text-primary">{formatAmount(m.totalAmountDue)}</strong>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <span className="text-success">{formatAmount(m.totalPaidAmount)}</span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <strong className={m.remainingBalance > 0 ? 'text-danger highlight-due' : m.remainingBalance < 0 ? 'text-success font-medium' : 'text-muted'}>
                          {formatAmount(m.remainingBalance)}
                        </strong>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <span className={`status-pill ${statusClass}` }>{m.paymentStatus}</span>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <div className="table-actions-row" style={{ justifyContent: 'right' }}>
                          <button
                            type="button"
                            className="action-btn-view"
                            title="View category bill breakdown"
                            onClick={() => setSelectedMemberBreakdown(m)}
                          >
                            View
                          </button>
                          {canEdit && m.remainingBalance > 0 && (
                            <button
                              type="button"
                              className="action-btn-pay"
                              title="Record payment for this member"
                              onClick={() => onRecordPayment(m)}
                            >
                              Pay
                            </button>
                          )}
                          <button
                            type="button"
                            className="action-btn-wa"
                            title="Send notice via WhatsApp"
                            onClick={() => openWhatsAppForMember(m)}
                          >
                            WA
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* CATEGORY CHARGES BREAKDOWN VIEW MODAL */}
      {selectedMemberBreakdown && (
        <div
          className="receipt-modal-backdrop"
          onClick={() => setSelectedMemberBreakdown(null)}
        >
          <div
            className="modal-card modal-card--breakdown"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-card-header">
              <div className="modal-header-member">
                <div className="table-avatar-chip is-large">
                  {selectedMemberBreakdown.name
                    ? selectedMemberBreakdown.name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase()
                    : 'M'}
                </div>
                <div>
                  <h3>{selectedMemberBreakdown.name}</h3>
                  <p className="modal-subtitle">
                    {selectedMemberBreakdown.roomNumber ? `Room ${selectedMemberBreakdown.roomNumber} · ` : ''}
                    {selectedMemberBreakdown.phone} · <strong>{monthLabel}</strong>
                  </p>
                </div>
              </div>
              <button
                type="button"
                className="receipt-close-btn"
                onClick={() => setSelectedMemberBreakdown(null)}
                aria-label="Close"
              >
                <UiIcon name="close" />
              </button>
            </div>

            <div className="breakdown-modal-body">
              {/* Category Breakdown: The 5 Categories */}
              <h4 className="breakdown-section-title">5 Bill Categories Breakdown</h4>
              <div className="breakdown-categories-grid">
                <div className="breakdown-cat-item">
                  <div className="breakdown-cat-header">
                    <span className="breakdown-cat-icon">⚡</span>
                    <span className="breakdown-cat-name">Electricity</span>
                  </div>
                  <strong className="breakdown-cat-amount">
                    {formatCurrency(selectedMemberBreakdown.charges.electricity)}
                  </strong>
                </div>

                <div className="breakdown-cat-item">
                  <div className="breakdown-cat-header">
                    <span className="breakdown-cat-icon">💧</span>
                    <span className="breakdown-cat-name">Water</span>
                  </div>
                  <strong className="breakdown-cat-amount">
                    {formatCurrency(selectedMemberBreakdown.charges.water)}
                  </strong>
                </div>

                <div className="breakdown-cat-item">
                  <div className="breakdown-cat-header">
                    <span className="breakdown-cat-icon">📶</span>
                    <span className="breakdown-cat-name">Telecom</span>
                  </div>
                  <strong className="breakdown-cat-amount">
                    {formatCurrency(selectedMemberBreakdown.charges.telecom)}
                  </strong>
                </div>

                <div className="breakdown-cat-item">
                  <div className="breakdown-cat-header">
                    <span className="breakdown-cat-icon">🍽️</span>
                    <span className="breakdown-cat-name">Restaurant</span>
                  </div>
                  <strong className="breakdown-cat-amount">
                    {formatCurrency(selectedMemberBreakdown.charges.restaurant)}
                  </strong>
                </div>

                <div className="breakdown-cat-item is-span-full">
                  <div className="breakdown-cat-header">
                    <span className="breakdown-cat-icon">🧾</span>
                    <span className="breakdown-cat-name">Other Expenses</span>
                  </div>
                  <strong className="breakdown-cat-amount">
                    {formatCurrency(selectedMemberBreakdown.charges.other)}
                  </strong>
                </div>
              </div>

              {/* Financial Calculation Summary */}
              <div className="breakdown-summary-card">
                <div className="breakdown-summary-row">
                  <span>New Month Charges:</span>
                  <strong>{formatCurrency(selectedMemberBreakdown.totalNewCharges)}</strong>
                </div>
                <div className="breakdown-summary-row">
                  <span>Previous Arrears (Carried Over):</span>
                  <span className={selectedMemberBreakdown.previousOutstanding > 0 ? 'text-danger font-medium' : 'text-muted'}>
                    {formatCurrency(selectedMemberBreakdown.previousOutstanding)}
                  </span>
                </div>
                {selectedMemberBreakdown.discount > 0 && (
                  <div className="breakdown-summary-row" style={{ color: '#16a34a' }}>
                    <span>Monthly Member Discount:</span>
                    <strong>- {formatCurrency(selectedMemberBreakdown.discount)}</strong>
                  </div>
                )}
                <div className="breakdown-summary-divider" />
                <div className="breakdown-summary-row is-total">
                  <span>Final Amount to Pay:</span>
                  <strong className="text-primary">{formatCurrency(selectedMemberBreakdown.totalAmountDue)}</strong>
                </div>
                <div className="breakdown-summary-row">
                  <span>Total Paid Amount:</span>
                  <strong className="text-success">{formatCurrency(selectedMemberBreakdown.totalPaidAmount)}</strong>
                </div>
                <div className="breakdown-summary-row is-remaining">
                  <span>Remaining Balance:</span>
                  <strong className={selectedMemberBreakdown.remainingBalance > 0 ? 'text-danger highlight-due' : 'text-success'}>
                    {formatCurrency(selectedMemberBreakdown.remainingBalance)}
                  </strong>
                </div>
                <div className="breakdown-summary-row">
                  <span>Payment Status:</span>
                  <span className={`status-pill ${selectedMemberBreakdown.paymentStatus === 'Paid'
                      ? 'paid'
                      : selectedMemberBreakdown.paymentStatus === 'Partially Paid'
                        ? 'partial'
                        : 'pending'
                    }`}>
                    {selectedMemberBreakdown.paymentStatus}
                  </span>
                </div>
              </div>
            </div>

            <div className="modal-card-footer">
              <button
                type="button"
                className="secondary-button"
                onClick={() => setSelectedMemberBreakdown(null)}
              >
                Close
              </button>
              <button
                type="button"
                className="action-btn-wa"
                style={{ height: '38px', padding: '0 14px', borderRadius: '8px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                onClick={() => {
                  openWhatsAppForMember(selectedMemberBreakdown)
                }}
              >
                WhatsApp Notice
              </button>
              {canEdit && selectedMemberBreakdown.remainingBalance > 0 && (
                <button
                  type="button"
                  className="primary-button"
                  onClick={() => {
                    const m = selectedMemberBreakdown
                    setSelectedMemberBreakdown(null)
                    onRecordPayment(m)
                  }}
                >
                  Record Payment
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
