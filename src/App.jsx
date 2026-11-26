import { useDeferredValue, useEffect, useState } from 'react'
import './App.css'
import FeedbackBanner from './components/FeedbackBanner'
import Sidebar from './components/Sidebar'
import WorkspaceHeader from './components/WorkspaceHeader'
import './WorkspaceTheme.css'
import './BillingFlow.css'
import { chargeFields } from './constants/dashboard'
import BillingPage from './pages/BillingPage'
import AdminDashboardPage from './pages/AdminDashboardPage'
import CategoryBillsPage from './pages/CategoryBillsPage'
import MonthlyDiscountsPage from './pages/MonthlyDiscountsPage'
import OutstandingBalancesPage from './pages/OutstandingBalancesPage'
import PaymentsManagementPage from './pages/PaymentsManagementPage'
import MemberDashboardPage from './pages/MemberDashboardPage'
import MemberMonthlyBillsPage from './pages/MemberMonthlyBillsPage'
import MemberReceiptsHistoryPage from './pages/MemberReceiptsHistoryPage'
import ReportsPage from './pages/ReportsPage'
import WhatsAppNoticesPage from './pages/WhatsAppNoticesPage'
import UsersPage from './pages/UsersPage'
import {
  fetchDashboardData,
  saveMonthlyBill,
  saveResident,
  updateAllocationPayment,
} from './utils/api'
import { formatMonthLabel, getMonthValue } from './utils/date'
import {
  createBillForm,
  createEmptyDashboard,
  createPaymentDrafts,
} from './utils/forms'
import { getPageFromHash } from './utils/navigation'
import { useAuth } from './hooks/useAuth'
import Login from './pages/Login'
import { sendBillNotifications } from './services/notificationService'

function Dashboard() {
  const { user } = useAuth()
  const initialMonth = getMonthValue()
  const [activeRoute, setActiveRoute] = useState(window.location.hash)
  const activePage = getPageFromHash(activeRoute)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [selectedMonth, setSelectedMonth] = useState(initialMonth)
  const [dashboard, setDashboard] = useState(createEmptyDashboard(initialMonth))
  const [billForm, setBillForm] = useState(createBillForm(initialMonth))
  const [paymentDrafts, setPaymentDrafts] = useState({})
  const [residentSearch, setResidentSearch] = useState('')
  const deferredResidentSearch = useDeferredValue(residentSearch)
  const [loading, setLoading] = useState(true)
  const [savingBill, setSavingBill] = useState(false)
  const [savingUser, setSavingUser] = useState(false)
  const [sendingMessages, setSendingMessages] = useState(false)
  const [updatingPaymentId, setUpdatingPaymentId] = useState(null)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [preselectedMember, setPreselectedMember] = useState(null)

  function syncDashboard(month, payload) {
    setDashboard(payload)
    setBillForm(createBillForm(month, payload.bill, payload.users))
    setPaymentDrafts(createPaymentDrafts(payload.allocations))
  }

  function resetDashboardState(month, errorMessage) {
    setDashboard(createEmptyDashboard(month))
    setBillForm(createBillForm(month))
    setPaymentDrafts({})
    setError(errorMessage)
  }

  async function refreshDashboard(month) {
    setLoading(true)
    setError('')

    try {
      const payload = await fetchDashboardData(month)
      syncDashboard(month, payload)
    } catch (requestError) {
      resetDashboardState(month, requestError.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    let active = true

    async function run() {
      setLoading(true)
      setError('')

      try {
        const payload = await fetchDashboardData(selectedMonth)

        if (active) {
          syncDashboard(selectedMonth, payload)
        }
      } catch (requestError) {
        if (active) {
          resetDashboardState(selectedMonth, requestError.message)
        }
      } finally {
        if (active) {
          setLoading(false)
        }
      }
    }

    run()

    return () => {
      active = false
    }
  }, [selectedMonth])

  useEffect(() => {
    function handleHashChange() {
      setActiveRoute(window.location.hash)
    }

    window.addEventListener('hashchange', handleHashChange)

    return () => {
      window.removeEventListener('hashchange', handleHashChange)
    }
  }, [])

  const filteredUsers = dashboard.users.filter((user) => {
    const query = deferredResidentSearch.trim().toLowerCase()

    if (!query) {
      return true
    }

    return [user.fullName, user.roomNumber, user.email, user.phone]
      .filter(Boolean)
      .some((value) => value.toLowerCase().includes(query))
  })

  const billPreviewTotal = chargeFields.reduce(
    (sum, field) => sum + Number(billForm[field.key] || 0),
    0,
  )
  const netBillPreviewTotal = Math.max(
    billPreviewTotal - Number(billForm.sharedCredit || 0),
    0,
  )
  const suggestedShare =
    billForm.residentIds.length > 0
      ? netBillPreviewTotal / billForm.residentIds.length
      : 0
  const monthLabel = formatMonthLabel(selectedMonth)

  async function handleBillSubmit(event) {
    event.preventDefault()
    if (loading || savingBill || dashboard.bill) return
    setSavingBill(true)
    setError('')
    setMessage('')

    try {
      const payload = await saveMonthlyBill(selectedMonth, billForm)
      syncDashboard(selectedMonth, payload)
      setMessage(`Bill saved and split between ${payload.allocations.length} residents. ${deliverySummary(payload)}`)
      if (payload.notificationError) setError(payload.notificationError)
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setSavingBill(false)
    }
  }

  async function handleUserSubmit(event, userForm) {
    event.preventDefault()
    if (loading || savingUser || user.role !== 'admin') return false
    setSavingUser(true)
    setError('')
    setMessage('')

    try {
      await saveResident(userForm)
      await refreshDashboard(selectedMonth)
      if (!userForm.id) setResidentSearch('')
      setMessage(
        userForm.id
          ? 'Resident updated. Saved monthly bills keep their original details.'
          : 'Resident added. Select them when creating a monthly bill.',
      )
      return { saved: true }
    } catch (requestError) {
      return { saved: false, message: requestError.message, field: requestError.field }
    } finally {
      setSavingUser(false)
    }
  }

  async function handlePaymentSubmit(allocationId) {
    if (loading || updatingPaymentId || user.role !== 'admin') return
    setUpdatingPaymentId(allocationId)
    setError('')
    setMessage('')

    try {
      const payload = await updateAllocationPayment(
        allocationId,
        paymentDrafts[allocationId],
      )
      syncDashboard(selectedMonth, payload)
      setMessage('Payment status updated.')
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setUpdatingPaymentId(null)
    }
  }

  function navigateToPage(pageId) {
    window.location.hash = pageId
    setActiveRoute(`#${pageId}`)
  }

  function handleRecordPaymentForMember(member) {
    setPreselectedMember(member)
    navigateToPage('payments')
  }

  function deliverySummary(payload) {
    const sent = payload.notifications.filter(item => item.status === 'sent').length
    const failed = payload.notifications.filter(item => item.status === 'failed').length
    const pending = payload.notifications.filter(item => item.status === 'pending').length
    const unknown = payload.notifications.filter(item => ['unknown', 'sending'].includes(item.status)).length
    return `${sent} accepted by WhatsApp, ${pending} pending, ${failed} failed${unknown ? `, ${unknown} need a status check` : ''}.`
  }

  async function handleSendMessages(residentId) {
    if (!dashboard.bill || sendingMessages) return
    setSendingMessages(true)
    setError('')
    setMessage('')
    try {
      const payload = await sendBillNotifications(dashboard.bill.id, residentId)
      syncDashboard(selectedMonth, payload)
      setMessage(deliverySummary(payload))
    } catch (requestError) { setError(requestError.message) }
    finally { setSendingMessages(false) }
  }

  const isMember = user?.role === 'member'

  return (
    <main className={`dashboard-shell${activePage === 'users' ? ' dashboard-shell--users' : ''}`}>
      <Sidebar
        activePage={activePage}
        onNavigate={navigateToPage}
        collapsed={sidebarCollapsed}
        setCollapsed={setSidebarCollapsed}
        mobileOpen={mobileMenuOpen}
        setMobileOpen={setMobileMenuOpen}
      />

      <section className="workspace">
        <WorkspaceHeader
          activePage={activePage}
          onNavigate={navigateToPage}
          residentSearch={residentSearch}
          setResidentSearch={setResidentSearch}
          pendingUsers={dashboard.summary.pendingUsers}
          selectedMonth={selectedMonth}
          onMonthChange={setSelectedMonth}
          onToggleMobile={() => setMobileMenuOpen(!mobileMenuOpen)}
        />

        <FeedbackBanner error={error} message={message} />

        {/* BOARDING MEMBER VIEW */}
        {isMember ? (
          <>
            {activePage === 'overview' && (
              <MemberDashboardPage
                selectedMonth={selectedMonth}
                user={user}
                onNavigate={navigateToPage}
              />
            )}
            {activePage === 'categoryBills' && (
              <MemberMonthlyBillsPage
                selectedMonth={selectedMonth}
                user={user}
                onNavigate={navigateToPage}
              />
            )}
            {activePage === 'payments' && (
              <MemberReceiptsHistoryPage
                selectedMonth={selectedMonth}
                user={user}
                onNavigate={navigateToPage}
              />
            )}
            {!['overview', 'categoryBills', 'payments'].includes(activePage) && (
              <MemberDashboardPage
                selectedMonth={selectedMonth}
                user={user}
                onNavigate={navigateToPage}
              />
            )}
          </>
        ) : (
          /* ADMIN VIEW */
          <>
            {activePage === 'overview' && (
              <AdminDashboardPage
                selectedMonth={selectedMonth}
                dashboard={dashboard}
                users={dashboard.users}
                onNavigate={navigateToPage}
                onRecordPayment={handleRecordPaymentForMember}
              />
            )}

            {activePage === 'categoryBills' && (
              <CategoryBillsPage
                selectedMonth={selectedMonth}
                users={dashboard.users}
                onNavigate={navigateToPage}
                canEdit={user.role === 'admin'}
                onNotificationChange={() => refreshDashboard(selectedMonth)}
              />
            )}

            {activePage === 'discounts' && (
              <MonthlyDiscountsPage
                selectedMonth={selectedMonth}
                onNavigate={navigateToPage}
                canEdit={user.role === 'admin'}
              />
            )}

            {activePage === 'balances' && (
              <OutstandingBalancesPage
                selectedMonth={selectedMonth}
                onRecordPayment={handleRecordPaymentForMember}
                canEdit={user.role === 'admin'}
              />
            )}

            {activePage === 'payments' && (
              <PaymentsManagementPage
                selectedMonth={selectedMonth}
                users={dashboard.users}
                preselectedMember={preselectedMember}
                canEdit={user.role === 'admin'}
                onPaymentSaved={() => {
                  setPreselectedMember(null)
                  refreshDashboard(selectedMonth)
                }}
              />
            )}

            {activePage === 'reports' && (
              <ReportsPage
                selectedMonth={selectedMonth}
                users={dashboard.users}
              />
            )}

            {activePage === 'whatsappNotices' && (
              <WhatsAppNoticesPage
                dashboard={dashboard}
                selectedMonth={selectedMonth}
                onSendMessages={handleSendMessages}
                sendingMessages={sendingMessages}
              />
            )}

            {activePage === 'billing' && (
              <BillingPage
                billForm={billForm}
                billPreviewTotal={billPreviewTotal}
                dashboard={dashboard}
                monthLabel={monthLabel}
                netBillPreviewTotal={netBillPreviewTotal}
                onSubmit={handleBillSubmit}
                savingBill={savingBill}
                setBillForm={setBillForm}
                suggestedShare={suggestedShare}
                loading={loading}
                sendingMessages={sendingMessages}
                onSendMessages={handleSendMessages}
                canEdit={user.role === 'admin'}
                onNavigate={navigateToPage}
              />
            )}

            {activePage === 'users' && (
              <UsersPage
                users={dashboard.users}
                filteredUsers={filteredUsers}
                onSubmit={handleUserSubmit}
                onNavigate={navigateToPage}
                route={activeRoute}
                residentSearch={residentSearch}
                savingUser={savingUser}
                loading={loading}
                canEdit={user.role === 'admin'}
                summary={dashboard.summary}
                setResidentSearch={setResidentSearch}
              />
            )}

            {!['overview', 'categoryBills', 'discounts', 'balances', 'payments', 'users', 'reports', 'whatsappNotices', 'billing', 'settings'].includes(activePage) && (
              <AdminDashboardPage
                selectedMonth={selectedMonth}
                dashboard={dashboard}
                users={dashboard.users}
                onNavigate={navigateToPage}
                onRecordPayment={handleRecordPaymentForMember}
              />
            )}
          </>
        )}
      </section>
    </main>
  )
}

export default function App() {
  const { user } = useAuth()
  return user ? <Dashboard key={user.id} /> : <Login />
}
