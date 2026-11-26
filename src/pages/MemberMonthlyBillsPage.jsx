import { useState, useEffect } from 'react'
import UiIcon from '../components/UiIcon'
import { formatCurrency } from '../utils/formatters'
import { fetchMemberDashboard } from '../services/memberService'

export default function MemberMonthlyBillsPage({ selectedMonth, onNavigate }) {
  const [year, monthStr] = selectedMonth.split('-')
  const month = parseInt(monthStr, 10)

  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [expandedBillId, setExpandedBillId] = useState(null)

  async function loadData() {
    setLoading(true)
    setError('')
    try {
      const result = await fetchMemberDashboard(year, month)
      setData(result)
    } catch (err) {
      setError(err.message || 'Failed to load monthly bills.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [selectedMonth])

  const monthLabel = new Intl.DateTimeFormat('en-US', {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(Date.UTC(Number(year), month - 1, 1)))

  if (loading) {
    return (
      <div className="card-panel">
        <div className="empty-state">Loading your monthly bills breakdown...</div>
      </div>
    )
  }

  if (error) {
    return <div className="app-alert app-alert--error">{error}</div>
  }

  if (!data) return null

  const { member, summary, categoryBills = [], categoryBreakdown = [], monthlyDiscount } = data

  const categoryIcons = {
    electricity: '⚡',
    water: '💧',
    telecom: '📶',
    restaurant: '🍽️',
    other: '🧾',
  }

  // Calculate total house expenses from category bills
  const totalHouseExpense = categoryBills.reduce((sum, b) => sum + (b.totalAmount || 0), 0)
  const activeBilledCount = categoryBreakdown.filter((c) => c.isBilled).length

  function toggleExpand(billId) {
    setExpandedBillId((curr) => (curr === billId ? null : billId))
  }

  return (
    <div className="member-dashboard-page">
      {/* Page Header */}
      <div className="page-header-flex">
        <div>
          <h1 className="page-title">My Monthly Bills & Split Breakdown</h1>
          <p className="page-subtitle">
            Detailed breakdown of house utility bills for <strong>{monthLabel}</strong>, split formulas, and each member's allocated share.
          </p>
        </div>
      </div>

      {/* Top Financial Summary Metric Cards */}
      <div className="balances-metrics-grid">
        <div className="metric-card">
          <span className="metric-card__label">My Total Monthly Share</span>
          <strong className="metric-card__value is-primary">
            {formatCurrency(summary.currentMonthTotalBill)}
          </strong>
          <span className="metric-card__hint">Your portion across all categories</span>
        </div>

        <div className="metric-card">
          <span className="metric-card__label">Total House Utility Bills</span>
          <strong className="metric-card__value is-indigo">
            {formatCurrency(totalHouseExpense)}
          </strong>
          <span className="metric-card__hint">Entire house total for {monthLabel}</span>
        </div>

        <div className="metric-card">
          <span className="metric-card__label">My Monthly Discount</span>
          <strong className="metric-card__value is-success">
            {summary.discount > 0 ? `- ${formatCurrency(summary.discount)}` : formatCurrency(0)}
          </strong>
          <span className="metric-card__hint">
            {monthlyDiscount?.totalDiscount > 0
              ? `House total: ${formatCurrency(monthlyDiscount.totalDiscount)}`
              : 'No discount for this month'}
          </span>
        </div>

        <div className="metric-card">
          <span className="metric-card__label">Final Amount Due</span>
          <strong className="metric-card__value is-primary">
            {formatCurrency(summary.totalAmountDue)}
          </strong>
          <span className="metric-card__hint">
            {summary.discount > 0 ? 'Deducted after discount' : 'Charges + arrears'}
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
          <span className="metric-card__hint">
            {summary.remainingBalance > 0
              ? `${formatCurrency(summary.remainingBalance)} remaining`
              : 'All dues settled'}
          </span>
        </div>
      </div>

      {/* Category Bills Breakdown & Participant Splits */}
      <div className="card-panel">
        <div className="card-panel-header">
          <div>
            <h3>House Bills & Individual Member Splits ({monthLabel})</h3>
            <p className="panel-subtext">
              View the total bill, participating members, and the exact amount assigned to each person.
            </p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <span style={{ fontSize: '0.74rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700, display: 'block' }}>
              Your Total Share
            </span>
            <strong style={{ fontSize: '1.25rem', color: '#0f172a' }}>
              {formatCurrency(summary.currentMonthTotalBill)}
            </strong>
          </div>
        </div>

        {categoryBills.length === 0 ? (
          <div className="empty-state" style={{ padding: '36px 16px' }}>
            <div style={{ fontSize: '2rem', marginBottom: '8px' }}>🧾</div>
            <strong>No category bills recorded yet for {monthLabel}</strong>
            <p style={{ color: '#64748b', fontSize: '0.85rem', marginTop: '4px' }}>
              The administrator has not entered utility bills for this month yet. Check back soon or select another month from the top header.
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {categoryBills.map((bill) => {
              const isExpanded = expandedBillId === bill.id
              const participants = bill.participants || []

              return (
                <div
                  key={bill.id}
                  style={{
                    border: '1px solid #e2e8f0',
                    borderRadius: '12px',
                    padding: '18px 20px',
                    background: '#ffffff',
                    boxShadow: '0 1px 3px rgba(15, 23, 42, 0.03)',
                  }}
                >
                  {/* Bill Card Header */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: '12px',
                      marginBottom: '14px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span
                        style={{
                          fontSize: '1.5rem',
                          width: '42px',
                          height: '42px',
                          borderRadius: '10px',
                          background: '#f1f5f9',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        {categoryIcons[bill.category] || '📋'}
                      </span>
                      <div>
                        <h4 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: '#0f172a' }}>
                          {bill.categoryName}
                        </h4>
                        <span style={{ fontSize: '0.78rem', color: '#64748b' }}>
                          {bill.description ? bill.description : 'Standard monthly utility expense'}
                        </span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ textAlign: 'right' }}>
                        <span style={{ display: 'block', fontSize: '0.7rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>
                          Total House Bill
                        </span>
                        <strong style={{ fontSize: '1.2rem', color: '#0f172a' }}>
                          {formatCurrency(bill.totalAmount)}
                        </strong>
                      </div>
                      <span
                        className={`cat-card-pill ${
                          bill.isDistributed
                            ? bill.isIncluded
                              ? 'is-distributed'
                              : 'is-none'
                            : 'is-pending'
                        }`}
                        style={{ padding: '6px 12px', fontSize: '0.75rem' }}
                      >
                        {bill.isDistributed
                          ? bill.isIncluded
                            ? 'Included in My Bill'
                            : 'Not Included'
                          : 'Pending Distribution'}
                      </span>
                    </div>
                  </div>

                  {/* Split Calculation Formula Card */}
                  <div className="formula-card" style={{ margin: '12px 0 14px' }}>
                    <div className="formula-item">
                      <span>Total House Bill</span>
                      <strong>{formatCurrency(bill.totalAmount)}</strong>
                    </div>
                    <span className="formula-operator">÷</span>
                    <div className="formula-item">
                      <span>{bill.isDistributed ? 'Participating Members' : 'Active Members'}</span>
                      <strong>{bill.participantCount} Residents</strong>
                    </div>
                    <span className="formula-operator">=</span>
                    <div className="formula-item is-highlight">
                      <span>Share Per Person</span>
                      <strong>{formatCurrency(bill.perPersonAmount)}</strong>
                    </div>
                    <span className="formula-operator">→</span>
                    <div
                      className="formula-item"
                      style={{
                        background: bill.isDistributed ? '#ecfdf5' : '#fef3c7',
                        padding: '6px 14px',
                        borderRadius: '8px',
                      }}
                    >
                      <span
                        style={{
                          color: bill.isDistributed ? '#166534' : '#b45309',
                          fontWeight: 700,
                        }}
                      >
                        {bill.isDistributed ? 'My Allocated Share' : 'Estimated Member Share'}
                      </span>
                      <strong
                        style={{
                          color: bill.isDistributed ? '#15803d' : '#92400e',
                          fontSize: '1.15rem',
                        }}
                      >
                        {formatCurrency(bill.myShare)}
                      </strong>
                    </div>
                  </div>

                  {/* Member Split Breakdown Toggle */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '8px', borderTop: '1px solid #f1f5f9' }}>
                    <span style={{ fontSize: '0.78rem', color: '#64748b' }}>
                      {bill.isDistributed
                        ? `Distributed on ${new Date(bill.distributedAt || Date.now()).toLocaleDateString('en-GB')}`
                        : 'Awaiting administrator distribution among residents'}
                    </span>

                    <button
                      type="button"
                      className="table-link-btn"
                      onClick={() => toggleExpand(bill.id)}
                      style={{ padding: '5px 12px', fontSize: '0.78rem' }}
                    >
                      <UiIcon name={isExpanded ? 'chevronUp' : 'chevronDown'} />
                      {isExpanded ? 'Hide Member Split List' : `View Member Split Breakdown (${participants.length} Members)`}
                    </button>
                  </div>

                  {/* Expanded Member Participant Table */}
                  {isExpanded && (
                    <div style={{ marginTop: '14px', paddingTop: '14px', borderTop: '1px dashed #cbd5e1' }}>
                      <h5 style={{ margin: '0 0 10px', fontSize: '0.85rem', fontWeight: 700, color: '#334155' }}>
                        Individual Member Shares for {bill.categoryName} ({formatCurrency(bill.totalAmount)})
                      </h5>

                      {participants.length === 0 ? (
                        <p style={{ fontSize: '0.8rem', color: '#94a3b8' }}>No participant breakdown recorded.</p>
                      ) : (
                        <div className="table-responsive">
                          <table className="modern-table modern-table--compact">
                            <thead>
                              <tr>
                                <th style={{ width: '40%' }}>Member Name</th>
                                <th style={{ width: '25%' }}>Room Number</th>
                                <th style={{ width: '35%', textAlign: 'right' }}>Assigned Share Amount</th>
                              </tr>
                            </thead>
                            <tbody>
                              {participants.map((p, idx) => (
                                <tr
                                  key={p.residentId || idx}
                                  style={{
                                    background: p.isMe ? '#eff6ff' : undefined,
                                    fontWeight: p.isMe ? 700 : undefined,
                                  }}
                                >
                                  <td>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                      <span>{p.name}</span>
                                      {p.isMe && (
                                        <span
                                          style={{
                                            background: '#2563eb',
                                            color: '#ffffff',
                                            fontSize: '0.65rem',
                                            padding: '2px 6px',
                                            borderRadius: '4px',
                                            textTransform: 'uppercase',
                                          }}
                                        >
                                          You
                                        </span>
                                      )}
                                    </div>
                                  </td>
                                  <td>
                                    <span className="room-badge-chip">
                                      {p.roomNumber ? `Room ${p.roomNumber}` : 'No Room'}
                                    </span>
                                  </td>
                                  <td style={{ textAlign: 'right' }}>
                                    <strong style={{ color: p.isMe ? '#2563eb' : '#0f172a' }}>
                                      {formatCurrency(p.amount)}
                                    </strong>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Quick Navigation to Receipts */}
      <div className="card-panel" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 24px' }}>
        <div>
          <h4 style={{ margin: '0 0 2px', fontSize: '0.95rem', fontWeight: 700, color: '#0f172a' }}>
            Need to check your payment receipts or settled dues?
          </h4>
          <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748b' }}>
            View your complete transaction history, remaining balances, and download official receipts.
          </p>
        </div>
        <button
          type="button"
          className="primary-button"
          onClick={() => onNavigate('payments')}
          style={{ whiteSpace: 'nowrap' }}
        >
          View My Receipts & History →
        </button>
      </div>
    </div>
  )
}
