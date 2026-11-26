import { useEffect, useState } from 'react'
import UiIcon from '../components/UiIcon'
import {
  deleteMonthDiscount,
  fetchDiscountHistory,
  fetchMonthDiscount,
  previewDiscountAllocation,
  saveMonthDiscount,
} from '../services/discountService'
import { fetchBalances } from '../services/financialService'
import { formatCurrency } from '../utils/formatters'

export default function MonthlyDiscountsPage({
  selectedMonth,
  onNavigate,
  canEdit = true,
}) {
  const [yearStr, monthStr] = selectedMonth.split('-')
  const year = parseInt(yearStr, 10)
  const month = parseInt(monthStr, 10)

  const [discountData, setDiscountData] = useState(null)
  const [memberBalances, setMemberBalances] = useState([])
  const [historyList, setHistoryList] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Modal State
  const [showModal, setShowModal] = useState(false)
  const [inputDiscount, setInputDiscount] = useState('')
  const [inputMemberCount, setInputMemberCount] = useState('')
  const [selectedMemberIds, setSelectedMemberIds] = useState([])
  const [inputReason, setInputReason] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [previewLoading, setPreviewLoading] = useState(false)
  const [previewAllocations, setPreviewAllocations] = useState(null)

  const monthLabel = new Intl.DateTimeFormat('en-US', {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(Date.UTC(Number(year), month - 1, 1)))

  async function loadPageData() {
    setLoading(true)
    setError('')
    try {
      const [disc, balances, history] = await Promise.all([
        fetchMonthDiscount(year, month),
        fetchBalances(year, month),
        fetchDiscountHistory(),
      ])
      setDiscountData(disc)
      setMemberBalances(balances)
      setHistoryList(history)
    } catch (err) {
      setError(err.message || 'Failed to load discount data.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadPageData()
  }, [selectedMonth])

  // Open modal with existing values
  function handleOpenModal() {
    setInputDiscount(discountData?.totalDiscount ? String(discountData.totalDiscount) : '')
    setInputReason(discountData?.reason || '')
    const defaultCount = discountData?.memberCount || activeBalances.length || 1
    setInputMemberCount(String(defaultCount))

    const existingIds = discountData?.allocations?.map((a) => String(a.resident_id)) || []
    if (existingIds.length > 0) {
      setSelectedMemberIds(existingIds)
    } else {
      setSelectedMemberIds(activeBalances.slice(0, defaultCount).map((m) => String(m.residentId)))
    }

    setPreviewAllocations(null)
    setShowModal(true)
  }

  // Live preview when typing discount amount or member count in modal
  async function triggerPreview(amount, count, ids) {
    const num = parseFloat(amount)
    const mCount = parseInt(count, 10) || 1
    if (!isNaN(num) && num > 0) {
      setPreviewLoading(true)
      try {
        const preview = await previewDiscountAllocation({
          year,
          month,
          totalDiscount: num,
          memberCount: mCount,
          residentIds: ids && ids.length > 0 ? ids : undefined,
        })
        setPreviewAllocations(preview)
      } catch {
        // ignore preview errors during typing
      } finally {
        setPreviewLoading(false)
      }
    } else {
      setPreviewAllocations(null)
    }
  }

  function handleDiscountAmountChange(val) {
    setInputDiscount(val)
    triggerPreview(val, inputMemberCount, selectedMemberIds)
  }

  function handleMemberCountChange(val) {
    setInputMemberCount(val)
    const count = parseInt(val, 10)
    if (!isNaN(count) && count > 0) {
      const newIds = activeBalances.slice(0, count).map((m) => String(m.residentId))
      setSelectedMemberIds(newIds)
      triggerPreview(inputDiscount, count, newIds)
    } else {
      triggerPreview(inputDiscount, val, selectedMemberIds)
    }
  }

  function handleToggleResident(id) {
    let updated
    if (selectedMemberIds.includes(id)) {
      updated = selectedMemberIds.filter((x) => x !== id)
    } else {
      updated = [...selectedMemberIds, id]
    }
    setSelectedMemberIds(updated)
    setInputMemberCount(String(updated.length))
    triggerPreview(inputDiscount, updated.length, updated)
  }

  async function handleSaveDiscount(e) {
    e.preventDefault()
    const num = parseFloat(inputDiscount)
    if (isNaN(num) || num < 0) {
      setError('Enter a valid discount amount (0 or greater).')
      return
    }

    const count = parseInt(inputMemberCount, 10) || selectedMemberIds.length || activeBalances.length || 1
    if (count <= 0) {
      setError('Eligible member count must be at least 1.')
      return
    }

    setSubmitting(true)
    setError('')
    try {
      await saveMonthDiscount({
        year,
        month,
        totalDiscount: num,
        reason: inputReason,
        memberCount: count,
        residentIds: selectedMemberIds.length > 0 ? selectedMemberIds : undefined,
      })
      setSuccess(`Monthly discount of ${formatCurrency(num)} successfully allocated for ${monthLabel} across ${count} members!`)
      setShowModal(false)
      await loadPageData()
    } catch (err) {
      setError(err.message || 'Failed to save monthly discount.')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDeleteDiscount() {
    if (!window.confirm(`Are you sure you want to remove the monthly discount for ${monthLabel}?`)) {
      return
    }
    setLoading(true)
    setError('')
    try {
      await deleteMonthDiscount(year, month)
      setSuccess(`Monthly discount removed for ${monthLabel}.`)
      await loadPageData()
    } catch (err) {
      setError(err.message || 'Failed to remove discount.')
      setLoading(false)
    }
  }

  // Active members only for discount metrics
  const activeBalances = memberBalances.filter((m) => m.status === 'active')
  const totalHouseDiscount = discountData?.totalDiscount || 0
  const activeMembersCount = activeBalances.length || discountData?.memberCount || 1
  const discountPerMember = discountData?.discountPerMember || (totalHouseDiscount > 0 ? Math.round(totalHouseDiscount / activeMembersCount) : 0)
  const totalPayableAll = activeBalances.reduce((sum, m) => sum + m.totalAmountDue, 0)
  const totalGrossAll = activeBalances.reduce((sum, m) => sum + (m.grossAmount || (m.totalNewCharges + m.previousOutstanding)), 0)

  return (
    <div className="monthly-discounts-page">
      {/* Header */}
      <div
        className="page-header-flex"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '24px',
          width: '100%',
          flexWrap: 'wrap',
          marginBottom: '26px',
        }}
      >
        <div style={{ flex: '0 0 calc(65% - 12px)', maxWidth: 'calc(65% - 12px)', minWidth: '320px' }}>
          <h1 className="page-title" style={{ margin: 0, fontSize: '1.6rem', fontWeight: 700, color: '#1e243a' }}>
            Monthly Member Discount Management
          </h1>
          <p
            className="page-subtitle"
            style={{
              margin: '8px 0 0 0',
              fontSize: '0.92rem',
              color: '#64748b',
              lineHeight: 1.5,
            }}
          >
            Configure custom monthly discount, automatically divide equally among active boarding members, and deduct from their payable totals for <strong>{monthLabel}</strong>.
          </p>
        </div>
        {canEdit && (
          <div
            className="page-header-actions"
            style={{
              flex: '0 0 calc(25% - 12px)',
              maxWidth: 'calc(25% - 12px)',
              minWidth: '220px',
              display: 'flex',
              justifyContent: 'flex-end',
              alignItems: 'center',
              gap: '10px',
            }}
          >
            {totalHouseDiscount > 0 && (
              <button
                type="button"
                className="secondary-button"
                style={{
                  color: '#ef4444',
                  borderColor: '#fca5a5',
                  padding: '9px 14px',
                  fontSize: '0.86rem',
                  whiteSpace: 'nowrap',
                }}
                onClick={handleDeleteDiscount}
              >
                Remove Discount
              </button>
            )}
            <button
              type="button"
              className="primary-button"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                padding: '11px 20px',
                fontSize: '0.92rem',
                fontWeight: 600,
                whiteSpace: 'nowrap',
                width: '100%',
                boxSizing: 'border-box',
                borderRadius: '8px',
              }}
              onClick={handleOpenModal}
            >
              <UiIcon name="discount" />
              <span>{totalHouseDiscount > 0 ? 'Edit Monthly Discount' : '+ Set Monthly Discount'}</span>
            </button>
          </div>
        )}
      </div>

      {error && <div className="app-alert app-alert--error" style={{ marginBottom: '20px' }}>{error}</div>}
      {success && <div className="app-alert app-alert--success" style={{ marginBottom: '20px' }}>{success}</div>}

      {/* Top 3 Summary Metrics */}
      <div className="balances-metrics-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)', marginTop: '6px' }}>
        <div className="metric-card">
          <span className="metric-card__label">Total Monthly Discount</span>
          <strong className="metric-card__value is-success">
            {formatCurrency(totalHouseDiscount)}
          </strong>
          <span className="metric-card__hint">
            {discountData?.reason ? `Note: ${discountData.reason}` : `House discount for ${monthLabel}`}
          </span>
        </div>

        <div className="metric-card">
          <span className="metric-card__label">Eligible Members</span>
          <strong className="metric-card__value is-primary">
            {activeMembersCount} Members
          </strong>
          <span className="metric-card__hint">Equal share allocation</span>
        </div>

        <div className="metric-card">
          <span className="metric-card__label">Discount Per Member</span>
          <strong className="metric-card__value is-indigo">
            {formatCurrency(discountPerMember)}
          </strong>
          <span className="metric-card__hint">
            {totalHouseDiscount > 0
              ? `${formatCurrency(totalHouseDiscount)} ÷ ${activeMembersCount} members`
              : 'No discount entered'}
          </span>
        </div>
      </div>

      {/* Discount Highlight Banner */}
      {totalHouseDiscount > 0 ? (
        <div className="delivery-status-banner is-ready" style={{ marginTop: '16px' }}>
          <div className="delivery-banner-icon">🎉</div>
          <div className="delivery-banner-content" style={{ flex: 1 }}>
            <h4>
              Monthly Discount Active: {formatCurrency(totalHouseDiscount)} ({formatCurrency(discountPerMember)} / member)
            </h4>
            <p>
              The system has automatically divided the total discount of <strong>{formatCurrency(totalHouseDiscount)}</strong> equally across <strong>{activeMembersCount} active members</strong> ({formatCurrency(discountPerMember)} per person). Each member's allocation is automatically deducted from their total payable amount below.
            </p>
          </div>
        </div>
      ) : (
        <div className="delivery-status-banner is-warning" style={{ marginTop: '16px' }}>
          <div className="delivery-banner-icon">ℹ️</div>
          <div className="delivery-banner-content" style={{ flex: 1 }}>
            <h4>No Monthly Discount Configured for {monthLabel}</h4>
            <p>
              Click <strong>"+ Set Monthly Discount"</strong> to enter any discount amount. The system will automatically calculate equal shares for each active member and deduct it from their total bill.
            </p>
          </div>
        </div>
      )}

      {/* Member Discount Allocation Table */}
      <div className="card-panel" style={{ marginTop: '20px' }}>
        <div className="card-panel__header">
          <div>
            <h3 className="card-panel__title">Member Discount Allocation & Payable Breakdown</h3>
            <p className="card-panel__subtitle">
              Detailed view of original charges, individual discount deduction, and final amount to pay for {monthLabel}.
            </p>
          </div>
        </div>

        {loading ? (
          <div className="empty-state">Loading member discount matrix...</div>
        ) : activeBalances.length === 0 ? (
          <div className="empty-state">No active boarding members found for this month.</div>
        ) : (
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th style={{ width: '35%' }}>Member & Room</th>
                  <th style={{ width: '22%', textAlign: 'right' }}>Total Payment (Charges)</th>
                  <th style={{ width: '21%', textAlign: 'right', color: '#16a34a' }}>Individual Discount</th>
                  <th style={{ width: '22%', textAlign: 'right', color: '#2563eb' }}>Final Amount to Pay</th>
                </tr>
              </thead>
              <tbody>
                {activeBalances.map((member) => {
                  const gross = member.grossAmount ?? (member.totalNewCharges + member.previousOutstanding)
                  const disc = member.discount || 0
                  const finalDue = member.totalAmountDue

                  return (
                    <tr key={member.residentId}>
                      <td>
                        <div className="table-user-cell">
                          <div>
                            <strong className="table-user-name">{member.name}</strong>
                            <div className="table-user-room">
                              {member.roomNumber ? `Room ${member.roomNumber}` : 'Unassigned'} · {member.phone}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <strong>{formatCurrency(gross)}</strong>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        {disc > 0 ? (
                          <span className="status-pill status-pill--success" style={{ fontWeight: 700 }}>
                            - {formatCurrency(disc)}
                          </span>
                        ) : (
                          <span style={{ color: '#94a3b8' }}>—</span>
                        )}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <strong style={{ color: '#1d4ed8', fontSize: '1rem', fontWeight: 700 }}>
                          {formatCurrency(finalDue)}
                        </strong>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
              <tfoot>
                <tr style={{ background: '#f8fafc', fontWeight: 700 }}>
                  <td>Total House Summary ({activeMembersCount} Members)</td>
                  <td style={{ textAlign: 'right' }}>{formatCurrency(totalGrossAll)}</td>
                  <td style={{ textAlign: 'right', color: '#16a34a' }}>- {formatCurrency(totalHouseDiscount)}</td>
                  <td style={{ textAlign: 'right', color: '#1d4ed8', fontSize: '1rem' }}>
                    {formatCurrency(totalPayableAll)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>

      {/* Monthly History Section */}
      {historyList.length > 0 && (
        <div className="card-panel" style={{ marginTop: '24px' }}>
          <div className="card-panel__header">
            <div>
              <h3 className="card-panel__title">Monthly Discount History Across All Months</h3>
              <p className="card-panel__subtitle">
                Overview of total discount amounts and member allocations recorded by month.
              </p>
            </div>
          </div>
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Month</th>
                  <th>Total House Discount</th>
                  <th>Members Count</th>
                  <th>Equal Share / Member</th>
                  <th>Notes / Reason</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {historyList.map((h) => {
                  const isCurrent = h.year === year && h.month === month
                  const hMonthLabel = new Intl.DateTimeFormat('en-US', {
                    month: 'long',
                    year: 'numeric',
                    timeZone: 'UTC',
                  }).format(new Date(Date.UTC(h.year, h.month - 1, 1)))

                  return (
                    <tr key={h.id} style={{ background: isCurrent ? '#f0fdf4' : undefined }}>
                      <td>
                        <strong>{hMonthLabel}</strong>
                        {isCurrent && (
                          <span className="status-pill status-pill--success" style={{ marginLeft: '8px', fontSize: '0.72rem' }}>
                            Selected
                          </span>
                        )}
                      </td>
                      <td style={{ color: '#16a34a', fontWeight: 700 }}>
                        {formatCurrency(h.totalDiscount)}
                      </td>
                      <td>{h.memberCount} Members</td>
                      <td>{formatCurrency(h.discountPerMember)}</td>
                      <td>{h.reason || '—'}</td>
                      <td>
                        <button
                          type="button"
                          className="secondary-button"
                          style={{ padding: '4px 10px', fontSize: '0.78rem' }}
                          onClick={() => {
                            const ym = `${h.year}-${String(h.month).padStart(2, '0')}`
                            window.location.hash = `#discounts?month=${ym}`
                          }}
                        >
                          View Month
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Set / Edit Discount Modal */}
      {showModal && (
        <div className="modal-backdrop" onClick={() => setShowModal(false)}>
          <div
            className="modal-card"
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: '660px',
              width: '100%',
              padding: 0,
              marginTop: '80px',
              maxHeight: '87vh',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              borderRadius: '16px',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              background: '#ffffff',
            }}
          >
            <div
              className="modal-card__header"
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                width: '100%',
                padding: '20px 28px',
                borderBottom: '1px solid #e2e8f0',
                background: '#ffffff',
                flexShrink: 0,
              }}
            >
              <div>
                <h3 className="modal-card__title" style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, color: '#1e293b' }}>
                  {totalHouseDiscount > 0 ? 'Edit Monthly Discount' : 'Set Monthly Discount'}
                </h3>
                <p className="modal-card__subtitle" style={{ margin: '4px 0 0 0', fontSize: '0.86rem', color: '#64748b' }}>
                  Billing Period: <strong>{monthLabel}</strong>
                </p>
              </div>
              <button
                type="button"
                className="modal-card__close"
                onClick={() => setShowModal(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '1.6rem',
                  lineHeight: '1',
                  cursor: 'pointer',
                  color: '#64748b',
                  padding: '4px 8px',
                }}
                aria-label="Close"
              >
                &times;
              </button>
            </div>

            <form
              onSubmit={handleSaveDiscount}
              style={{
                display: 'flex',
                flexDirection: 'column',
                flex: 1,
                overflow: 'hidden',
                margin: 0,
              }}
            >
              <div
                className="modal-card__body"
                style={{
                  padding: '22px 28px',
                  overflowY: 'auto',
                  flex: 1,
                }}
              >
                {/* 2-Column Row for Total Discount Amount and Member Count */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                    gap: '16px',
                    marginBottom: '18px',
                  }}
                >
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label" htmlFor="total-discount-input" style={{ display: 'block', fontWeight: 600, marginBottom: '6px' }}>
                      Total Discount Amount (Rs. / LKR) *
                    </label>
                    <input
                      id="total-discount-input"
                      type="number"
                      step="0.01"
                      min="0"
                      className="form-input"
                      placeholder="e.g. 5000"
                      value={inputDiscount}
                      onChange={(e) => handleDiscountAmountChange(e.target.value)}
                      required
                      autoFocus
                    />
                    <span className="form-hint" style={{ display: 'block', marginTop: '6px', fontSize: '0.78rem', color: '#64748b' }}>
                      Total discount amount for this month.
                    </span>
                  </div>

                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label" htmlFor="eligible-members-count-input" style={{ display: 'block', fontWeight: 600, marginBottom: '6px' }}>
                      Eligible Member Count (Member ගණන) *
                    </label>
                    <input
                      id="eligible-members-count-input"
                      type="number"
                      min="1"
                      max={activeBalances.length || 100}
                      className="form-input"
                      placeholder="e.g. 8"
                      value={inputMemberCount}
                      onChange={(e) => handleMemberCountChange(e.target.value)}
                      required
                    />
                    <span className="form-hint" style={{ display: 'block', marginTop: '6px', fontSize: '0.78rem', color: '#64748b' }}>
                      Divide among {inputMemberCount || 0} members (Active: {activeBalances.length}).
                    </span>
                  </div>
                </div>

                <div className="form-group" style={{ marginBottom: '18px' }}>
                  <label className="form-label" htmlFor="discount-reason-input" style={{ display: 'block', fontWeight: 600, marginBottom: '6px' }}>
                    Discount Reason / Notes (Optional)
                  </label>
                  <input
                    id="discount-reason-input"
                    type="text"
                    className="form-input"
                    placeholder="e.g. Festival rebate, Landlord concession, Solar credit bonus"
                    value={inputReason}
                    onChange={(e) => setInputReason(e.target.value)}
                  />
                </div>

                {/* Member Selection Chips / Quick Toggle */}
                {activeBalances.length > 0 && (
                  <div className="form-group" style={{ marginBottom: '18px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <label className="form-label" style={{ fontWeight: 600, margin: 0, fontSize: '0.88rem' }}>
                        Selected Members ({selectedMemberIds.length} of {activeBalances.length})
                      </label>
                      <button
                        type="button"
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#2563eb',
                          fontSize: '0.8rem',
                          cursor: 'pointer',
                          textDecoration: 'underline',
                          padding: 0,
                        }}
                        onClick={() => {
                          if (selectedMemberIds.length === activeBalances.length) {
                            setSelectedMemberIds([])
                            setInputMemberCount('0')
                          } else {
                            const all = activeBalances.map((m) => String(m.residentId))
                            setSelectedMemberIds(all)
                            setInputMemberCount(String(all.length))
                            triggerPreview(inputDiscount, all.length, all)
                          }
                        }}
                      >
                        {selectedMemberIds.length === activeBalances.length ? 'Deselect All' : 'Select All Active'}
                      </button>
                    </div>
                    <div
                      style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: '8px',
                        maxHeight: '120px',
                        overflowY: 'auto',
                        padding: '10px',
                        background: '#f8fafc',
                        border: '1px solid #e2e8f0',
                        borderRadius: '8px',
                      }}
                    >
                      {activeBalances.map((m) => {
                        const isSelected = selectedMemberIds.includes(String(m.residentId))
                        return (
                          <button
                            key={m.residentId}
                            type="button"
                            onClick={() => handleToggleResident(String(m.residentId))}
                            style={{
                              padding: '5px 11px',
                              borderRadius: '20px',
                              fontSize: '0.78rem',
                              fontWeight: isSelected ? 600 : 500,
                              cursor: 'pointer',
                              border: isSelected ? '1px solid #2563eb' : '1px solid #cbd5e1',
                              background: isSelected ? '#eff6ff' : '#ffffff',
                              color: isSelected ? '#1d4ed8' : '#64748b',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px',
                              transition: 'all 0.15s ease',
                            }}
                          >
                            <span>{isSelected ? '✓' : '+'}</span>
                            <span>{m.name}</span>
                            {m.roomNumber && <span style={{ opacity: 0.7 }}>({m.roomNumber})</span>}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* Live Division Calculation Preview with Generous Card Spacing */}
                {parseFloat(inputDiscount) > 0 && (
                  <div
                    style={{
                      background: '#f0fdf4',
                      border: '1px solid #bbf7d0',
                      borderRadius: '10px',
                      padding: '16px 20px',
                      marginTop: '16px',
                      marginBottom: '8px',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '16px',
                      }}
                    >
                      <span style={{ fontWeight: 700, color: '#166534', fontSize: '0.95rem' }}>
                        ⚡ Equal Member Division Calculation:
                      </span>
                      {previewLoading && (
                        <span style={{ fontSize: '0.8rem', color: '#16a34a' }}>Calculating...</span>
                      )}
                    </div>

                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(3, 1fr)',
                        gap: '16px',
                      }}
                    >
                      <div
                        style={{
                          background: '#ffffff',
                          padding: '14px 16px',
                          borderRadius: '8px',
                          border: '1px solid #dcfce7',
                          boxShadow: '0 2px 4px rgba(0,0,0,0.03)',
                        }}
                      >
                        <div style={{ fontSize: '0.78rem', color: '#64748b', marginBottom: '4px' }}>
                          Total Discount
                        </div>
                        <strong style={{ fontSize: '1.15rem', color: '#16a34a' }}>
                          {formatCurrency(parseFloat(inputDiscount) || 0)}
                        </strong>
                      </div>

                      <div
                        style={{
                          background: '#ffffff',
                          padding: '14px 16px',
                          borderRadius: '8px',
                          border: '1px solid #dcfce7',
                          boxShadow: '0 2px 4px rgba(0,0,0,0.03)',
                        }}
                      >
                        <div style={{ fontSize: '0.78rem', color: '#64748b', marginBottom: '4px' }}>
                          Eligible Members
                        </div>
                        <strong style={{ fontSize: '1.15rem', color: '#1e293b' }}>
                          {inputMemberCount || selectedMemberIds.length || 1}
                        </strong>
                      </div>

                      <div
                        style={{
                          background: '#ffffff',
                          padding: '14px 16px',
                          borderRadius: '8px',
                          border: '1px solid #dcfce7',
                          boxShadow: '0 2px 4px rgba(0,0,0,0.03)',
                        }}
                      >
                        <div style={{ fontSize: '0.78rem', color: '#64748b', marginBottom: '4px' }}>
                          Each Member Gets
                        </div>
                        <strong style={{ fontSize: '1.15rem', color: '#2563eb' }}>
                          {formatCurrency(
                            previewAllocations?.discountPerMember ??
                              (parseFloat(inputDiscount) / (parseInt(inputMemberCount, 10) || selectedMemberIds.length || 1))
                          )}
                        </strong>
                      </div>
                    </div>

                    <p style={{ margin: '14px 0 0 0', fontSize: '0.85rem', color: '#15803d', lineHeight: 1.5 }}>
                      ✓ Each member's final payable amount will be deducted by{' '}
                      <strong>
                        {formatCurrency(
                          previewAllocations?.discountPerMember ??
                            (parseFloat(inputDiscount) / (parseInt(inputMemberCount, 10) || selectedMemberIds.length || 1))
                        )}
                      </strong>.
                    </p>
                  </div>
                )}
              </div>

              <div
                className="modal-card__footer"
                style={{
                  padding: '16px 28px',
                  borderTop: '1px solid #e2e8f0',
                  background: '#f8fafc',
                  display: 'flex',
                  justifyContent: 'flex-end',
                  gap: '12px',
                  flexShrink: 0,
                }}
              >
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => setShowModal(false)}
                  disabled={submitting}
                  style={{ padding: '9px 18px' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="primary-button"
                  disabled={submitting || !inputDiscount}
                  style={{ padding: '9px 22px' }}
                >
                  {submitting ? 'Saving Allocation...' : 'Save & Allocate Discount'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
