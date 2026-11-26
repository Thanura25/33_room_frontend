import { apiRequest } from './api'

export const getNotifications = () => apiRequest('/notifications')
export const sendBillNotifications = (billId, residentId) => apiRequest(`/bills/${billId}/notifications`, {
  method: 'POST',
  body: JSON.stringify({ resident_id: residentId }),
})
export const sendWhatsAppNotification = (notification) => apiRequest('/notifications/send', {
  method: 'POST',
  body: JSON.stringify(notification),
})
