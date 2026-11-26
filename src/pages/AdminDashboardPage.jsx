import { useEffect, useState } from 'react'
import {
  CategoryDonutChart,
  CategoryExpensesChart,
  CollectionTrendsChart,
} from '../components/Charts'
import UiIcon from '../components/UiIcon'
import { fetchMonthBills } from '../services/categoryBillService'
import { fetchBalances, fetchPayments } from '../services/financialService'
import { formatCurrency } from '../utils/formatters'

export default function AdminDashboardPage({
  selectedMonth,
  dashboard,
  users = [],
  onNavigate,
  onRecordPayment,
}) {
  const [year, monthStr] = selectedMonth.split('-')
  const month = parseInt(monthStr, 10)

  const [monthBills, setMonthBills] = useState([])
  const [memberBalances, setMemberBalances] = useState([])
  const [recentPayments, setRecentPayments] = useState([])
  const [loading, setLoading] = useState(true)

  async function loadDashboardFinancials() {
    setLoading(true)
    try {
      const [bills, balances, payments] = await Promise.all([
        fetchMonthBills(year, month),
        fetchBalances(year, month),
        fetchPayments(year, month),
      ])
      setMonthBills(bills)
      setMemberBalances(balances)
      setRecentPayments(payments)
    } catch (err) {
      console.error('Error loading dashboard financials:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadDashboardFinancials()
  }, [selectedMonth])

  // Calculation of summary cards (Active boarding members only)
  const activeMembers = memberBalances.filter((m) => m.status === 'active')
  const totalMembers = users.filter((u) => u.status === 'active').length
  const totalBillsThisMonth = monthBills.reduce((sum, b) => sum + b.total_amount, 0)
  const totalAmountDue = activeMembers.reduce((sum, m) => sum + m.totalAmountDue, 0)
  const totalCollected = activeMembers.reduce((sum, m) => sum + m.totalPaidAmount, 0)
  const totalOutstanding = activeMembers.reduce((sum, m) => sum + m.remainingBalance, 0)
  const unpaidMembersCount = activeMembers.filter((m) => m.paymentStatus === 'Unpaid').length
  const partialPaidCount = activeMembers.filter((m) => m.paymentStatus === 'Partially Paid').length

  const collectionPercentage =
    totalAmountDue > 0 ? Math.min(100, Math.round((totalCollected / totalAmountDue) * 100)) : 0

  // Category breakdown for charts
  const categoryNames = {
    electricity: 'Electricity',
    water: 'Water',
    telecom: 'Telecom',
    restaurant: 'Restaurant',
    other: 'Other Expenses',
  }

  const categoryTotals = ['electricity', 'water', 'telecom', 'restaurant', 'other'].map((code) => {
    const matching = monthBills.filter((b) => b.category === code)
    const amount = matching.reduce((sum, b) => sum + b.total_amount, 0)
    return {
      code,
      name: categoryNames[code],
      shortLabel: categoryNames[code].slice(0, 5),
      amount,
      percentage: totalBillsThisMonth > 0 ? Math.round((amount / totalBillsThisMonth) * 100) : 0,
    }
  })

  // Outstanding members list (Active members with balance > 0, sorted descending)
  const outstandingMembersList = activeMembers
    .filter((m) => m.remainingBalance > 0)
    .sort((a, b) => b.remainingBalance - a.remainingBalance)

  // Recent bill distributions
  const distributedBills = monthBills.filter((b) => b.is_distributed)

  const monthLabel = new Intl.DateTimeFormat('en-US', {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(Date.UTC(Number(year), month - 1, 1)))

  return (
    <div className="admin-dashboard-page">
      {/* Header */}
      <div className="page-header-flex">
        <div>
          <h1 className="page-title">Financial Dashboard</h1>
          <p className="page-subtitle">
            Real-time billing, collection analytics, and member balances for <strong>{monthLabel}</strong>.
          </p>
        </div>
        <div className="dashboard-quick-actions">
          <button
            type="button"
            className="secondary-button"
            onClick={() => onNavigate('categoryBills')}
          >
            Manage Bills
          </button>
          <button
            type="button"
            className="primary-button"
            onClick={() => onNavigate('payments')}
          >
            Record Payment
          </button>
        </div>
      </div>

      {/* 6 SUMMARY CARDS */}
      <div className="summary-cards-grid-6">
        <div className="saas-stat-card saas-stat-card--indigo">
          <div className="stat-card-top">
            <span className="stat-icon-wrap is-indigo">
              <UiIcon name="users" />
            </span>
            <span className="stat-label">Total Boarding Members</span>
          </div>
          <div className="stat-card-body">
            <strong className="stat-value">{totalMembers}</strong>
            <div className="stat-delta-wrap">
              <span className="stat-badge is-neutral">
                <span className="stat-dot is-green" />
                {users.filter((u) => u.status === 'active').length} active residents
              </span>
            </div>
          </div>
        </div>

        <div className="saas-stat-card saas-stat-card--blue">
          <div className="stat-card-top">
            <span className="stat-icon-wrap is-blue">
              <UiIcon name="receipt" />
            </span>
            <span className="stat-label">Total Bills This Month</span>
          </div>
          <div className="stat-card-body">
            <strong className="stat-value">{formatCurrency(totalBillsThisMonth)}</strong>
            <div className="stat-delta-wrap">
              <span className="stat-badge is-blue">
                {monthBills.length} / 5 categories entered
              </span>
            </div>
          </div>
        </div>

        <div className="saas-stat-card saas-stat-card--green">
          <div className="stat-card-top">
            <span className="stat-icon-wrap is-green">
              <UiIcon name="check" />
            </span>
            <span className="stat-label">Total Amount Collected</span>
          </div>
          <div className="stat-card-body">
            <strong className="stat-value text-success">{formatCurrency(totalCollected)}</strong>
            <div className="stat-delta-wrap">
              <span className="stat-badge is-green">
                <span className="stat-dot is-green" />
                {collectionPercentage}% collection rate
              </span>
            </div>
          </div>
        </div>

        <div className="saas-stat-card saas-stat-card--red">
          <div className="stat-card-top">
            <span className="stat-icon-wrap is-red">
              <UiIcon name="alert" />
            </span>
            <span className="stat-label">Total Outstanding Amount</span>
          </div>
          <div className="stat-card-body">
            <strong className="stat-value text-danger">{formatCurrency(totalOutstanding)}</strong>
            <div className="stat-delta-wrap">
              <span className="stat-badge is-red">
                <span className="stat-dot is-red" />
                Uncollected dues
              </span>
            </div>
          </div>
        </div>

        <div className="saas-stat-card saas-stat-card--gray">
          <div className="stat-card-top">
            <span className="stat-icon-wrap is-gray">
              <UiIcon name="userX" />
            </span>
            <span className="stat-label">Total Unpaid Members</span>
          </div>
          <div className="stat-card-body">
            <strong className="stat-value">{unpaidMembersCount}</strong>
            <div className="stat-delta-wrap">
              <span className="stat-badge is-neutral">
                Zero payment recorded
              </span>
            </div>
          </div>
        </div>

        <div className="saas-stat-card saas-stat-card--orange">
          <div className="stat-card-top">
            <span className="stat-icon-wrap is-orange">
              <UiIcon name="clock" />
            </span>
            <span className="stat-label">Total Partially Paid</span>
          </div>
          <div className="stat-card-body">
            <strong className="stat-value text-warning">{partialPaidCount}</strong>
            <div className="stat-delta-wrap">
              <span className="stat-badge is-orange">
                Partial balance pending
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* CHARTS ROW */}
      <div className="dashboard-charts-grid">
        {/* Chart 1: Monthly Bill Expenses by Category */}
        <div className="card-panel">
          <div className="card-panel-header">
            <div>
              <h3>Monthly Bill Expenses ({monthLabel})</h3>
              <p className="panel-subtext">Expenses broken down across the 5 categories.</p>
            </div>
            <strong className="chart-header-total">{formatCurrency(totalBillsThisMonth)}</strong>
          </div>
          <CategoryExpensesChart data={categoryTotals} />
        </div>

        {/* Chart 2: Category-wise Distribution Donut / Progress */}
        <div className="card-panel">
          <div className="card-panel-header">
            <div>
              <h3>Category-wise Distribution</h3>
              <p className="panel-subtext">Proportion of each category in current month.</p>
            </div>
          </div>
          <CategoryDonutChart categories={categoryTotals} />
        </div>
      </div>

      {/* ROW 2: COLLECTION STATS & OUTSTANDING MEMBERS */}
      <div className="dashboard-split-grid mt-6">
        {/* Left: Payment Collection Statistics & Trend */}
        <div className="card-panel">
          <div className="card-panel-header">
            <div>
              <h3>Payment Collection Statistics</h3>
              <p className="panel-subtext">Overall collection performance vs billing targets.</p>
            </div>
            <span className="badge-rate">{collectionPercentage}%</span>
          </div>
          <div className="progress-container-large">
            <div className="progress-bar-large">
              <div
                className="progress-fill-large is-green"
                style={{ width: `${collectionPercentage}%` }}
              />
            </div>
            <div className="progress-meta-row">
              <span>Collected: <strong>{formatCurrency(totalCollected)}</strong></span>
              <span>Target: <strong>{formatCurrency(totalAmountDue)}</strong></span>
            </div>
          </div>

          <div className="mt-4">
            <h4>History Collection Trend</h4>
            <CollectionTrendsChart history={dashboard?.history || []} />
          </div>
        </div>

        {/* Right: Outstanding Members List */}
        <div className="card-panel">
          <div className="card-panel-header">
            <div>
              <h3>Outstanding Members List</h3>
              <p className="panel-subtext">Members with pending balances for {monthLabel}.</p>
            </div>
            <button
              type="button"
              className="text-link-btn"
              onClick={() => onNavigate('balances')}
            >
              Full matrix →
            </button>
          </div>
          {outstandingMembersList.length === 0 ? (
            <div className="chart-empty-state text-success">
              <p>🎉 All members have cleared their balances for this month!</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="modern-table modern-table--compact">
                <thead>
                  <tr>
                    <th style={{ width: '38%' }}>Member</th>
                    <th style={{ width: '20%' }}>Due</th>
                    <th style={{ width: '22%' }}>Remaining</th>
                    <th style={{ width: '20%', textAlign: 'right' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {outstandingMembersList.slice(0, 6).map((m) => {
                    const initials = m.name
                      ? m.name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase()
                      : 'M'
                    return (
                      <tr key={m.residentId}>
                        <td>
                          <div className="table-member-cell">
                            <div className="table-avatar-chip">{initials}</div>
                            <div className="table-member-info">
                              <strong className="table-member-name">{m.name}</strong>
                              <span className="room-badge-chip">
                                {m.roomNumber ? `Room ${m.roomNumber}` : 'No Room'}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td>{formatCurrency(m.totalAmountDue)}</td>
                        <td>
                          <strong className="text-danger">{formatCurrency(m.remainingBalance)}</strong>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <button
                            type="button"
                            className="action-btn-pay action-btn-pay--mini"
                            onClick={() => {
                              if (onRecordPayment) onRecordPayment(m)
                              else onNavigate('payments')
                            }}
                          >
                            Record Pay
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
      </div>

      {/* ROW 3: RECENT DISTRIBUTIONS (LEFT) & RECENT PAYMENTS (RIGHT) */}
      <div className="dashboard-split-grid mt-6">
        {/* Left: Recent Bill Distributions */}
        <div className="card-panel">
          <div className="card-panel-header">
            <div>
              <h3>Recent Bill Distributions</h3>
              <p className="panel-subtext">Active distributions split among members.</p>
            </div>
            <button
              type="button"
              className="text-link-btn"
              onClick={() => onNavigate('categoryBills')}
            >
              View all bills →
            </button>
          </div>
          {distributedBills.length === 0 ? (
            <div className="chart-empty-state">
              <p>No distributed bills for this month yet. Use "Manage Bills" to distribute expenses.</p>
            </div>
          ) : (
            <div className="recent-dist-list">
              {distributedBills.map((b) => {
                const categoryIcons = {
                  electricity: '⚡',
                  water: '💧',
                  telecom: '📶',
                  restaurant: '🍽️',
                  other: '🧾',
                }
                return (
                  <div key={b._id} className="recent-dist-item">
                    <div className="dist-item-icon-badge" title={b.categoryName}>
                      {categoryIcons[b.category] || '🧾'}
                      <strong>{b.categoryName}</strong><br />
                    </div>
                    <div className="dist-item-info">
                      <small>
                        Split between <strong>{b.participants?.length || 0}</strong> members ·{' '}
                        {b.distributed_at ? new Date(b.distributed_at).toLocaleDateString() : 'Active cycle'}
                      </small>
                    </div>
                    <div className="dist-item-meta">
                      <strong className="dist-item-amount">{formatCurrency(b.total_amount)}</strong>
                      <span className="dist-item-badge"> Distributed</span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Right: Recent Payments (Member Name, Amount, Method) */}
        <div className="card-panel">
          <div className="card-panel-header">
            <div>
              <h3>Recent Payments</h3>
              <p className="panel-subtext">Latest settled payments and receipts.</p>
            </div>
            <button
              type="button"
              className="text-link-btn"
              onClick={() => onNavigate('payments')}
            >
              All payments →
            </button>
          </div>
          {recentPayments.length === 0 ? (
            <div className="chart-empty-state">
              <p>No payments recorded yet for {monthLabel}.</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="modern-table modern-table--compact">
                <thead>
                  <tr>
                    <th style={{ width: '45%' }}>Member Name</th>
                    <th style={{ width: '30%', textAlign: 'right' }}>Amount</th>
                    <th style={{ width: '25%', textAlign: 'center' }}>Method</th>
                  </tr>
                </thead>
                <tbody>
                  {recentPayments.slice(0, 6).map((p) => {
                    const initials = p.memberName
                      ? p.memberName.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase()
                      : 'M'
                    return (
                      <tr key={p.id}>
                        <td>
                          <div className="table-member-cell">
                            <div className="table-avatar-chip">{initials}</div>
                            <div className="table-member-info">
                              <strong className="table-member-name">{p.memberName}</strong>
                              <span className="room-badge-chip">
                                {p.roomNumber ? `Room ${p.roomNumber}` : '—'}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <strong className="text-success">{formatCurrency(p.amount)}</strong>
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <span className={`method-pill is-${p.method || 'cash'}`}>
                            {(p.method || 'cash').replace('_', ' ')}
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
