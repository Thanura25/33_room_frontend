import { apiRequest } from './api'

export function fetchMemberDashboard(year, month, memberId) {
  const params = new URLSearchParams()
  if (year) params.append('year', year)
  if (month) params.append('month', month)
  if (memberId) params.append('memberId', memberId)
  return apiRequest(`/member/dashboard?${params.toString()}`)
}

export function fetchMemberReceipt(receiptId) {
  return apiRequest(`/member/receipts/${receiptId}`)
}
