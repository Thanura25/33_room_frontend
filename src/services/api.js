import { API_URL } from '../constants/dashboard'
import { requestJson } from './request'

export async function apiRequest(path, options = {}) {
  return requestJson(`${API_URL}${path}`, options)
}
