import { useEffect, useRef, useState } from 'react'
import UiIcon from '../components/UiIcon'
import UserFormPage from './UserFormPage'
import '../UsersPage.css'
import { setMemberAccount } from '../services/residentAccountService'

const dateLabel = (value) =>
  value
    ? new Date(String(value).slice(0, 10) + 'T12:00:00').toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      })
    : '—'

function AvatarChip({ name, size = 'default' }) {
  const initials = name
    ? name
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map((n) => n[0])
        .join('')
        .toUpperCase()
    : 'M'

  return (
    <div
      className={`table-avatar-chip ${size === 'large' ? 'is-large' : ''}`}
      aria-hidden="true"
    >
      {initials}
    </div>
  )
}

function StatusPill({ status }) {
  const isAct = status === 'active'
  return (
    <span className={`status-pill ${isAct ? 'active' : 'inactive'}`}>
      {isAct ? 'Active' : 'Inactive'}
    </span>
  )
}

function openWhatsAppForUser(user) {
  const cleanPhone = (user.phone || '').replace(/\D/g, '')
  if (!cleanPhone) return
  const msg = `Hello ${user.fullName},\n\nNotice from Room 33 Boarding Management.`
  const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`
  window.open(url, '_blank')
}

function downloadUsers(users) {
  const escape = (value) => {
    const text = String(value ?? '')
    return '"' + (/^[\s]*[=+@-]/.test(text) ? "'" + text : text).replaceAll('"', '""') + '"'
  }
  const rows = [
    ['ID', 'Full Name', 'Email', 'Room', 'Phone', 'Birthday', 'Joined Date', 'Left Date', 'Status'],
    ...users.map((user) => [
      user.id,
      user.fullName,
      user.email,
      user.roomNumber,
      user.phone,
      user.birthday?.slice(0, 10) || '',
      user.joinedDate?.slice(0, 10),
      user.leftDate?.slice(0, 10),
      user.status,
    ]),
  ]
  const url = URL.createObjectURL(
    new Blob(['\uFEFF' + rows.map((row) => row.map(escape).join(',')).join('\r\n')], {
      type: 'text/csv;charset=utf-8;',
    })
  )
  const link = document.createElement('a')
  link.href = url
  link.download = '33-room-boarding-members.csv'
  link.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

function UserList({
  allUsers = [],
  filteredUsers = [],
  residentSearch,
  setResidentSearch,
  loading,
  canEdit,
  onNavigate,
  onOpenAccountModal,
}) {
  const [status, setStatus] = useState('all')
  const [sort, setSort] = useState('name-asc')
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [page, setPage] = useState(1)

  const [sortKey, sortDirection] = sort.split('-')

  // Top Metrics calculation (computed from complete users list)
  const activeMembersList = allUsers.filter((u) => u.status === 'active')
  const activeCount = activeMembersList.length
  const inactiveCount = allUsers.filter((u) => u.status === 'inactive').length

  const occupiedRoomsCount = new Set(
    activeMembersList
      .filter((u) => u.roomNumber && u.roomNumber.trim() !== '')
      .map((u) => u.roomNumber.trim().toUpperCase())
  ).size

  const portalAccountsCount = allUsers.filter((u) => u.hasAccount).length

  // Filter & Sort table records
  const filtered = (filteredUsers || [])
    .filter((user) => (status === 'all' ? true : user.status === status))
    .sort((a, b) => {
      const key = {
        name: 'fullName',
        room: 'roomNumber',
        joined: 'joinedDate',
        status: 'status',
        id: 'id',
      }[sortKey] || 'fullName'

      const valA = String(a[key] || '')
      const valB = String(b[key] || '')
      const comparison = valA.localeCompare(valB, undefined, { numeric: true, sensitivity: 'base' })
      return sortDirection === 'asc' ? comparison : -comparison
    })

  const pageCount = Math.max(1, Math.ceil(filtered.length / rowsPerPage))
  const currentPage = Math.min(page, pageCount)
  const start = (currentPage - 1) * rowsPerPage
  const visible = filtered.slice(start, start + rowsPerPage)

  const pageNumbers = [...new Set([1, currentPage - 1, currentPage, currentPage + 1, pageCount])]
    .filter((value) => value > 0 && value <= pageCount)
    .sort((a, b) => a - b)

  function changeSort(value) {
    setSort(value)
    setPage(1)
  }

  return (
    <>
      {/* Top 4 Summary Metric Cards */}
      <div className="balances-metrics-grid">
        <div className="metric-card">
          <span className="metric-card__label">Active Residents</span>
          <strong className="metric-card__value is-success">{activeCount}</strong>
          <span className="metric-card__hint">Current boarding members</span>
        </div>
        <div className="metric-card">
          <span className="metric-card__label">Occupied Rooms</span>
          <strong className="metric-card__value is-primary">{occupiedRoomsCount} Rooms</strong>
          <span className="metric-card__hint">Distinct rooms assigned</span>
        </div>
        <div className="metric-card">
          <span className="metric-card__label">Inactive Members</span>
          <strong className="metric-card__value is-muted">{inactiveCount}</strong>
          <span className="metric-card__hint">Past or departed residents</span>
        </div>
        <div className="metric-card">
          <span className="metric-card__label">Portal Accounts</span>
          <strong className="metric-card__value is-indigo">{portalAccountsCount}</strong>
          <span className="metric-card__hint">Member portal accounts active</span>
        </div>
      </div>

      {/* Main Table Card Panel */}
      <div className="card-panel">
        {/* Table Filter Toolbar */}
        <div className="table-filter-bar">
          <div className="search-box">
            <UiIcon name="search" />
            <input
              type="text"
              placeholder="Search by member name, room, or phone..."
              value={residentSearch}
              onChange={(e) => {
                setResidentSearch(e.target.value)
                setPage(1)
              }}
              className="table-search-input"
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
            <div className="filter-group">
              <label>Status:</label>
              <select
                value={status}
                onChange={(e) => {
                  setStatus(e.target.value)
                  setPage(1)
                }}
                className="filter-select"
              >
                <option value="all">All Statuses</option>
                <option value="active">Active Members</option>
                <option value="inactive">Inactive Members</option>
              </select>
            </div>

            <div className="filter-group">
              <label>Sort:</label>
              <select
                value={sort}
                onChange={(e) => changeSort(e.target.value)}
                className="filter-select"
              >
                <option value="name-asc">Name: A to Z</option>
                <option value="name-desc">Name: Z to A</option>
                <option value="room-asc">Room: Ascending</option>
                <option value="room-desc">Room: Descending</option>
                <option value="joined-desc">Newest Joined</option>
                <option value="joined-asc">Oldest Joined</option>
              </select>
            </div>

            <button
              type="button"
              className="table-link-btn"
              title="Export member list to CSV"
              disabled={loading || filtered.length === 0}
              onClick={() => downloadUsers(filtered)}
            >
              <UiIcon name="download" /> Export CSV
            </button>
          </div>
        </div>

        {/* Modern Members Table */}
        <div className="table-responsive">
          <table className="modern-table modern-table--compact">
            <thead>
              <tr>
                <th style={{ width: '27%' }}>Member & Room</th>
                <th style={{ width: '20%' }}>Phone Number</th>
                <th style={{ width: '15%' }}>Joined Date</th>
                <th style={{ width: '10%', textAlign: 'center' }}>Portal Login</th>
                <th style={{ width: '10%', textAlign: 'center' }}>Status</th>
                <th style={{ width: '18%', textAlign: 'center' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '36px 14px' }}>
                    <span className="text-muted">Loading boarding members directory...</span>
                  </td>
                </tr>
              ) : visible.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '36px 14px' }}>
                    <div style={{ color: '#64748b', fontSize: '0.9rem' }}>
                      <strong>No members match your criteria</strong>
                      <p style={{ margin: '4px 0 0', fontSize: '0.8rem', color: '#94a3b8' }}>
                        Try adjusting your search query or status filter.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                visible.map((user) => (
                  <tr key={user.id}>
                    {/* Member & Room */}
                    <td>
                      <div className="table-member-cell">
                        <AvatarChip name={user.fullName} />
                        <div className="table-member-info">
                          <strong className="table-member-name">{user.fullName}</strong>
                          <div className="table-member-subline">
                            <span className="room-badge-chip">
                              {user.roomNumber ? `Room ${user.roomNumber}` : 'No Room'}
                            </span>
                            {/* <span className="member-phone-text">{user.phone || 'No phone'}</span> */}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Phone Number */}
                    <td>
                      <span style={{ fontWeight: 600, color: '#334155' }}>
                        {user.phone || '—'}
                      </span>
                    </td>

                    {/* Joined Date */}
                    <td>
                      <span style={{ color: '#64748b', fontSize: '0.8rem' }}>
                        {dateLabel(user.joinedDate)}
                      </span>
                    </td>

                    {/* Portal Login */}
                    <td style={{ textAlign: 'center' }}>
                      {user.hasAccount ? (
                        <span
                          className="portal-access-badge is-active"
                          title="Portal account credentials set"
                        >
                          🔑 Active
                        </span>
                      ) : (
                        <span
                          className="portal-access-badge is-none"
                          title="No portal login credentials set"
                        >
                          No Login
                        </span>
                      )}
                    </td>

                    {/* Status */}
                    <td style={{ textAlign: 'center' }}>
                      <StatusPill status={user.status} />
                    </td>

                    {/* Actions */}
                    <td style={{ textAlign: 'center' }}>
                      <div className="table-actions-row" style={{ justifyContent: 'center' }}>
                        <button
                          type="button"
                          className="action-btn-view"
                          title="View member details"
                          onClick={() => onNavigate(`users/${user.id}`)}
                        >
                          View
                        </button>
                        {canEdit && (
                          <button
                            type="button"
                            className="action-btn-view"
                            style={{ background: '#f8fafc', color: '#475569', borderColor: '#cbd5e1' }}
                            title="Edit member details"
                            onClick={() => onNavigate(`users/${user.id}/edit`)}
                          >
                            Edit
                          </button>
                        )}
                        {canEdit && (
                          <button
                            type="button"
                            className="action-btn-view"
                            style={{ background: '#fef3c7', color: '#92400e', borderColor: '#fde68a' }}
                            title="Manage portal credentials"
                            onClick={() => onOpenAccountModal(user)}
                          >
                            🔑
                          </button>
                        )}
                        {user.phone && (
                          <button
                            type="button"
                            className="action-btn-wa"
                            title="Send notice via WhatsApp"
                            onClick={() => openWhatsAppForUser(user)}
                          >
                            WA
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        {filtered.length > 0 && (
          <div className="table-pagination-bar">
            <div className="pagination-info">
              <span>
                Showing <strong>{filtered.length ? start + 1 : 0}–{Math.min(start + rowsPerPage, filtered.length)}</strong> of <strong>{filtered.length}</strong> members
              </span>
              <div className="pagination-rows">
                <label>Rows:</label>
                <select
                  value={rowsPerPage}
                  onChange={(e) => {
                    setRowsPerPage(Number(e.target.value))
                    setPage(1)
                  }}
                  className="filter-select filter-select--sm"
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                </select>
              </div>
            </div>

            <div className="pagination-nav">
              <button
                type="button"
                className="pagination-btn"
                disabled={currentPage === 1 || loading}
                onClick={() => setPage(currentPage - 1)}
                aria-label="Previous page"
              >
                <UiIcon name="chevronLeft" />
              </button>
              {pageNumbers.map((num) => (
                <button
                  key={num}
                  type="button"
                  className={`pagination-btn ${currentPage === num ? 'is-active' : ''}`}
                  onClick={() => setPage(num)}
                >
                  {num}
                </button>
              ))}
              <button
                type="button"
                className="pagination-btn"
                disabled={currentPage === pageCount || loading}
                onClick={() => setPage(currentPage + 1)}
                aria-label="Next page"
              >
                <UiIcon name="chevronRight" />
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  )
}

function UserDetails({ user, canEdit, onNavigate, onOpenAccountModal }) {
  const details = [
    ['User ID', `#${user.id.slice(-6).toUpperCase()}`],
    ['Email Address', user.email || 'No email added'],
    ['Phone Number', user.phone || '—'],
    ['Room Number', user.roomNumber ? `Room ${user.roomNumber}` : 'Unassigned'],
    ['Birthday', user.birthday ? dateLabel(user.birthday) : 'Not provided'],
    ['Joined Date', dateLabel(user.joinedDate)],
    ['Departure Date', user.leftDate ? dateLabel(user.leftDate) : 'Still Active'],
    ['Portal Login', user.hasAccount ? 'Account Active' : 'No credentials set'],
  ]

  return (
    <div className="card-panel">
      <div className="card-panel-header" style={{ marginBottom: '20px' }}>
        <div className="table-member-cell">
          <AvatarChip name={user.fullName} size="large" />
          <div className="table-member-info">
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', margin: '0 0 4px' }}>
              {user.fullName}
            </h2>
            <div className="table-member-subline">
              <span className="room-badge-chip">
                {user.roomNumber ? `Room ${user.roomNumber}` : 'No Room'}
              </span>
              <StatusPill status={user.status} />
            </div>
          </div>
        </div>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '16px',
          background: '#f8fafc',
          padding: '20px',
          borderRadius: '10px',
          border: '1px solid #e2e8f0',
          marginBottom: '24px',
        }}
      >
        {details.map(([label, value]) => (
          <div key={label}>
            <span
              style={{
                display: 'block',
                fontSize: '0.72rem',
                color: '#64748b',
                textTransform: 'uppercase',
                fontWeight: 700,
                marginBottom: '4px',
              }}
            >
              {label}
            </span>
            <strong style={{ fontSize: '0.9rem', color: '#0f172a' }}>{value}</strong>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
        <button
          type="button"
          className="ghost-button"
          onClick={() => onNavigate('users')}
        >
          Back to Directory
        </button>
        {canEdit && (
          <button
            type="button"
            className="action-btn-view"
            style={{ padding: '8px 14px', fontSize: '0.82rem' }}
            onClick={() => onOpenAccountModal(user)}
          >
            🔑 Manage Member Login
          </button>
        )}
        {canEdit && (
          <button
            type="button"
            className="primary-button"
            onClick={() => onNavigate(`users/${user.id}/edit`)}
          >
            <UiIcon name="edit" /> Edit Member
          </button>
        )}
        {user.phone && (
          <button
            type="button"
            className="action-btn-wa"
            style={{ padding: '8px 14px', fontSize: '0.82rem' }}
            onClick={() => openWhatsAppForUser(user)}
          >
            WhatsApp Notice
          </button>
        )}
      </div>
    </div>
  )
}

function UsersPage({
  users = [],
  filteredUsers = [],
  onSubmit,
  onNavigate,
  route = 'users',
  residentSearch = '',
  savingUser,
  loading,
  canEdit,
  setResidentSearch,
}) {
  const [, userId, action] = route.replace('#', '').split('/')
  const isNew = userId === 'new'
  const isList = !userId
  const user = users.find((item) => item.id === userId)
  const isEdit = action === 'edit'
  const headingRef = useRef(null)

  useEffect(() => {
    headingRef.current?.focus({ preventScroll: true })
  }, [route])

  // Account Modal
  const [accountUser, setAccountUser] = useState(null)
  const [accountEmail, setAccountEmail] = useState('')
  const [accountPassword, setAccountPassword] = useState('')
  const [accountMsg, setAccountMsg] = useState('')
  const [accountErr, setAccountErr] = useState('')
  const [savingAccount, setSavingAccount] = useState(false)

  function openAccountModal(targetUser) {
    setAccountUser(targetUser)
    setAccountEmail(targetUser.email || `${targetUser.phone.replace(/\D/g, '')}@room33.local`)
    setAccountPassword('')
    setAccountMsg('')
    setAccountErr('')
  }

  async function handleSaveAccount(e) {
    e.preventDefault()
    if (!accountPassword || accountPassword.length < 6) {
      setAccountErr('Password must be at least 6 characters.')
      return
    }
    setSavingAccount(true)
    setAccountErr('')
    try {
      const res = await setMemberAccount(accountUser.id, {
        email: accountEmail,
        password: accountPassword,
      })
      setAccountMsg(res.message || 'Credentials updated successfully!')
      setTimeout(() => {
        setAccountUser(null)
      }, 1500)
    } catch (err) {
      setAccountErr(err.message || 'Failed to update credentials.')
    } finally {
      setSavingAccount(false)
    }
  }

  return (
    <div className="boarding-members-page">
      {/* Header */}
      <div className="page-header-flex">
        <div>
          <h1 className="page-title" id="users-page-title" ref={headingRef} tabIndex={-1}>
            {isList ? 'Boarding Members Directory' : isNew ? 'Add New Member' : isEdit ? 'Edit Member Profile' : 'Member Details'}
          </h1>
          <p className="page-subtitle">
            {isList
              ? 'Manage resident profiles, room stays, contact details, and account credentials.'
              : isNew
              ? 'Register a new resident and allocate their room and WhatsApp contact details.'
              : isEdit
              ? 'Keep this resident’s contact and stay details up to date.'
              : 'Detailed resident information, stay history, and login access.'}
          </p>
        </div>

        <div className="page-header-actions">
          {isList ? (
            canEdit && (
              <button
                className="primary-button"
                type="button"
                onClick={() => onNavigate('users/new')}
              >
                <UiIcon name="plus" /> Add Member
              </button>
            )
          ) : (
            <button
              className="ghost-button"
              type="button"
              disabled={savingUser}
              onClick={() => onNavigate('users')}
            >
              <UiIcon name="chevronLeft" /> Back to Directory
            </button>
          )}
        </div>
      </div>

      {/* Main View Router */}
      {isList ? (
        <UserList
          allUsers={users}
          filteredUsers={filteredUsers}
          residentSearch={residentSearch}
          setResidentSearch={setResidentSearch}
          loading={loading}
          canEdit={canEdit}
          onNavigate={onNavigate}
          onOpenAccountModal={openAccountModal}
        />
      ) : loading && !savingUser ? (
        <div className="card-panel">
          <div style={{ textAlign: 'center', padding: '36px', color: '#64748b' }}>
            Loading member details...
          </div>
        </div>
      ) : (isNew || isEdit) && !canEdit ? (
        <div className="card-panel">
          <div style={{ textAlign: 'center', padding: '36px', color: '#b91c1c' }}>
            <strong>Administrator Access Required</strong>
            <p style={{ margin: '6px 0 0', color: '#64748b' }}>
              You do not have permission to add or edit resident profiles.
            </p>
          </div>
        </div>
      ) : isNew || (isEdit && user) ? (
        <div className="card-panel">
          <UserFormPage
            key={userId}
            user={isNew ? null : user}
            users={users}
            savingUser={savingUser}
            onSubmit={onSubmit}
            onNavigate={onNavigate}
          />
        </div>
      ) : user ? (
        <UserDetails
          user={user}
          canEdit={canEdit}
          onNavigate={onNavigate}
          onOpenAccountModal={openAccountModal}
        />
      ) : (
        <div className="card-panel">
          <div style={{ textAlign: 'center', padding: '36px', color: '#64748b' }}>
            <strong>Member not found</strong>
            <p style={{ margin: '6px 0 16px', color: '#94a3b8' }}>
              The selected resident could not be found.
            </p>
            <button
              className="primary-button"
              type="button"
              onClick={() => onNavigate('users')}
            >
              Back to Directory
            </button>
          </div>
        </div>
      )}

      {/* Account Modal for Member Portal Login */}
      {accountUser && (
        <div className="receipt-modal-backdrop" onClick={() => setAccountUser(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-card-header">
              <div>
                <span className="selection-badge">PORTAL ACCESS</span>
                <h3>Member Portal Credentials</h3>
              </div>
              <button
                className="receipt-close-btn"
                type="button"
                onClick={() => setAccountUser(null)}
              >
                <UiIcon name="close" />
              </button>
            </div>
            <form onSubmit={handleSaveAccount} className="modal-form">
              <p className="modal-subtitle">
                Set credentials for <strong>{accountUser.fullName}</strong> to log in and access their personal Member Dashboard.
              </p>
              {accountErr && <div className="app-alert app-alert--error">{accountErr}</div>}
              {accountMsg && <div className="app-alert app-alert--success">{accountMsg}</div>}

              <div className="form-group">
                <label>Login Email / Username</label>
                <input
                  type="email"
                  value={accountEmail}
                  onChange={(e) => setAccountEmail(e.target.value)}
                  className="form-input"
                  required
                />
              </div>

              <div className="form-group">
                <label>Set New Password (min 6 chars)</label>
                <input
                  type="password"
                  value={accountPassword}
                  onChange={(e) => setAccountPassword(e.target.value)}
                  placeholder="Enter secure password"
                  className="form-input"
                  required
                />
              </div>

              <div className="modal-card-footer">
                <button
                  type="button"
                  className="ghost-button"
                  onClick={() => setAccountUser(null)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="primary-button"
                  disabled={savingAccount}
                >
                  {savingAccount ? 'Saving...' : 'Save Member Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default UsersPage
