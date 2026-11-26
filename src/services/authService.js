import { apiRequest } from './api'
export const getSetupStatus = () => apiRequest('/auth/setup', { auth: false })

export const login = (credentials) => apiRequest('/auth/login', { auth: false, method: 'POST', body: JSON.stringify(credentials) })
export const register = (user) => apiRequest('/auth/register', { auth: false, method: 'POST', body: JSON.stringify(user) })
