export const utilityBillTemplate = {
  name: 'room33_monthly_utility_bill_v2',
  version: 2,
  body: [
    '🏠 *Monthly Utility Bill – {{1}}*',
    '⚡ *Electricity Bill:* Rs. {{2}}',
    '💧 *Water Bill:* Rs. {{3}}',
    '👥 *Total Members:* {{4}}',
    '💰 *Current Month Total:*',
    'Rs. {{5}}',
    '👤 *Amount per Person:*',
    'Rs. {{6}}',
    '📌 *Previous Outstanding Payments:*',
    '🔸 *Total Previous Arrears:* Rs. {{7}}',
    '━━━━━━━━━━━━━━',
    '✅ *FINAL TOTAL TO PAY:*',
    '*Rs. {{8}}*',
    '━━━━━━━━━━━━━━',
    'Please make the payment for *{{9}}* before *{{10}}*.',
    'Thank you! 🙏',
  ].join('\n'),
}

const numberFormat = new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const cents = value => Math.round(Number(value || 0) * 100)
const money = value => numberFormat.format(value / 100)

export function createUtilityBillMessage({ monthLabel, electricity, water, memberCount, share, previousArrears = 0, manualAdjustment = 0, paidAmount = 0, sharedCredit = 0, dueDate }) {
  if (!Number.isInteger(memberCount) || memberCount < 1) throw new Error('At least one bill member is required.')
  const month = monthLabel.replace(/ (\d{4})$/, ' / $1')
  const due = dueDate ? String(dueDate).slice(0, 10) : 'the agreed due date'
  const currentTotal = cents(electricity) + cents(water)
  const arrears = Math.max(0, cents(previousArrears))
  const adjustment = cents(manualAdjustment)
  const paid = cents(paidAmount)
  const finalTotal = Math.max(0, cents(share) + arrears + adjustment - paid)
  // Keep optional accounting explanations inside single-line template values.
  const shareText = money(cents(share)) + (cents(sharedCredit) > 0 ? ' (after Rs. ' + money(cents(sharedCredit)) + ' total shared credit)' : '')
  const notes = []
  if (adjustment) notes.push((adjustment > 0 ? '+' : '-') + 'Rs. ' + money(Math.abs(adjustment)) + ' adjustment')
  if (paid) notes.push('Rs. ' + money(paid) + ' already paid')
  const finalText = money(finalTotal) + (notes.length ? ' (' + notes.join('; ') + ')' : '')
  const parameters = [month, money(cents(electricity)), money(cents(water)), String(memberCount), money(currentTotal), shareText, money(arrears), finalText, month, due]
  return {
    message: utilityBillTemplate.body.replace(/\{\{(\d+)\}\}/g, (_, position) => parameters[Number(position) - 1]),
    template_parameters: parameters,
    message_version: utilityBillTemplate.version,
  }
}
