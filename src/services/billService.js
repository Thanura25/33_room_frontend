import { apiRequest } from './api'

export const createBill = (bill) => apiRequest('/bills', { method: 'POST', body: JSON.stringify(bill) })
export const getBillDetails = (id) => apiRequest(`/bills/${id}`)
