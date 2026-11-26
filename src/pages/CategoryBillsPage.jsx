import { useState, useEffect } from 'react'
import UiIcon from '../components/UiIcon'
import { formatCurrency } from '../utils/formatters'
import {
  fetchCategories,
  fetchMonthBills,
  createCategoryBill,
  previewDistribution,
  distributeBill,
  deleteCategoryBill,
} from '../services/categoryBillService'

export default function CategoryBillsPage({
  selectedMonth,
  users = [],
  onNavigate,
  canEdit = true,
  onNotificationChange,
}) {
  const [year, monthStr] = selectedMonth.split('-')
  const month = parseInt(monthStr, 10)

  const [categories, setCategories] = useState([])
  const [monthBills, setMonthBills] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // New Bill Modal state
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [billCategory, setBillCategory] = useState('electricity')
  const [totalAmount, setTotalAmount] = useState('')
  const [description, setDescription] = useState('')
  const [documentFile, setDocumentFile] = useState(null)
  const [documentName, setDocumentName] = useState('')
  const [savingBill, setSavingBill] = useState(false)

  // Distribution Modal state
  const [distributingBill, setDistributingBill] = useState(null)
  const [selectedMemberIds, setSelectedMemberIds] = useState([])
  const [previewData, setPreviewData] = useState(null)
  const [calculatingPreview, setCalculatingPreview] = useState(false)
  const [submittingDistribution, setSubmittingDistribution] = useState(false)
  const [sendWhatsApp, setSendWhatsApp] = useState(true)

  async function loadData() {
    setLoading(true)
    setError('')
    try {
      const [catList, bills] = await Promise.all([
        fetchCategories(),
        fetchMonthBills(year, month),
      ])
      setCategories(catList)
      setMonthBills(bills)
    } catch (err) {
      setError(err.message || 'Failed to load bills data.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [selectedMonth])

  // File upload handler (convert to Base64 data URL)
  function handleFileChange(e) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 8 * 1024 * 1024) {
      setError('File size must be under 8MB.')
      return
    }
    setDocumentName(file.name)
    const reader = new FileReader()
    reader.onload = () => {
      setDocumentFile(reader.result)
    }
    reader.readAsDataURL(file)
  }

  async function handleCreateBillSubmit(e) {
    e.preventDefault()
    if (!totalAmount || Number(totalAmount) <= 0) {
      setError('Please enter a valid bill amount.')
      return
    }
    setSavingBill(true)
    setError('')
    try {
      await createCategoryBill({
        month,
        year: Number(year),
        category: billCategory,
        totalAmount: Number(totalAmount),
        description,
        documentUrl: documentFile || '',
        documentName,
      })
      setSuccess(`Successfully saved ${billCategory} bill!`)
      setShowCreateModal(false)
      setTotalAmount('')
      setDescription('')
      setDocumentFile(null)
      setDocumentName('')
      await loadData()
    } catch (err) {
      setError(err.message || 'Could not save bill.')
    } finally {
      setSavingBill(false)
    }
  }

  // Active members only for billing & distribution
  const activeUsers = users.filter((u) => u.status === 'active')

  // Open distribute modal
  function openDistributeModal(bill) {
    setDistributingBill(bill)
    // By default, select all active members
    const activeIds = activeUsers.map((u) => u.id)
    setSelectedMemberIds(activeIds)
    setPreviewData(null)
  }

  // Handle select all / deselect all
  function handleSelectAll() {
    setSelectedMemberIds(activeUsers.map((u) => u.id))
  }
  function handleDeselectAll() {
    setSelectedMemberIds([])
  }

  function handleToggleMember(id) {
    setSelectedMemberIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    )
  }

  // Trigger calculation review
  async function handleReviewDistribution() {
    if (!distributingBill || selectedMemberIds.length === 0) {
      setError('Select at least one member to share the bill.')
      return
    }
    setCalculatingPreview(true)
    setError('')
    try {
      const preview = await previewDistribution(distributingBill._id, selectedMemberIds)
      setPreviewData(preview)
    } catch (err) {
      setError(err.message || 'Failed to calculate distribution preview.')
    } finally {
      setCalculatingPreview(false)
    }
  }

  // Submit distribution
  async function handleConfirmDistribution() {
    if (!distributingBill || selectedMemberIds.length === 0) return
    setSubmittingDistribution(true)
    setError('')
    try {
      const res = await distributeBill(distributingBill._id, selectedMemberIds, sendWhatsApp)
      setSuccess(
        `Bill successfully distributed among ${res.participants.length} members! Outstanding balances updated.`
      )
      setDistributingBill(null)
      setPreviewData(null)
      await loadData()
      if (onNotificationChange) onNotificationChange()
    } catch (err) {
      setError(err.message || 'Failed to distribute bill.')
    } finally {
      setSubmittingDistribution(false)
    }
  }

  async function handleDeleteBill(id) {
    if (!window.confirm('Are you sure you want to delete this bill?')) return
    try {
      await deleteCategoryBill(id)
      setSuccess('Bill removed.')
      await loadData()
    } catch (err) {
      setError(err.message)
    }
  }

  const categoryIcons = {
    electricity: '⚡',
    water: '💧',
    telecom: '📶',
    restaurant: '🍽️',
    other: '🧾',
  }

  // Live share calculation
  const calculatedShare =
    distributingBill && selectedMemberIds.length > 0
      ? (distributingBill.total_amount / selectedMemberIds.length).toFixed(2)
      : '0.00'

  const monthLabel = new Intl.DateTimeFormat('en-US', {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(Date.UTC(Number(year), month - 1, 1)))

  return (
    <div className="category-bills-page">
      {/* Top Banner & Heading */}
      <div className="page-header-flex">
        <div>
          <h1 className="page-title">Monthly Bills & Distribution</h1>
          <p className="page-subtitle">
            Manage the 5 utility & boarding categories for <strong>{monthLabel}</strong>, calculate equal member shares, and distribute with WhatsApp notifications.
          </p>
        </div>
        {canEdit && (
          <button
            type="button"
            className="primary-button"
            onClick={() => setShowCreateModal(true)}
          >
            <UiIcon name="plus" /> Add Monthly Bill
          </button>
        )}
      </div>

      {error && <div className="app-alert app-alert--error">{error}</div>}
      {success && <div className="app-alert app-alert--success">{success}</div>}

      {/* 5 Bill Category Status Cards */}
      <div className="category-cards-grid">
        {categories.map((cat) => {
          const existing = monthBills.find((b) => b.category === cat.code)
          return (
            <div key={cat.code} className={`category-status-card ${existing ? 'is-created' : 'is-empty'}`}>
              <div className="cat-card-header">
                <span className="cat-card-icon">{categoryIcons[cat.code] || '📋'}</span>
                <span className={`cat-card-pill ${existing?.is_distributed ? 'is-distributed' : existing ? 'is-draft' : 'is-none'}`}>
                  {existing?.is_distributed ? 'Distributed' : existing ? 'Draft Saved' : 'Not Entered'}
                </span>
              </div>
              <h3 className="cat-card-title">{cat.name}</h3>
              <div className="cat-card-amount">
                {existing ? formatCurrency(existing.total_amount) : 'Rs. 0.00'}
              </div>
              <p className="cat-card-desc">{cat.description}</p>
              <div className="cat-card-footer">
                {existing ? (
                  existing.is_distributed ? (
                    <span className="cat-card-status-text">
                      <UiIcon name="check" /> Split between {existing.participants?.length || 0} members
                    </span>
                  ) : (
                    <button
                      type="button"
                      className="distribute-btn"
                      onClick={() => openDistributeModal(existing)}
                    >
                      Distribute Bill
                    </button>
                  )
                ) : (
                  <button
                    type="button"
                    className="add-bill-btn"
                    onClick={() => {
                      setBillCategory(cat.code)
                      setShowCreateModal(true)
                    }}
                  >
                    + Enter Bill
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Monthly Bills Table */}
      <div className="card-panel mt-6">
        <div className="card-panel-header">
          <div>
            <h2>Recorded Bills for {monthLabel}</h2>
            <p className="panel-subtext">Review all entered category bills and distribution statuses.</p>
          </div>
          <div className="metric-chip">
            <span>Total Month Bills</span>
            <strong>
              {formatCurrency(monthBills.reduce((sum, b) => sum + b.total_amount, 0))}
            </strong>
          </div>
        </div>

        {loading ? (
          <div className="empty-state">Loading monthly bills...</div>
        ) : monthBills.length === 0 ? (
          <div className="empty-state">
            <p>No bills entered for {monthLabel} yet.</p>
            <button
              type="button"
              className="primary-button mt-4"
              onClick={() => setShowCreateModal(true)}
            >
              Add First Bill
            </button>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="modern-table">
              <thead>
                <tr>
                  <th>Category</th>
                  <th>Amount</th>
                  <th>Description</th>
                  <th>Attachment</th>
                  <th>Distribution Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {monthBills.map((bill) => (
                  <tr key={bill._id}>
                    <td>
                      <div className="table-cat-cell">
                        <span>{categoryIcons[bill.category] || '📋'}</span>
                        <strong>{bill.categoryName}</strong>
                      </div>
                    </td>
                    <td>
                      <strong className="amount-highlight">{formatCurrency(bill.total_amount)}</strong>
                    </td>
                    <td>
                      <span className="table-desc">{bill.description || '—'}</span>
                    </td>
                    <td>
                      {bill.document_url ? (
                        <a
                          href={bill.document_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="table-link-btn"
                          title="View uploaded bill"
                        >
                          📎 {bill.document_name || 'View Bill'}
                        </a>
                      ) : (
                        <span className="text-muted">None</span>
                      )}
                    </td>
                    <td>
                      {bill.is_distributed ? (
                        <span className="status-pill paid">
                          Distributed ({bill.participants?.length || 0} members)
                        </span>
                      ) : (
                        <span className="status-pill partial">Undistributed Draft</span>
                      )}
                    </td>
                    <td>
                      <div className="action-buttons-wrap">
                        {!bill.is_distributed && canEdit && (
                          <button
                            type="button"
                            className="primary-button primary-button--small"
                            onClick={() => openDistributeModal(bill)}
                          >
                            Distribute
                          </button>
                        )}
                        {!bill.is_distributed && canEdit && (
                          <button
                            type="button"
                            className="delete-button--small"
                            onClick={() => handleDeleteBill(bill._id)}
                          >
                            Delete
                          </button>
                        )}
                        {bill.is_distributed && (
                          <button
                            type="button"
                            className="ghost-button ghost-button--small"
                            onClick={() => onNavigate('balances')}
                          >
                            View Balances
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* CREATE BILL MODAL */}
      {showCreateModal && (
        <div className="receipt-modal-backdrop" onClick={() => setShowCreateModal(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-card-header">
              <h3>Add Monthly Bill</h3>
              <button
                className="receipt-close-btn"
                type="button"
                onClick={() => setShowCreateModal(false)}
              >
                <UiIcon name="close" />
              </button>
            </div>
            <form onSubmit={handleCreateBillSubmit} className="modal-form">
              <div className="form-group">
                <label>Month & Year</label>
                <input type="text" readOnly value={monthLabel} className="form-input readonly" />
              </div>

              <div className="form-group">
                <label>Bill Category *</label>
                <select
                  value={billCategory}
                  onChange={(e) => setBillCategory(e.target.value)}
                  className="form-input"
                  required
                >
                  {categories.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Total Bill Amount (LKR) *</label>
                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={totalAmount}
                  onChange={(e) => setTotalAmount(e.target.value)}
                  placeholder="e.g. 15000"
                  className="form-input"
                  required
                />
              </div>

              <div className="form-group">
                <label>Bill Description or Note</label>
                <textarea
                  rows="3"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g. Electricity bill for November 2026 meter reading"
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label>Upload Bill Image or PDF (Optional)</label>
                <input
                  type="file"
                  accept="image/*,application/pdf"
                  onChange={handleFileChange}
                  className="form-file-input"
                />
                {documentName && <small className="file-name-hint">Selected: {documentName}</small>}
              </div>

              <div className="modal-card-footer">
                <button
                  type="button"
                  className="ghost-button"
                  onClick={() => setShowCreateModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="primary-button" disabled={savingBill}>
                  {savingBill ? 'Saving Bill...' : 'Save Bill'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* BILL DISTRIBUTION MODAL */}
      {distributingBill && (
        <div className="receipt-modal-backdrop" onClick={() => setDistributingBill(null)}>
          <div className="modal-card modal-card--large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-card-header">
              <div>
                <h3>Distribute {distributingBill.categoryName}</h3>
                <p className="modal-subtitle">
                  Total Bill: <strong>{formatCurrency(distributingBill.total_amount)}</strong> for {monthLabel}
                </p>
              </div>
              <button
                className="receipt-close-btn"
                type="button"
                onClick={() => setDistributingBill(null)}
              >
                <UiIcon name="close" />
              </button>
            </div>

            <div className="distribution-body">
              {/* Member Selection Controls */}
              <div className="selection-toolbar">
                <span className="selection-badge">
                  {selectedMemberIds.length} of {users.length} members selected
                </span>
                <div className="selection-btns">
                  <button type="button" className="ghost-button ghost-button--small" onClick={handleSelectAll}>
                    Select All
                  </button>
                  <button type="button" className="ghost-button ghost-button--small" onClick={handleDeselectAll}>
                    Deselect All
                  </button>
                </div>
              </div>

              {/* Live Formula Display */}
              <div className="formula-card">
                <div className="formula-item">
                  <span>Total Bill</span>
                  <strong>{formatCurrency(distributingBill.total_amount)}</strong>
                </div>
                <span className="formula-operator">÷</span>
                <div className="formula-item">
                  <span>Selected Members</span>
                  <strong>{selectedMemberIds.length}</strong>
                </div>
                <span className="formula-operator">=</span>
                <div className="formula-item is-highlight">
                  <span>Individual Share</span>
                  <strong>Rs. {calculatedShare} / person</strong>
                </div>
              </div>

              {/* Members Checkbox List (Active Members Only) */}
              <div className="members-checkbox-grid">
                {activeUsers.map((user) => {
                  const isChecked = selectedMemberIds.includes(user.id)
                  return (
                    <label
                      key={user.id}
                      className={`member-select-card ${isChecked ? 'is-checked' : ''}`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => handleToggleMember(user.id)}
                      />
                      <div className="member-select-info">
                        <strong>{user.fullName}</strong>
                        <small>
                          {user.roomNumber ? `Room ${user.roomNumber} · ` : ''}
                          {user.phone}
                        </small>
                      </div>
                    </label>
                  )
                })}
              </div>

              {/* Preview Review Table */}
              {previewData && (
                <div className="preview-review-section">
                  <h4 className="preview-heading">Calculated Distribution Review</h4>
                  <div className="table-responsive">
                    <table className="modern-table">
                      <thead>
                        <tr>
                          <th>Member Name</th>
                          <th>Room</th>
                          <th>Phone</th>
                          <th>Calculated Share</th>
                        </tr>
                      </thead>
                      <tbody>
                        {previewData.preview.map((p) => (
                          <tr key={p.residentId}>
                            <td><strong>{p.name}</strong></td>
                            <td>{p.roomNumber ? `Room ${p.roomNumber}` : '—'}</td>
                            <td>{p.phoneNumber}</td>
                            <td><strong className="text-success">{formatCurrency(p.amount)}</strong></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* WhatsApp Notification Option */}
              <div className="whatsapp-option-box">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={sendWhatsApp}
                    onChange={(e) => setSendWhatsApp(e.target.checked)}
                  />
                  <span>
                    <strong>Send WhatsApp notification to selected members upon distribution</strong>
                    <small>Sends the updated bill share, previous arrears, and payment instructions.</small>
                  </span>
                </label>
              </div>

              <div className="modal-card-footer">
                <button
                  type="button"
                  className="ghost-button"
                  onClick={() => setDistributingBill(null)}
                >
                  Cancel
                </button>

                {!previewData ? (
                  <button
                    type="button"
                    className="primary-button"
                    disabled={selectedMemberIds.length === 0 || calculatingPreview}
                    onClick={handleReviewDistribution}
                  >
                    {calculatingPreview ? 'Calculating...' : 'Review Distribution'}
                  </button>
                ) : (
                  <button
                    type="button"
                    className="primary-button primary-button--success"
                    disabled={submittingDistribution}
                    onClick={handleConfirmDistribution}
                  >
                    {submittingDistribution ? 'Confirming & Saving...' : 'Confirm & Distribute Bill'}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
