import { expireSession, getToken } from '../utils/authSession.js'

export class ApiError extends Error {
  constructor(message, status = 0, field = null) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.field = field
  }
}

export async function requestJson(url, { auth = true, ...options } = {}) {
  const token = auth ? getToken() : null
  const headers = new Headers(options.headers)
  if (!headers.has('Accept')) headers.set('Accept', 'application/json')
  if (typeof options.body === 'string' && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }
  if (token) headers.set('Authorization', `Bearer ${token}`)

  let response
  try {
    response = await fetch(url, { ...options, headers })
  } catch (error) {
    if (error.name === 'AbortError') throw error
    throw new ApiError('Cannot reach the billing API. Check that the server is running.')
  }

  if (response.status === 401 && auth) {
    expireSession(token)
    throw new ApiError('Your session has expired. Please sign in again.', 401)
  }

  const text = await response.text()
  let payload = null
  if (text) {
    try {
      payload = JSON.parse(text)
    } catch {
      throw new ApiError('The API returned an invalid response.', response.status)
    }
  }
  if (!response.ok) {
    throw new ApiError(payload?.message || 'The API request failed.', response.status, payload?.field)
  }
  return payload
}
