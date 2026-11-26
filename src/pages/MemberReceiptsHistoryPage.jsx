import { useState, useEffect } from 'react'
import UiIcon from '../components/UiIcon'
import { formatCurrency } from '../utils/formatters'
import { fetchMemberDashboard, fetchMemberReceipt } from '../services/memberService'
import ReceiptModal from '../components/ReceiptModal'

export default function MemberReceiptsHistoryPage({ selectedMonth, onNavigate }) {
  const [year, monthStr] = selectedMonth.split('-')
  const month = parseInt(monthStr, 10)

  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [activeReceipt, setActiveReceipt] = useState(null)

  async function loadData() {
    setLoading(true)
    setError('')
    try {
      const result = await fetchMemberDashboard(year, month)
      setData(result)
    } catch (err) {
      setError(err.message || 'Failed to load receipts & payment history.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [selectedMonth])

  async function handleOpenReceipt(paymentId) {
    try {
      const r = await fetchMemberReceipt(paymentId)
      setActiveReceipt(r)
    } catch (err) {
      setError(err.message || 'Failed to open receipt details.')
    }
  }

  const monthLabel = new Intl.DateTimeFormat('en-US', {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(Date.UTC(Number(year), month - 1, 1)))

  if (loading) {
    return (
      <div className="card-panel">
        <div className="empty-state">Loading your receipts and payment history...</div>
      </div>
    )
  }

  if (error) {
    return <div className="app-alert app-alert--error">{error}</div>
  }

  if (!data) return null

  const { member, summary, paymentHistory = [], monthHistory = [] } = data

  // All time total paid by this member
  const totalPaidAllTime = paymentHistory.reduce((sum, p) => sum + (p.amount || 0), 0)

  // Filter payment history by search query
  const filteredPayments = paymentHistory.filter((p) => {
    if (!searchQuery.trim()) return true
    const q = searchQuery.toLowerCase()
    return (
      (p.receiptNumber && p.receiptNumber.toLowerCase().includes(q)) ||
      (p.method && p.method.toLowerCase().includes(q)) ||
      (p.reference && p.reference.toLowerCase().includes(q)) ||
      (p.notes && p.notes.toLowerCase().includes(q)) ||
      (p.paidDate && String(p.paidDate).toLowerCase().includes(q))
    )
  })

  return (
    <div className="member-dashboard-page">
      {/* Page Header */}
      <div className="page-header-flex">
        <div>
          <h1 className="page-title">My Receipts & Payment History</h1>
          <p className="page-subtitle">
            Complete record of settled payments, pending balances to be settled, and official verified paper receipts.
          </p>
        </div>
      </div>

      {/* Top 4 Financial Metric Cards */}
      <div className="balances-metrics-grid">
        <div className="metric-card">
          <span className="metric-card__label">Total Settled to Date</span>
          <strong className="metric-card__value is-success">
            {formatCurrency(totalPaidAllTime)}
          </strong>
          <span className="metric-card__hint">Across all recorded payments</span>
        </div>

        <div className="metric-card">
          <span className="metric-card__label">Current Due ({monthLabel})</span>
          <strong className="metric-card__value is-indigo">
            {formatCurrency(summary.totalAmountDue)}
          </strong>
          <span className="metric-card__hint">New charges + carried arrears</span>
        </div>

        <div className="metric-card">
          <span className="metric-card__label">Remaining Balance to Pay</span>
          <strong
            className={`metric-card__value ${
              summary.remainingBalance > 0 ? 'is-danger' : 'is-success'
            }`}
          >
            {formatCurrency(summary.remainingBalance)}
          </strong>
          <span className="metric-card__hint">
            {summary.remainingBalance > 0 ? 'Pending settlement' : 'Fully paid'}
          </span>
        </div>

        <div className="metric-card">
          <span className="metric-card__label">Payment Status</span>
          <strong
            className={`metric-card__value ${
              summary.paymentStatus === 'Paid'
                ? 'is-success'
                : summary.paymentStatus === 'Partially Paid'
                ? 'is-primary'
                : 'is-danger'
            }`}
          >
            {summary.paymentStatus}
          </strong>
          <span className="metric-card__hint">Status for {monthLabel}</span>
        </div>
      </div>

      {/* Pending Payment Guidance Card ("karanna thiyena payment") */}
      {summary.remainingBalance > 0 ? (
        <div className="delivery-status-banner is-warning">
          <div className="delivery-banner-icon">💳</div>
          <div className="delivery-banner-content" style={{ flex: 1 }}>
            <h4>Pending Payment Settlement for {monthLabel}: {formatCurrency(summary.remainingBalance)}</h4>
            <p>
              Your account has an outstanding balance of <strong>{formatCurrency(summary.remainingBalance)}</strong> (Total Due: {formatCurrency(summary.totalAmountDue)}, Paid: {formatCurrency(summary.totalPaid)}).
              Please settle via cash or bank deposit to the administrator.
            </p>
          </div>
          <button
            type="button"
            className="action-btn-wa"
            style={{ padding: '8px 16px', fontSize: '0.82rem', whiteSpace: 'nowrap' }}
            onClick={() => {
              const msg = `Hello Administrator,\n\nI am sending payment details for my boarding bill of ${monthLabel} (Member: ${member.name}, Room: ${member.roomNumber || 'N/A'}, Remaining: Rs. ${summary.remainingBalance.toLocaleString()}).`
              window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank')
            }}
          >
            💬 Send Slip via WhatsApp
          </button>
        </div>
      ) : (
        <div className="delivery-status-banner is-ready">
          <div className="delivery-banner-icon">✅</div>
          <div className="delivery-banner-content">
            <h4>All Boarding Dues Settled for {monthLabel}</h4>
            <p>
              Your account is fully up to date with zero remaining balance. You can view, print, or download your official payment receipts below.
            </p>
          </div>
        </div>
      )}

      {/* Main Payment History Table Card ("me dakwa payment karapu ewa") */}
      <div className="card-panel">
        <div className="card-panel-header">
          <div>
            <h3>All Settled Payments & Official Receipts ({paymentHistory.length})</h3>
            <p className="panel-subtext">
              View every verified payment transaction and access official paper receipts.
            </p>
          </div>
        </div>

        {/* Search Toolbar */}
        <div className="table-filter-bar">
          <div className="search-box">
            <UiIcon name="search" />
            <input
              type="text"
              placeholder="Search receipts by number, payment method, or notes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="table-search-input"
            />
          </div>

          <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
            Showing <strong>{filteredPayments.length}</strong> of <strong>{paymentHistory.length}</strong> payments
          </span>
        </div>

        {filteredPayments.length === 0 ? (
          <div className="empty-state" style={{ padding: '36px 16px' }}>
            <div style={{ fontSize: '2rem', marginBottom: '8px' }}>📄</div>
            <strong>No payments found</strong>
            <p style={{ color: '#64748b', fontSize: '0.85rem', marginTop: '4px' }}>
              {searchQuery ? 'No payment receipts match your search filter.' : 'No verified payments have been recorded yet.'}
            </p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="modern-table modern-table--compact">
              <thead>
                <tr>
                  <th style={{ width: '22%' }}>Receipt Number</th>
                  <th style={{ width: '18%' }}>Payment Date</th>
                  <th style={{ width: '15%' }}>Billing Period</th>
                  <th style={{ width: '15%' }}>Method</th>
                  <th style={{ width: '18%', textAlign: 'right' }}>Amount Settled</th>
                  <th style={{ width: '12%', textAlign: 'center' }}>Official Receipt</th>
                </tr>
              </thead>
              <tbody>
                {filteredPayments.map((p) => {
                  const pDate = p.paidDate
                    ? new Date(p.paidDate).toLocaleDateString('en-GB', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })
                    : '—'

                  const periodLabel = p.month && p.year
                    ? new Intl.DateTimeFormat('en-US', { month: 'short', year: 'numeric', timeZone: 'UTC' })
                        .format(new Date(Date.UTC(p.year, p.month - 1, 1)))
                    : '—'

                  return (
                    <tr key={p.id}>
                      <td>
                        <span className="receipt-tag" style={{ fontSize: '0.82rem' }}>
                          {p.receiptNumber}
                        </span>
                      </td>
                      <td>
                        <span style={{ color: '#334155', fontWeight: 600 }}>{pDate}</span>
                      </td>
                      <td>
                        <span className="room-badge-chip">{periodLabel}</span>
                      </td>
                      <td>
                        <span className="method-pill">{p.method ? p.method.replace('_', ' ') : 'Cash'}</span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <strong className="text-success" style={{ fontSize: '0.92rem' }}>
                          {formatCurrency(p.amount)}
                        </strong>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <button
                          type="button"
                          className="action-btn-view"
                          onClick={() => handleOpenReceipt(p.id)}
                          title="Open official paper receipt"
                        >
                          📄 View Receipt
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Historical Months Summary Card */}
      <div className="card-panel">
        <div className="card-panel-header">
          <div>
            <h3>Billing & Distribution History Across Months</h3>
            <p className="panel-subtext">Review past billing cycles and your historical distributed charges.</p>
          </div>
        </div>

        {monthHistory.length === 0 ? (
          <div className="empty-state">No historical billing records found.</div>
        ) : (
          <div className="table-responsive">
            <table className="modern-table modern-table--compact">
              <thead>
                <tr>
                  <th>Billing Month</th>
                  <th>Utility Categories Distributed</th>
                  <th style={{ textAlign: 'right' }}>Total Month Charges</th>
                </tr>
              </thead>
              <tbody>
                {monthHistory.map((h) => (
                  <tr key={`${h.year}-${h.month}`}>
                    <td>
                      <strong style={{ color: '#0f172a' }}>{h.monthLabel}</strong>
                    </td>
                    <td>
                      <span className="room-badge-chip">
                        {h.billCount} categories distributed
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <strong className="text-primary">{formatCurrency(h.totalCharges)}</strong>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Official Receipt Modal */}
      {activeReceipt && (
        <ReceiptModal receipt={activeReceipt} onClose={() => setActiveReceipt(null)} />
      )}
    </div>
  )
}
