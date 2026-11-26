const moneyFormatter = new Intl.NumberFormat('en-LK', {
  style: 'currency',
  currency: 'LKR',
  minimumFractionDigits: 2,
})

export function formatCurrency(value) {
  return moneyFormatter.format(Number(value ?? 0))
}

export function getStatusLabel(status) {
  switch (status) {
    case 'paid':
      return 'Paid'
    case 'partial':
      return 'Partially paid'
    default:
      return 'Pending'
  }
}
