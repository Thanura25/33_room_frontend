import { useState } from 'react'
import UiIcon from '../components/UiIcon'

export default function WhatsAppNoticesPage({
  dashboard,
  selectedMonth,
  onSendMessages,
  sendingMessages = false,
}) {
  const [copiedId, setCopiedId] = useState(null)
  const notifications = dashboard?.notifications || []
  const delivery = dashboard?.delivery || {}

  const sentCount = notifications.filter((n) => n.status === 'sent').length
  const failedCount = notifications.filter((n) => n.status === 'failed').length
  const pendingCount = notifications.filter((n) => n.status === 'pending').length

  function handleOpenWhatsApp(notice) {
    const cleanPhone = (notice.phone || '').replace(/\D/g, '')
    const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(notice.message)}`
    window.open(url, '_blank')
  }

  function handleCopyMessage(notice) {
    navigator.clipboard.writeText(notice.message)
    setCopiedId(notice.id)
    setTimeout(() => setCopiedId(null), 2500)
  }

  return (
    <div className="whatsapp-notices-page">
      {/* Header */}
      <div className="page-header-flex">
        <div>
          <h1 className="page-title">WhatsApp Bill Notices & Delivery</h1>
          <p className="page-subtitle">
            Track message statuses, send pending notices via Cloud API, or use direct WhatsApp Click-to-Chat fallback.
          </p>
        </div>
        <div className="dashboard-quick-actions">
          <button
            type="button"
            className="primary-button"
            disabled={sendingMessages || !dashboard.bill || (!delivery.ready && !notifications.length)}
            onClick={() => onSendMessages()}
          >
            {sendingMessages ? 'Processing Messages...' : 'Send / Retry Cloud API'}
          </button>
        </div>
      </div>

      {/* Cloud API Delivery Status Banner */}
      <div className={`delivery-status-banner ${delivery.ready ? 'is-ready' : 'is-warning'}`}>
        <div className="delivery-banner-icon">
          <UiIcon name={delivery.ready ? 'check' : 'alert'} />
        </div>
        <div className="delivery-banner-content">
          <h4>
            {delivery.ready
              ? `Meta WhatsApp Cloud API Connected (${delivery.senderPhoneNumber || 'Active'})`
              : 'WhatsApp Cloud API Configuration Notice'}
          </h4>
          <p>
            {delivery.ready
              ? 'Automatic template dispatch is active. Messages are delivered directly through Meta WhatsApp Business API.'
              : delivery.reason ||
                'Meta WhatsApp Cloud API credentials are not fully configured. You can use the instant Click-to-Chat button below to send prefilled notices to members directly!'}
          </p>
        </div>
      </div>

      {/* Summary Stat Grid */}
      <div className="balances-metrics-grid mt-4">
        <div className="metric-card">
          <span className="metric-card__label">Total Bill Notices</span>
          <strong className="metric-card__value is-indigo">{notifications.length}</strong>
          <span className="metric-card__hint">Generated for this month</span>
        </div>
        <div className="metric-card">
          <span className="metric-card__label">Accepted / Sent</span>
          <strong className="metric-card__value is-success">{sentCount}</strong>
          <span className="metric-card__hint">Delivered via API</span>
        </div>
        <div className="metric-card">
          <span className="metric-card__label">Pending</span>
          <strong className="metric-card__value is-primary">{pendingCount}</strong>
          <span className="metric-card__hint">Awaiting delivery</span>
        </div>
        <div className="metric-card">
          <span className="metric-card__label">Failed / Need Retry</span>
          <strong className="metric-card__value is-danger">{failedCount}</strong>
          <span className="metric-card__hint">Click chat fallback available</span>
        </div>
      </div>

      {/* Notifications Table */}
      <div className="card-panel mt-6">
        <div className="card-panel-header">
          <div>
            <h3>Member WhatsApp Notices</h3>
            <p className="panel-subtext">Click &quot;Open in WhatsApp&quot; to send via web/mobile WhatsApp instantly with prefilled message.</p>
          </div>
        </div>

        {notifications.length === 0 ? (
          <div className="empty-state">
            <p>No WhatsApp notifications generated for this month yet.</p>
            <small className="text-muted">Save and distribute a monthly bill to generate notices.</small>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="modern-table">
              <thead>
                <tr>
                  <th>Recipient</th>
                  <th>Phone Number</th>
                  <th>Delivery Status</th>
                  <th>Message Preview</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {notifications.map((n) => {
                  const alloc = dashboard?.allocations?.find((a) => a.userId === n.residentId)
                  const statusClass =
                    n.status === 'sent' ? 'paid' : n.status === 'failed' ? 'overdue' : 'pending'

                  return (
                    <tr key={n.id}>
                      <td>
                        <strong>{alloc?.fullName || 'Resident'}</strong>
                        <small className="block text-muted">{alloc?.roomNumber ? `Room ${alloc.roomNumber}` : ''}</small>
                      </td>
                      <td>
                        <code>{n.phone}</code>
                      </td>
                      <td>
                        <span className={`status-pill ${statusClass}`}>
                          {n.status === 'sent' ? 'Accepted by Meta' : n.status === 'failed' ? 'Failed' : 'Pending'}
                        </span>
                        {n.error && <small className="block text-danger mt-1">{n.error}</small>}
                      </td>
                      <td>
                        <div className="message-snippet-box">
                          <pre>{n.message}</pre>
                        </div>
                      </td>
                      <td>
                        <div className="action-buttons-wrap">
                          <button
                            type="button"
                            className="action-btn-wa"
                            onClick={() => handleOpenWhatsApp(n)}
                            title="Open WhatsApp with prefilled bill notice"
                          >
                            Open in WhatsApp
                          </button>
                          <button
                            type="button"
                            className="ghost-button ghost-button--small"
                            onClick={() => handleCopyMessage(n)}
                            title="Copy full message to clipboard"
                          >
                            {copiedId === n.id ? 'Copied!' : 'Copy'}
                          </button>
                          {delivery.ready && ['pending', 'failed'].includes(n.status) && (
                            <button
                              type="button"
                              className="text-link-btn"
                              disabled={sendingMessages}
                              onClick={() => onSendMessages(n.residentId)}
                            >
                              Retry API
                            </button>
                          )}
                        </div>
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
  )
}
