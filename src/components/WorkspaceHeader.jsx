import { useState } from 'react'
import UiIcon from './UiIcon'
import { useAuth } from '../hooks/useAuth'

const pageTitles = {
  overview: 'Dashboard',
  categoryBills: 'Monthly Bills & Distribution',
  discounts: 'Monthly Member Discounts',
  balances: 'Outstanding Balances',
  payments: 'Payment Management',
  users: 'Boarding Members Directory',
  reports: 'Reports & Analytics',
  whatsappNotices: 'WhatsApp Notifications',
  billing: 'Combined Utility Bill',
  settings: 'Settings',
}

function WorkspaceHeader({
  activePage = 'overview',
  onNavigate,
  residentSearch,
  setResidentSearch,
  pendingUsers = 0,
  onToggleMobile,
  selectedMonth,
  onMonthChange,
}) {
  const { user, logout } = useAuth()
  const [showProfileMenu, setShowProfileMenu] = useState(false)

  const isMember = user?.role === 'member'
  const memberTitles = {
    overview: 'My Dashboard',
    categoryBills: 'My Monthly Bills',
    payments: 'My Receipts & History',
  }
  const currentTitle = isMember
    ? (memberTitles[activePage] || 'My Dashboard')
    : (pageTitles[activePage] || 'Dashboard')

  return (
    <header className="workspace-header">
      <div className="workspace-header__left">
        {onToggleMobile && (
          <button
            className="workspace-header__mobile-toggle"
            type="button"
            onClick={onToggleMobile}
            aria-label="Toggle navigation"
          >
            <UiIcon name="menu" />
          </button>
        )}
        <div className="header-title-box">
          <h2 className="workspace-header__title">{currentTitle}</h2>
        </div>
      </div>

      <div className="workspace-header__center">
        {user?.role === 'admin' && (
          <form
            className="workspace-search-bar"
            onSubmit={(e) => {
              e.preventDefault()
              onNavigate('users')
            }}
          >
            <UiIcon name="search" className="workspace-search-bar__icon" />
            <input
              type="search"
              placeholder="Search members, rooms, contacts..."
              value={residentSearch || ''}
              onChange={(e) => setResidentSearch?.(e.target.value)}
              aria-label="Search"
            />
          </form>
        )}
      </div>

      <div className="workspace-header__actions">
        {selectedMonth && onMonthChange && (
          <div className="month-picker-wrap">
            <span className="month-picker-icon">📅</span>
            <input
              type="month"
              className="workspace-month-picker"
              value={selectedMonth}
              onChange={(e) => onMonthChange(e.target.value)}
              title="Select billing month"
              aria-label="Select billing month"
            />
          </div>
        )}

        {/* User Profile Button */}
        <div className="workspace-header__action-wrapper">
          <button
            type="button"
            className="workspace-user-profile"
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            aria-expanded={showProfileMenu}
          >
            <div className="workspace-avatar">
              {user?.name ? user.name[0].toUpperCase() : 'U'}
            </div>
            <div className="workspace-user-text">
              <span className="workspace-user-name">{user?.name || 'User'}</span>
              <span className="workspace-user-role">
                {user?.role === 'member' ? 'Resident Member' : 'Administrator'}
              </span>
            </div>
          </button>

          {showProfileMenu && (
            <div className="workspace-profile-dropdown" role="menu">
              <div className="workspace-profile-dropdown__header">
                <strong>{user?.name}</strong>
                <small>{user?.email}</small>
              </div>
              <div className="workspace-profile-dropdown__divider" />
              <button
                type="button"
                className="workspace-profile-dropdown__item is-danger"
                onClick={() => {
                  setShowProfileMenu(false)
                  logout()
                }}
              >
                Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}

export default WorkspaceHeader
