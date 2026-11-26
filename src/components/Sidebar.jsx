import { useAuth } from '../hooks/useAuth'
import './Sidebar.css'
import UiIcon from './UiIcon'

const ADMIN_NAV_ITEMS = [
  { id: 'overview', label: 'Financial Dashboard', icon: 'dashboard', page: 'overview' },
  { id: 'categoryBills', label: 'Monthly Bills', icon: 'bill', page: 'categoryBills' },
  { id: 'discounts', label: 'Monthly Discounts', icon: 'discount', page: 'discounts' },
  { id: 'balances', label: 'Outstanding Balances', icon: 'wallet', page: 'balances' },
  { id: 'payments', label: 'Payments & Receipts', icon: 'cashAdvance', page: 'payments' },
  { id: 'users', label: 'Boarding Members', icon: 'users', page: 'users' },
  { id: 'reports', label: 'Reports & Analytics', icon: 'reports', page: 'reports' },
  { id: 'whatsappNotices', label: 'WhatsApp Notices', icon: 'chat', page: 'whatsappNotices' },
  { id: 'billing', label: 'Combined Utility Flow', icon: 'payroll', page: 'billing' },
  { id: 'settings', label: 'Settings', icon: 'settings', page: 'settings' },
]

const MEMBER_NAV_ITEMS = [
  { id: 'overview', label: 'My Dashboard', icon: 'dashboard', page: 'overview' },
  { id: 'categoryBills', label: 'My Monthly Bills', icon: 'bill', page: 'categoryBills' },
  { id: 'payments', label: 'My Receipts & History', icon: 'cashAdvance', page: 'payments' },
]

function Sidebar({
  activePage,
  onNavigate,
  collapsed,
  setCollapsed,
  mobileOpen,
  setMobileOpen,
}) {
  const { user, logout } = useAuth()
  const navItems = user?.role === 'member' ? MEMBER_NAV_ITEMS : ADMIN_NAV_ITEMS

  return (
    <>
      {mobileOpen && (
        <div
          className="room-sidebar__backdrop"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}
      <aside
        className={`room-sidebar${collapsed ? ' is-collapsed' : ''}${mobileOpen ? ' is-mobile-open' : ''}`}
        aria-label="Main Navigation"
      >
        {/* Brand & Header */}
        <div className="room-sidebar__header">
          <div className="room-sidebar__brand">
            <div className="room-sidebar__logo-badge" title="Room 33 Management">
              <UiIcon name="logo" />
            </div>
            {!collapsed && (
              <div className="room-sidebar__brand-text-wrap">
                <span className="room-sidebar__brand-title">Room 33</span>
              </div>
            )}
          </div>
          <button
            className="room-sidebar__collapse-btn"
            type="button"
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            onClick={() => setCollapsed(!collapsed)}
          >
            <UiIcon name="sidebarToggle" />
          </button>
        </div>

        {/* Navigation Items (Clean Flat List without Section Banners) */}
        <nav className="room-sidebar__nav">
          <div className="room-sidebar__items">
            {navItems.map((item) => {
              const isActive = activePage === item.page
              return (
                <button
                  key={item.id}
                  className={`room-sidebar__nav-item${isActive ? ' is-active' : ''}`}
                  type="button"
                  onClick={() => {
                    onNavigate(item.page)
                    if (mobileOpen) setMobileOpen(false)
                  }}
                  title={collapsed ? item.label : undefined}
                >
                  <span className="room-sidebar__nav-icon">
                    <UiIcon name={item.icon} />
                  </span>
                  {!collapsed && (
                    <span className="room-sidebar__nav-label">
                      {item.label}
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        </nav>

        {/* Bottom Profile Footer */}
        {!collapsed && user && (
          <div className="room-sidebar__footer">
            <div className="room-sidebar__user-pill">
              <div className="room-sidebar__user-avatar">
                {user.name ? user.name[0].toUpperCase() : 'U'}
              </div>
              <div className="room-sidebar__user-meta">
                <strong className="room-sidebar__user-name">{user.name}</strong>
                <small className="room-sidebar__user-email">{user.email || 'Online'}</small>
              </div>
              <button
                type="button"
                className="room-sidebar__logout-btn"
                title="Sign out"
                onClick={logout}
              >
                <UiIcon name="close" />
              </button>
            </div>
          </div>
        )}
      </aside>
    </>
  )
}

export default Sidebar
