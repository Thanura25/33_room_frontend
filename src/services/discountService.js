import { apiRequest } from './api'

export const fetchMonthDiscount = (year, month) =>
  apiRequest(`/discounts?year=${year}&month=${month}`)

export const fetchDiscountHistory = () =>
  apiRequest('/discounts')

export const previewDiscountAllocation = ({ year, month, totalDiscount, residentIds, memberCount }) =>
  apiRequest('/discounts/preview', {
    method: 'POST',
    body: JSON.stringify({ year, month, totalDiscount, residentIds, memberCount }),
  })

export const saveMonthDiscount = ({ year, month, totalDiscount, reason, residentIds, memberCount }) =>
  apiRequest('/discounts', {
    method: 'POST',
    body: JSON.stringify({ year, month, totalDiscount, reason, residentIds, memberCount }),
  })

export const deleteMonthDiscount = (year, month) =>
  apiRequest(`/discounts?year=${year}&month=${month}`, {
    method: 'DELETE',
  })
