export const SESSION_EXPIRED_EVENT = 'room33:session-expired'
export const TOKEN_KEY = 'room33_token'
export const USER_KEY = 'room33_user'

export function getToken() {
  return localStorage.getItem(TOKEN_KEY)
}

export function readSession() {
  try {
    const token = getToken()
    const user = JSON.parse(localStorage.getItem(USER_KEY) || 'null')
    return token && user?.id ? { token, user } : null
  } catch {
    return null
  }
}

export function saveSession({ token, user }) {
  if (!token || !user?.id) throw new Error('The server returned an invalid login response.')
  localStorage.setItem(TOKEN_KEY, token)
  localStorage.setItem(USER_KEY, JSON.stringify(user))
}

export function clearSession() {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(USER_KEY)
}

export function expireSession(requestToken) {
  // An older request must not clear a session established by a later login.
  if (getToken() !== requestToken) return
  clearSession()
  window.dispatchEvent(new Event(SESSION_EXPIRED_EVENT))
}
