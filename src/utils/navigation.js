import { pageIds } from '../constants/dashboard'

export function getPageFromHash(hash) {
  const page = hash.replace('#', '').split('/')[0]
  return pageIds.includes(page) ? page : 'overview'
}
