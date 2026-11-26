import { apiRequest } from './api'

export function fetchBalances(year, month) {
  return apiRequest(`/financial/balances?year=${year}&month=${month}`)
}

export function recordPayment(paymentData) {
  return apiRequest('/financial/payments', {
    method: 'POST',
    body: JSON.stringify(paymentData),
  })
}

export function fetchPayments(year, month, residentId) {
  const params = new URLSearchParams()
  if (year) params.append('year', year)
  if (month) params.append('month', month)
  if (residentId) params.append('residentId', residentId)
  return apiRequest(`/financial/payments?${params.toString()}`)
}

export function fetchReceipt(receiptId) {
  return apiRequest(`/financial/receipts/${receiptId}`)
}
