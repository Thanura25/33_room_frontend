import { useState, useEffect } from 'react'
import UiIcon from '../components/UiIcon'
import { formatCurrency } from '../utils/formatters'
import { fetchReport } from '../services/reportService'

export default function ReportsPage({ selectedMonth, users = [] }) {
  const [yearStr, monthStr] = selectedMonth.split('-')
  const [reportType, setReportType] = useState('monthly_bills')
  const [filterYear, setFilterYear] = useState(yearStr)
  const [filterMonth, setFilterMonth] = useState(monthStr)
  const [filterMember, setFilterMember] = useState('all')
  const [filterCategory, setFilterCategory] = useState('all')

  const [reportResult, setReportResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function loadReport() {
    setLoading(true)
    setError('')
    try {
      const res = await fetchReport({
        type: reportType,
        year: filterYear,
        month: filterMonth === 'all' ? '' : filterMonth,
        memberId: filterMember,
        category: filterCategory,
      })
      setReportResult(res)
    } catch (err) {
      setError(err.message || 'Failed to generate report.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadReport()
  }, [reportType, filterYear, filterMonth, filterMember, filterCategory])

  // EXPORT TO EXCEL (CSV)
  function handleExportExcel() {
    if (!reportResult || !reportResult.data || reportResult.data.length === 0) return

    const rows = reportResult.data
    const keys = Object.keys(rows[0])
    const headers = keys.map((k) =>
      k
        .replace(/([A-Z])/g, ' $1')
        .replace(/^./, (str) => str.toUpperCase())
        .trim()
    )

    const escape = (val) => {
      const str = String(val ?? '')
      return '"' + str.replaceAll('"', '""') + '"'
    }

    const csvContent =
      '\uFEFF' +
      [
        headers.join(','),
        ...rows.map((row) => keys.map((k) => escape(row[k])).join(',')),
      ].join('\r\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `33Room_${reportType}_${filterYear}_${filterMonth}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  // PRINT / EXPORT PDF
  function handlePrintPDF() {
    window.print()
  }

  const reportOptions = [
    { id: 'monthly_bills', label: 'Monthly Bill Reports' },
    { id: 'member_bills', label: 'Member-wise Bill Reports' },
    { id: 'monthly_discounts', label: 'Monthly Member Discount Reports' },
    { id: 'category_expenses', label: 'Category-wise Expense Reports' },
    { id: 'payment_collections', label: 'Monthly Payment Collection Reports' },
    { id: 'outstanding_balances', label: 'Outstanding Balance Reports' },
    { id: 'unpaid_members', label: 'Unpaid Members Reports' },
    { id: 'payment_history', label: 'Payment History Reports' },
  ]

  return (
    <div className="reports-page">
      {/* Header */}
      <div className="page-header-flex no-print">
        <div>
          <h1 className="page-title">Financial & Audit Reports</h1>
          <p className="page-subtitle">
            Generate, filter, and export comprehensive boarding house financial statements.
          </p>
        </div>
        <div className="report-export-actions">
          <button
            type="button"
            className="secondary-button"
            onClick={handleExportExcel}
            disabled={!reportResult || !reportResult.data?.length}
          >
            <UiIcon name="download" /> Export Excel (CSV)
          </button>
          <button
            type="button"
            className="primary-button"
            onClick={handlePrintPDF}
            disabled={!reportResult || !reportResult.data?.length}
          >
            <UiIcon name="download" /> Print / PDF Export
          </button>
        </div>
      </div>

      {/* FILTER CONTROLS BAR (Hidden during print) */}
      <div className="card-panel no-print mb-6">
        <div className="report-filter-grid">
          <div className="filter-field">
            <label>Report Type</label>
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
              className="form-input"
            >
              {reportOptions.map((opt) => (
                <option key={opt.id} value={opt.id}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-field">
            <label>Year</label>
            <select
              value={filterYear}
              onChange={(e) => setFilterYear(e.target.value)}
              className="form-input"
            >
              <option value="2025">2025</option>
              <option value="2026">2026</option>
              <option value="2027">2027</option>
              <option value="2028">2028</option>
            </select>
          </div>

          <div className="filter-field">
            <label>Month</label>
            <select
              value={filterMonth}
              onChange={(e) => setFilterMonth(e.target.value)}
              className="form-input"
            >
              <option value="all">All Months</option>
              {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                <option key={m} value={String(m).padStart(2, '0')}>
                  {new Date(2000, m - 1, 1).toLocaleString('en-US', { month: 'long' })}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-field">
            <label>Member</label>
            <select
              value={filterMember}
              onChange={(e) => setFilterMember(e.target.value)}
              className="form-input"
            >
              <option value="all">All Members</option>
              {users.filter((u) => u.status === 'active').map((u) => (
                <option key={u.id} value={u.id}>
                  {u.fullName} {u.roomNumber ? `(Room ${u.roomNumber})` : ''}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-field">
            <label>Bill Category</label>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="form-input"
            >
              <option value="all">All Categories</option>
              <option value="electricity">Electricity Bill</option>
              <option value="water">Water Bill</option>
              <option value="telecom">Telecom Bill</option>
              <option value="restaurant">Restaurant Bill</option>
              <option value="other">Other Expenses</option>
            </select>
          </div>
        </div>
      </div>

      {error && <div className="app-alert app-alert--error">{error}</div>}

      {/* REPORT VIEW CANVAS */}
      <div className="card-panel printable-report-card">
        <div className="printable-report-header">
          <div className="print-brand">
            <h2>Room 33 Boarding House</h2>
            <p>Official Financial Management Report</p>
          </div>
          <div className="print-meta">
            <h3>{reportResult?.type || 'Financial Report'}</h3>
            <span className="text-muted">
              Period: {filterMonth !== 'all' ? `${filterMonth}/` : ''}{filterYear} · Generated on{' '}
              {new Date().toLocaleDateString('en-GB')}
            </span>
          </div>
        </div>

        {/* Summary Metric Chips */}
        {reportResult?.summary && (
          <div className="report-summary-chips">
            {Object.entries(reportResult.summary).map(([key, value]) => {
              const label = key
                .replace(/([A-Z])/g, ' $1')
                .replace(/^./, (str) => str.toUpperCase())
              const formattedVal = typeof value === 'number' && key.toLowerCase().includes('amount') || key.toLowerCase().includes('total') && typeof value === 'number' && value > 100
                ? formatCurrency(value)
                : value
              return (
                <div key={key} className="metric-chip">
                  <span>{label}</span>
                  <strong>{formattedVal}</strong>
                </div>
              )
            })}
          </div>
        )}

        {/* Report Data Table */}
        {loading ? (
          <div className="empty-state">Compiling report data...</div>
        ) : !reportResult || !reportResult.data || reportResult.data.length === 0 ? (
          <div className="empty-state">No data available for the selected filters.</div>
        ) : (
          <div className="table-responsive mt-4">
            <table className="modern-table modern-table--report">
              <thead>
                <tr>
                  {Object.keys(reportResult.data[0]).map((col) => (
                    <th key={col}>
                      {col
                        .replace(/([A-Z])/g, ' $1')
                        .replace(/^./, (str) => str.toUpperCase())}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {reportResult.data.map((row, idx) => (
                  <tr key={idx}>
                    {Object.entries(row).map(([k, val], cellIdx) => {
                      const isAmount =
                        typeof val === 'number' &&
                        (k.toLowerCase().includes('amount') ||
                          k.toLowerCase().includes('charges') ||
                          k.toLowerCase().includes('balance') ||
                          k.toLowerCase().includes('due') ||
                          k.toLowerCase().includes('paid'))

                      return (
                        <td key={cellIdx}>
                          {isAmount ? (
                            <strong>{formatCurrency(val)}</strong>
                          ) : k === 'status' || k === 'paymentStatus' ? (
                            <span className={`status-pill ${String(val).toLowerCase().replace(' ', '')}`}>
                              {val}
                            </span>
                          ) : (
                            String(val ?? '—')
                          )}
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
