import { apiRequest } from './api'

export function setMemberAccount(residentId, { email, password }) {
  return apiRequest(`/residents/${residentId}/account`, {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  })
}
