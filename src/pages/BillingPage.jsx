import { formatCurrency } from '../utils/formatters'
import { previewShares } from '../utils/billPreview'
import { createUtilityBillMessage } from '../utils/utilityBillMessage'
import WhatsAppMessage from '../components/WhatsAppMessage'

const statusLabels = { pending: 'Pending', sending: 'Processing — check status', sent: 'Accepted by WhatsApp', failed: 'Failed', unknown: 'Check with WhatsApp' }
const readings = [
  ['electricityPreviousDate', 'Previous electricity date', 'date'],
  ['electricityPreviousReading', 'Previous electricity reading', 'number'],
  ['electricityCurrentDate', 'Current electricity date', 'date'],
  ['electricityCurrentReading', 'Current electricity reading', 'number'],
  ['waterReading1Date', 'Water reading date 1', 'date'], ['waterReading1Value', 'Water reading 1', 'number'],
  ['waterReading2Date', 'Water reading date 2', 'date'], ['waterReading2Value', 'Water reading 2', 'number'],
  ['waterReading3Date', 'Water reading date 3', 'date'], ['waterReading3Value', 'Water reading 3', 'number'],
]

export default function BillingPage({ billForm, billPreviewTotal, dashboard, monthLabel, netBillPreviewTotal, onSubmit, savingBill, setBillForm, suggestedShare, loading, sendingMessages, onSendMessages, canEdit, onNavigate }) {
  const locked = Boolean(dashboard.bill)
  const shares = previewShares(netBillPreviewTotal, dashboard.users, billForm.residentIds)
  const update = (key, value) => setBillForm(current => ({ ...current, [key]: value }))
  const toggle = id => setBillForm(current => ({
    ...current, residentIds: current.residentIds.includes(id) ? current.residentIds.filter(value => value !== id) : [...current.residentIds, id],
  }))
  const retryable = dashboard.allocations.some(row => {
    const notice = dashboard.notifications.find(item => item.residentId === row.userId)
    return !notice || ['pending', 'failed'].includes(notice.status)
  })
  const firstShare = shares[0]
  const sample = firstShare ? createUtilityBillMessage({
    monthLabel, electricity: billForm.electricity, water: billForm.water,
    memberCount: shares.length, share: firstShare.amount, previousArrears: firstShare.previousArrears,
    sharedCredit: billForm.sharedCredit, dueDate: billForm.dueDate,
  }).message : 'Select residents to preview their WhatsApp bill notice.'

  return (
    <section className="billing-flow">
      <div className="billing-flow-steps" aria-label="Monthly billing steps">
        <span><b>1</b> Add monthly bills</span><span><b>2</b> Choose residents</span><span><b>3</b> Share on WhatsApp</span>
      </div>
      <article className="panel">
        <div className="panel-head">
          <div><p className="panel-kicker">{locked ? 'Saved monthly bill' : 'Create a monthly bill'}</p><h2>{monthLabel}</h2></div>
          <div className="metric-chip"><span>{locked ? 'Saved total' : 'Total to split'}</span><strong>{formatCurrency(netBillPreviewTotal)}</strong></div>
        </div>
        {locked && <p className="bill-lock-note">This month is saved. Amounts and residents are locked so messages and payments keep the same bill details.</p>}
        <form onSubmit={onSubmit}>
          <fieldset className="stacked-form bill-fieldset" disabled={loading || savingBill || locked || !canEdit}>
            <div className="field-grid bill-amount-fields">
              <label className="field"><span>Electricity bill (LKR)</span><input required type="number" min="0" step="0.01" value={billForm.electricity} onChange={event => update('electricity', event.target.value)} /></label>
              <label className="field"><span>Water bill (LKR)</span><input required type="number" min="0" step="0.01" value={billForm.water} onChange={event => update('water', event.target.value)} /></label>
              <label className="field"><span>Shared credit (LKR)</span><input required type="number" min="0" max={billPreviewTotal} step="0.01" value={billForm.sharedCredit} onChange={event => update('sharedCredit', event.target.value)} /></label>
              <label className="field"><span>Payment due date</span><input type="date" value={billForm.dueDate} onChange={event => update('dueDate', event.target.value)} /></label>
            </div>
            <section className="form-section">
              <div className="panel-head">
                <div><h3>Who stayed this month?</h3><p className="form-hint">Select everyone sharing this bill. Each selected person pays an equal share.</p></div>
                <span className="selection-count">{billForm.residentIds.length} selected</span>
              </div>
              {!locked && dashboard.users.filter(u => u.status === 'active').length > 0 && <div className="selection-actions">
                <button type="button" className="ghost-button" onClick={() => update('residentIds', dashboard.users.filter(u => u.status === 'active').map(user => user.id))}>Select all</button>
                <button type="button" className="ghost-button" onClick={() => update('residentIds', [])}>Clear selection</button>
              </div>}
              {dashboard.users.filter(u => u.status === 'active').length === 0 ? <div className="empty-state"><h3>Add residents first</h3><p>Each resident needs a name and a WhatsApp phone number.</p><button className="ghost-button" type="button" onClick={() => onNavigate('users')}>Add residents</button></div> : <div className="resident-selection">
                {dashboard.users.filter(u => u.status === 'active').map(user => <label key={user.id} className={`resident-choice${billForm.residentIds.includes(user.id) ? ' is-selected' : ''}`}>
                  <input type="checkbox" checked={billForm.residentIds.includes(user.id)} onChange={() => toggle(user.id)} />
                  <span><strong>{user.fullName}</strong><small>{user.roomNumber ? `Room ${user.roomNumber} · ` : ''}{user.phone}</small></span>
                </label>)}
              </div>}
            </section>
            <details className="meter-details"><summary>Meter readings & notes (optional)</summary>
              <div className="field-grid reading-grid">{readings.map(([key, label, type]) => <label className="field" key={key}><span>{label}</span><input type={type} min={type === 'number' ? '0' : undefined} step={type === 'number' ? '0.01' : undefined} value={billForm[key]} onChange={event => update(key, event.target.value)} /></label>)}</div>
              <label className="field"><span>Notes</span><textarea rows="3" value={billForm.notes} onChange={event => update('notes', event.target.value)} /></label>
            </details>
            {!locked && <div className="split-review">
              <div><span>Equal share · {shares.length} residents</span><strong>{formatCurrency(suggestedShare)}<small> / person</small></strong><p>Any remaining cents are distributed one at a time so all shares add up exactly.</p>
                <ul className="share-preview">{shares.map(person => <li key={person.id}><span>{person.fullName}</span><b>{formatCurrency(person.amount)}</b></li>)}</ul>
              </div>
              <div className="whatsapp-preview"><span>WhatsApp message preview{firstShare ? ` · ${firstShare.fullName}` : ''}</span><WhatsAppMessage message={sample} /><small>Previous arrears are calculated from this resident’s earlier bills and recorded payments.</small></div>
            </div>}
            {!locked && <div className="bill-submit-area">
              <label className="send-toggle"><input type="checkbox" checked={billForm.sendNotifications} onChange={event => update('sendNotifications', event.target.checked)} /><span>Send each resident their bill on WhatsApp when saving</span></label>
              {!dashboard.delivery.ready && <p className="delivery-note">{dashboard.delivery.reason || 'Checking WhatsApp availability…'}</p>}
              <div className="form-footer"><p>Review the residents and amounts before saving. Saved monthly bills are final.</p><button className="primary-button" type="submit" disabled={!shares.length || savingBill}>{savingBill ? 'Saving & processing…' : billForm.sendNotifications ? 'Save & send WhatsApp' : 'Save bill & messages'}</button></div>
            </div>}
          </fieldset>
        </form>
      </article>
      {locked && <article className="panel message-panel">
        <div className="panel-head"><div><p className="panel-kicker">WhatsApp bill notices</p><h2>Each resident&apos;s share</h2><p className="form-hint">Accepted means WhatsApp received the message request; phone delivery is not yet confirmed.</p></div>
          <button type="button" className="primary-button" disabled={!canEdit || loading || sendingMessages || !retryable || !dashboard.delivery.ready} onClick={() => onSendMessages()}>{sendingMessages ? 'Processing messages…' : 'Send pending / retry failed'}</button>
        </div>
        {!dashboard.delivery.ready && <p className="delivery-note">{dashboard.delivery.reason}</p>}
        <div className="table-shell"><table><thead><tr><th>Resident</th><th>WhatsApp number</th><th>Bill share</th><th>Message status</th><th>Message</th></tr></thead><tbody>
          {dashboard.allocations.map(row => {
            const notice = dashboard.notifications.find(item => item.residentId === row.userId)
            return <tr key={row.id}><td><strong>{row.fullName}</strong><small className="table-secondary">{row.roomNumber && `Room ${row.roomNumber}`}</small></td><td>{notice?.phone || row.phone}</td><td>{formatCurrency(row.shareAmount)}</td><td>
              <span className={`status-pill ${notice?.status || 'pending'}`}>{statusLabels[notice?.status || 'pending']}</span>
              {notice?.error && <small className="message-error">{notice.error}</small>}
              {(!notice || ['pending', 'failed'].includes(notice.status)) && <button className="text-button" type="button" disabled={!canEdit || sendingMessages || !dashboard.delivery.ready} onClick={() => onSendMessages(row.userId)}>Send to this resident</button>}
            </td><td>{notice ? <details className="message-body"><summary>View message</summary><WhatsAppMessage message={notice.message} /></details> : 'Message will be prepared when sending.'}</td></tr>
          })}
        </tbody></table></div>
      </article>}
    </section>
  )
}
