import { apiRequest } from './api'

export function fetchCategories() {
  return apiRequest('/category-bills/categories')
}

export function fetchMonthBills(year, month) {
  return apiRequest(`/category-bills?year=${year}&month=${month}`)
}

export function createCategoryBill(billData) {
  return apiRequest('/category-bills', {
    method: 'POST',
    body: JSON.stringify(billData),
  })
}

export function previewDistribution(billId, residentIds) {
  return apiRequest('/category-bills/preview-distribution', {
    method: 'POST',
    body: JSON.stringify({ billId, residentIds }),
  })
}

export function distributeBill(billId, residentIds, sendWhatsApp = true) {
  return apiRequest('/category-bills/distribute', {
    method: 'POST',
    body: JSON.stringify({ billId, residentIds, sendWhatsApp }),
  })
}

export function deleteCategoryBill(billId) {
  return apiRequest(`/category-bills/${billId}`, {
    method: 'DELETE',
  })
}
