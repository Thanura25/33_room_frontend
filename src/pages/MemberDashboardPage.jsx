import { useState, useEffect } from 'react'
import UiIcon from '../components/UiIcon'
import { formatCurrency } from '../utils/formatters'
import { fetchMemberDashboard, fetchMemberReceipt } from '../services/memberService'
import ReceiptModal from '../components/ReceiptModal'

function getInitials(name) {
  if (!name) return 'M'
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase()
}

export default function MemberDashboardPage({ selectedMonth, onNavigate }) {
  const [year, monthStr] = selectedMonth.split('-')
  const month = parseInt(monthStr, 10)

  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeReceipt, setActiveReceipt] = useState(null)

  async function loadMemberData() {
    setLoading(true)
    setError('')
    try {
      const result = await fetchMemberDashboard(year, month)
      setData(result)
    } catch (err) {
      setError(err.message || 'Failed to load member dashboard.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadMemberData()
  }, [selectedMonth])

  async function handleOpenReceipt(paymentId) {
    try {
      const r = await fetchMemberReceipt(paymentId)
      setActiveReceipt(r)
    } catch (err) {
      setError(err.message || 'Failed to load receipt details.')
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
        <div className="empty-state">Loading your personal boarding dashboard...</div>
      </div>
    )
  }

  if (error) {
    return <div className="app-alert app-alert--error">{error}</div>
  }

  if (!data) return null

  const { member, summary, categoryBreakdown, paymentHistory, monthHistory } = data

  const categoryIcons = {
    electricity: '⚡',
    water: '💧',
    telecom: '📶',
    restaurant: '🍽️',
    other: '🧾',
  }

  const statusClass =
    summary.paymentStatus === 'Paid'
      ? 'paid'
      : summary.paymentStatus === 'Partially Paid'
      ? 'partial'
      : 'pending'

  return (
    <div className="member-dashboard-page">
      {/* Page Header */}
      <div className="page-header-flex">
        <div>
          <h1 className="page-title">Personal Member Dashboard</h1>
          <p className="page-subtitle">
            Your individual monthly bill summary, room allocation, payment records, and official receipts for <strong>{monthLabel}</strong>.
          </p>
        </div>
      </div>

      {/* Member Profile Welcome Card */}
      <div className="member-profile-card">
        <div className="member-profile-card__content">
          <div className="table-avatar-chip is-large" aria-hidden="true">
            {getInitials(member.name)}
          </div>
          <div>
            <h2 className="member-profile-card__name">Welcome back, {member.name}!</h2>
            <div className="member-profile-card__subline">
              <span className="room-badge-chip">
                {member.roomNumber ? `Room ${member.roomNumber}` : 'Room Unassigned'}
              </span>
              <span className="member-phone-text">📞 {member.phone || 'No phone registered'}</span>
              {member.email && (
                <span className="member-phone-text">✉️ {member.email}</span>
              )}
            </div>
          </div>
        </div>

        <div className="member-profile-card__status-box">
          <span className="member-profile-card__status-label">
            Payment Status · {monthLabel}
          </span>
          <span className={`status-pill status-pill--large ${statusClass}`}>
            {summary.paymentStatus}
          </span>
        </div>
      </div>

      {/* Settlement Guidance Banner */}
      {summary.remainingBalance > 0 ? (
        <div className="delivery-status-banner is-warning">
          <div className="delivery-banner-icon">💳</div>
          <div className="delivery-banner-content" style={{ flex: 1 }}>
            <h4>Pending Payment Settlement: {formatCurrency(summary.remainingBalance)}</h4>
            <p>
              Your boarding account for <strong>{monthLabel}</strong> has an unsettled balance of <strong>{formatCurrency(summary.remainingBalance)}</strong>. Please settle via cash or bank deposit with the administrator.
            </p>
          </div>
          <button
            type="button"
            className="action-btn-wa"
            style={{ padding: '8px 16px', fontSize: '0.82rem', whiteSpace: 'nowrap' }}
            onClick={() => {
              const msg = `Hello Administrator,\n\nI am sending my payment details for my boarding bill of ${monthLabel} (Member: ${member.name}, Room: ${member.roomNumber || 'N/A'}, Remaining: Rs. ${summary.remainingBalance.toLocaleString()}).`
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
              Thank you! Your account has zero outstanding balance for this billing period. You can view and print your verified official receipts below.
            </p>
          </div>
        </div>
      )}

      {/* Member Discount Concession Banner */}
      {summary.discount > 0 && (
        <div className="delivery-status-banner is-ready" style={{ marginTop: '12px' }}>
          <div className="delivery-banner-icon">🎉</div>
          <div className="delivery-banner-content" style={{ flex: 1 }}>
            <h4>Monthly Member Discount Applied: {formatCurrency(summary.discount)}</h4>
            <p>
              Great news! You have received an individual monthly discount of <strong>{formatCurrency(summary.discount)}</strong> for <strong>{monthLabel}</strong>. This has been automatically deducted from your total payable amount below.
            </p>
          </div>
        </div>
      )}

      {/* Top 6 Summary Metric Cards */}
      <div className="balances-metrics-grid">
        <div className="metric-card">
          <span className="metric-card__label">New Charges ({monthLabel})</span>
          <strong className="metric-card__value is-primary">{formatCurrency(summary.currentMonthTotalBill)}</strong>
          <span className="metric-card__hint">Your distributed 5-category share</span>
        </div>

        <div className="metric-card">
          <span className="metric-card__label">Previous Arrears</span>
          <strong className={`metric-card__value ${summary.previousOutstandingBalance > 0 ? 'is-danger' : 'is-muted'}`}>
            {formatCurrency(summary.previousOutstandingBalance)}
          </strong>
          <span className="metric-card__hint">Unsettled past dues</span>
        </div>

        <div className="metric-card">
          <span className="metric-card__label">Monthly Member Discount</span>
          <strong className="metric-card__value is-success">
            {summary.discount > 0 ? `- ${formatCurrency(summary.discount)}` : formatCurrency(0)}
          </strong>
          <span className="metric-card__hint">
            {summary.discount > 0 ? 'Auto-deducted concession' : 'No discount for this month'}
          </span>
        </div>

        <div className="metric-card">
          <span className="metric-card__label">Final Amount Due</span>
          <strong className="metric-card__value is-indigo">{formatCurrency(summary.totalAmountDue)}</strong>
          <span className="metric-card__hint">Payable after discount deduction</span>
        </div>

        <div className="metric-card">
          <span className="metric-card__label">Total Paid Amount</span>
          <strong className="metric-card__value is-success">{formatCurrency(summary.totalPaid)}</strong>
          <span className="metric-card__hint">Verified payments for this month</span>
        </div>

        <div className="metric-card">
          <span className="metric-card__label">Remaining Balance</span>
          <strong className={`metric-card__value ${summary.remainingBalance > 0 ? 'is-danger' : 'is-success'}`}>
            {formatCurrency(summary.remainingBalance)}
          </strong>
          <span className="metric-card__hint">
            {summary.remainingBalance > 0 ? 'Amount currently owed' : 'Fully settled'}
          </span>
        </div>
      </div>

      {/* Monthly Category Bill Breakdown Section */}
      <div className="card-panel">
        <div className="card-panel-header">
          <div>
            <h3>Monthly Bill Breakdown ({monthLabel})</h3>
            <p className="panel-subtext">Admin-recorded house utility bills and your individual distributed share.</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            {onNavigate && (
              <button
                type="button"
                className="table-link-btn"
                onClick={() => onNavigate('categoryBills')}
              >
                View Bill Splits →
              </button>
            )}
            <div style={{ textAlign: 'right' }}>
              <span style={{ fontSize: '0.74rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700, display: 'block' }}>
                Total New Share
              </span>
              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'flex-end', gap: '6px' }}>
                <span style={{ fontSize: '0.85rem', color: '#64748b' }} title="Total house utility bills recorded by administrator">
                  (House: {formatCurrency(categoryBreakdown.reduce((sum, c) => sum + (c.totalBill || 0), 0))})
                </span>
                <strong style={{ fontSize: '1.25rem', color: '#0f172a' }}>
                  {formatCurrency(summary.currentMonthTotalBill)}
                </strong>
              </div>
            </div>
          </div>
        </div>

        <div className="category-cards-grid">
          {categoryBreakdown.map((cat) => {
            const cardStateClass = !cat.isRecorded
              ? 'is-empty'
              : cat.isDistributed
              ? 'is-created'
              : 'is-pending'

            const pillClass =
              cat.statusText === 'Included'
                ? 'is-distributed'
                : cat.statusText === 'Pending Split'
                ? 'is-pending'
                : cat.statusText === 'Exempt'
                ? 'is-exempt'
                : 'is-none'

            return (
              <div key={cat.code} className={`category-status-card ${cardStateClass}`}>
                <div className="cat-card-header">
                  <span className="cat-card-icon">{categoryIcons[cat.code] || '📋'}</span>
                  <span className={`cat-card-pill ${pillClass}`}>
                    {cat.statusText}
                  </span>
                </div>
                <h4 className="cat-card-title">{cat.name}</h4>

                {/* Primary Amount: Member share if distributed, or Admin Bill Total if recorded */}
                <div className="cat-card-amount">
                  {cat.isDistributed ? (
                    cat.isIncluded ? formatCurrency(cat.memberShare) : 'LKR 0.00'
                  ) : cat.isRecorded ? (
                    formatCurrency(cat.totalBill)
                  ) : (
                    'LKR 0.00'
                  )}
                </div>

                {/* Subline: Explain bill total & participant count */}
                <div className="cat-card-subline">
                  {cat.isDistributed ? (
                    cat.isIncluded ? (
                      <span>House Total: <strong>{formatCurrency(cat.totalBill)}</strong> · {cat.participantCount} members</span>
                    ) : (
                      <span>House Total: <strong>{formatCurrency(cat.totalBill)}</strong> · Excluded</span>
                    )
                  ) : cat.isRecorded ? (
                    <span>House Total · Est. share: <strong>{formatCurrency(cat.estimatedShare)}</strong></span>
                  ) : (
                    <span>No bill recorded by admin</span>
                  )}
                </div>

                <p className="cat-card-desc">
                  {cat.description || (
                    cat.isDistributed
                      ? (cat.isIncluded ? 'Allocated equal member share' : 'Not assigned to your room this month')
                      : cat.isRecorded
                      ? 'Recorded by admin · Awaiting distribution'
                      : 'No expense recorded for this category'
                  )}
                </p>

                {cat.documentUrl && (
                  <a
                    href={cat.documentUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="cat-card-doc-link"
                  >
                    📎 {cat.documentName || 'View Bill Slip'}
                  </a>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Payment History & Previous Month Records (Split Grid) */}
      <div className="dashboard-split-grid">
        {/* Payment History & Official Receipts */}
        <div className="card-panel">
          <div className="card-panel-header">
            <div>
              <h3>Payment History & Official Receipts</h3>
              <p className="panel-subtext">View and print official paper receipts for your verified payments.</p>
            </div>
            {onNavigate && (
              <button
                type="button"
                className="table-link-btn"
                onClick={() => onNavigate('payments')}
              >
                All Receipts & Dues →
              </button>
            )}
          </div>

          {paymentHistory.length === 0 ? (
            <div className="empty-state">
              <p>No payments recorded for this billing cycle yet.</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="modern-table modern-table--compact">
                <thead>
                  <tr>
                    <th>Receipt #</th>
                    <th>Date</th>
                    <th>Method</th>
                    <th style={{ textAlign: 'right' }}>Amount Paid</th>
                    <th style={{ textAlign: 'center' }}>Receipt</th>
                  </tr>
                </thead>
                <tbody>
                  {paymentHistory.map((p) => (
                    <tr key={p.id}>
                      <td>
                        <span className="receipt-tag">{p.receiptNumber}</span>
                      </td>
                      <td>
                        <span style={{ color: '#475569', fontSize: '0.82rem' }}>
                          {new Date(p.paidDate).toLocaleDateString('en-GB', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </span>
                      </td>
                      <td>
                        <span className="method-pill">{p.method.replace('_', ' ')}</span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <strong className="text-success">{formatCurrency(p.amount)}</strong>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <button
                          type="button"
                          className="action-btn-view"
                          onClick={() => handleOpenReceipt(p.id)}
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

        {/* Previous Month Records */}
        <div className="card-panel">
          <div className="card-panel-header">
            <div>
              <h3>Billing History Across Months</h3>
              <p className="panel-subtext">Track your distributed charges across prior billing cycles.</p>
            </div>
          </div>

          {monthHistory.length === 0 ? (
            <div className="empty-state">No historical bills recorded.</div>
          ) : (
            <div className="history-list" style={{ display: 'flex', flexDirection: 'column' }}>
              {monthHistory.map((h) => (
                <div key={`${h.year}-${h.month}`} className="history-row-item">
                  <div>
                    <strong style={{ fontSize: '0.88rem', color: '#0f172a' }}>{h.monthLabel}</strong>
                    <small style={{ display: 'block', color: '#64748b', fontSize: '0.74rem' }}>
                      {h.billCount} bill categories distributed
                    </small>
                  </div>
                  <strong className="text-primary" style={{ fontSize: '0.95rem' }}>
                    {formatCurrency(h.totalCharges)}
                  </strong>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Official Receipt Modal */}
      {activeReceipt && (
        <ReceiptModal receipt={activeReceipt} onClose={() => setActiveReceipt(null)} />
      )}
    </div>
  )
}
