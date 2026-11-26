import { apiRequest } from './api'

export function fetchReport({ type, year, month, memberId, category }) {
  const params = new URLSearchParams()
  if (type) params.append('type', type)
  if (year) params.append('year', year)
  if (month) params.append('month', month)
  if (memberId) params.append('memberId', memberId)
  if (category) params.append('category', category)
  return apiRequest(`/reports?${params.toString()}`)
}
