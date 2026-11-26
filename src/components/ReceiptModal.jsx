import { useEffect } from 'react'
import UiIcon from './UiIcon'
import { formatCurrency } from '../utils/formatters'

export default function ReceiptModal({ receipt, onClose }) {
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  if (!receipt) return null

  const formattedDate = receipt.paidDate
    ? new Date(receipt.paidDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
    : new Date().toLocaleDateString('en-GB')

  function handlePrint() {
    window.print()
  }

  function handleDownloadText() {
    const textContent = [
      '====================================================',
      '        ROOM 33 BOARDING HOUSE - PAYMENT RECEIPT    ',
      '====================================================',
      `Receipt No:       ${receipt.receiptNumber}`,
      `Date & Time:      ${formattedDate}`,
      `Resident Name:    ${receipt.memberName}`,
      `Room Number:      ${receipt.roomNumber || 'N/A'}`,
      `Phone Number:     ${receipt.phoneNumber || 'N/A'}`,
      `Billing Period:   ${receipt.month ? `${receipt.month}/${receipt.year}` : 'N/A'}`,
      '----------------------------------------------------',
      `Amount Paid:      Rs. ${receipt.amount?.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
      `Payment Method:   ${(receipt.method || 'cash').toUpperCase()}`,
      `Reference No:     ${receipt.reference || 'N/A'}`,
      receipt.notes ? `Notes:            ${receipt.notes}` : '',
      '----------------------------------------------------',
      `Remaining Due:    Rs. ${(receipt.remainingBalance ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
      `Payment Status:   ${receipt.remainingBalance <= 0 ? 'FULLY PAID' : 'PARTIALLY PAID'}`,
      '====================================================',
      '          Thank you for your prompt payment!         ',
      '====================================================',
    ].filter(Boolean).join('\n')

    const blob = new Blob([textContent], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `Receipt_${receipt.receiptNumber}.txt`
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="receipt-modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div className="receipt-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="receipt-modal-header no-print">
          <h3>Payment Receipt</h3>
          <button className="receipt-close-btn" type="button" onClick={onClose} aria-label="Close">
            <UiIcon name="close" />
          </button>
        </div>

        {/* Printable Receipt Paper */}
        <div className="receipt-paper">
          <div className="receipt-brand">
            <div className="receipt-logo">
              <UiIcon name="logo" />
            </div>
            <div className="receipt-brand-text">
              <h2>ROOM 33 BOARDING</h2>
              <p>Monthly Utility & Expense Management</p>
            </div>
            <div className="receipt-badge-status">
              <span className={`status-pill ${receipt.remainingBalance <= 0 ? 'paid' : 'partial'}`}>
                {receipt.remainingBalance <= 0 ? 'PAID' : 'PARTIALLY PAID'}
              </span>
            </div>
          </div>

          <div className="receipt-divider" />

          <div className="receipt-meta-grid">
            <div>
              <span className="receipt-label">Receipt Number</span>
              <strong className="receipt-value">{receipt.receiptNumber}</strong>
            </div>
            <div>
              <span className="receipt-label">Payment Date</span>
              <strong className="receipt-value">{formattedDate}</strong>
            </div>
            <div>
              <span className="receipt-label">Member Name</span>
              <strong className="receipt-value">{receipt.memberName}</strong>
            </div>
            <div>
              <span className="receipt-label">Room Number</span>
              <strong className="receipt-value">{receipt.roomNumber ? `Room ${receipt.roomNumber}` : 'N/A'}</strong>
            </div>
            {receipt.phoneNumber && (
              <div>
                <span className="receipt-label">Phone</span>
                <span className="receipt-value">{receipt.phoneNumber}</span>
              </div>
            )}
            {receipt.month && receipt.year && (
              <div>
                <span className="receipt-label">Billing Month</span>
                <span className="receipt-value">{`${String(receipt.month).padStart(2, '0')}/${receipt.year}`}</span>
              </div>
            )}
          </div>

          <div className="receipt-divider" />

          <div className="receipt-amount-box">
            <span className="receipt-amount-label">AMOUNT RECEIVED</span>
            <strong className="receipt-amount-value">{formatCurrency(receipt.amount)}</strong>
            <span className="receipt-method">Paid via {(receipt.method || 'cash').replace('_', ' ').toUpperCase()}</span>
            {receipt.reference && <small className="receipt-reference">Ref: {receipt.reference}</small>}
          </div>

          {receipt.notes && (
            <div className="receipt-notes">
              <span className="receipt-label">Payment Note:</span>
              <p>{receipt.notes}</p>
            </div>
          )}

          <div className="receipt-summary-footer">
            <div className="receipt-footer-row">
              <span>Remaining Balance:</span>
              <strong>{formatCurrency(receipt.remainingBalance ?? 0)}</strong>
            </div>
          </div>

          <div className="receipt-footer-stamp">
            <p>Official Boarding House Payment Confirmation</p>
            <small>Thank you for settling your monthly bill!</small>
          </div>
        </div>

        {/* Modal Action Buttons */}
        <div className="receipt-modal-actions no-print">
          <button type="button" className="receipt-btn receipt-btn--primary" onClick={handlePrint}>
            <UiIcon name="download" /> Print Receipt
          </button>
          <button type="button" className="receipt-btn receipt-btn--secondary" onClick={handleDownloadText}>
            Download .TXT
          </button>
          <button type="button" className="receipt-btn receipt-btn--ghost" onClick={onClose}>
            Done
          </button>
        </div>
      </div>
    </div>
  )
}
