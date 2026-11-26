import { apiRequest as request } from '../services/api'

export function fetchHealthCheck() {
  return request('/health', { auth: false })
}

export function fetchUsers() {
  return request('/users')
}

export function fetchUserProfile(userId) {
  return request(`/users/${userId}`)
}

export async function fetchDashboardData(month) {
  return request(`/dashboard?month=${encodeURIComponent(month)}`)
}

export async function saveMonthlyBill(month, billForm) {
  return request(`/bills/${month}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      title: 'Electricity and Water Bill',
      residentIds: billForm.residentIds,
      sendNotifications: billForm.sendNotifications,
      dueDate: billForm.dueDate || null,
      electricity: billForm.electricity,
      water: billForm.water,
      sharedCredit: billForm.sharedCredit,
      electricityPreviousDate: billForm.electricityPreviousDate || null,
      electricityPreviousReading: billForm.electricityPreviousReading || null,
      electricityCurrentDate: billForm.electricityCurrentDate || null,
      electricityCurrentReading: billForm.electricityCurrentReading || null,
      waterReading1Date: billForm.waterReading1Date || null,
      waterReading1Value: billForm.waterReading1Value || null,
      waterReading2Date: billForm.waterReading2Date || null,
      waterReading2Value: billForm.waterReading2Value || null,
      waterReading3Date: billForm.waterReading3Date || null,
      waterReading3Value: billForm.waterReading3Value || null,
      internet: 0,
      maintenance: 0,
      other: 0,
      notes: billForm.notes || null,
    }),
  })
}

export async function saveResident(userForm) {
  const method = userForm.id ? 'PUT' : 'POST'
  const path = userForm.id ? `/residents/${userForm.id}` : '/residents'
  return request(path, {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: userForm.fullName,
      phone_number: userForm.phone,
      status: userForm.status,
      room_number: userForm.roomNumber,
      email: userForm.email,
      birthday: userForm.birthday || null,
      joined_date: userForm.joinedDate || null,
      left_date: userForm.leftDate || null,
    }),
  })
}

export async function updateAllocationPayment(allocationId, draft) {
  return request(`/allocations/${allocationId}/payment`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(draft),
  })
}
