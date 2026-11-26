import {
  toDateInputValue,
  toDateTimeInputValue,
  toMoneyString,
} from './date'

export function createBillForm(month, bill = null, users = []) {
  return {
    month,
    residentIds: bill?.residentIds ?? users.filter(user => {
      const joined = user.joinedDate ? String(user.joinedDate).slice(0, 7) : ''
      const left = user.leftDate ? String(user.leftDate).slice(0, 7) : ''
      return joined <= month && (left ? left >= month : user.status === 'active')
    }).map(user => user.id),
    sendNotifications: true,
    title: 'Electricity and Water Bill',
    dueDate: toDateInputValue(bill?.dueDate),
    electricity: toMoneyString(bill?.electricity),
    water: toMoneyString(bill?.water),
    sharedCredit: toMoneyString(bill?.sharedCredit),
    electricityPreviousDate: toDateInputValue(bill?.electricityPreviousDate),
    electricityPreviousReading: bill?.electricityPreviousReading ?? '',
    electricityCurrentDate: toDateInputValue(bill?.electricityCurrentDate),
    electricityCurrentReading: bill?.electricityCurrentReading ?? '',
    waterReading1Date: toDateInputValue(bill?.waterReading1Date),
    waterReading1Value: bill?.waterReading1Value ?? '',
    waterReading2Date: toDateInputValue(bill?.waterReading2Date),
    waterReading2Value: bill?.waterReading2Value ?? '',
    waterReading3Date: toDateInputValue(bill?.waterReading3Date),
    waterReading3Value: bill?.waterReading3Value ?? '',
    notes: bill?.notes ?? '',
  }
}

export function createUserForm(user = null) {
  return {
    id: user?.id ?? null,
    fullName: user?.fullName ?? '',
    roomNumber: user?.roomNumber ?? '',
    email: user?.email ?? '',
    phone: user?.phone ?? '',
    birthday: toDateInputValue(user?.birthday) || '',
    status: user?.status ?? 'active',
    joinedDate: toDateInputValue(user?.joinedDate) || new Date().toLocaleDateString('en-CA'),
    leftDate: toDateInputValue(user?.leftDate),
  }
}

export function createEmptyDashboard(month) {
  return {
    month,
    bill: null,
    users: [],
    allocations: [],
    history: [],
    notifications: [],
    delivery: { ready: false, reason: '' },
    billingInsights: {
      monthsRecorded: 0,
      totalBillsAmount: 0,
      totalElectricityAmount: 0,
      totalWaterAmount: 0,
      totalCollectedAmount: 0,
      totalOutstandingAmount: 0,
    },
    summary: {
      activeUsers: 0,
      inactiveUsers: 0,
      totalUsers: 0,
      totalBill: 0,
      electricityBill: 0,
      waterBill: 0,
      grossBill: 0,
      sharedCredit: 0,
      totalPayable: 0,
      carryForwardTotal: 0,
      adjustmentTotal: 0,
      collected: 0,
      outstanding: 0,
      paidUsers: 0,
      pendingUsers: 0,
      collectionRate: 0,
    },
  }
}

export function createPaymentDrafts(allocations) {
  return Object.fromEntries(
    allocations.map((allocation) => [
      allocation.id,
      {
        paidAmount: toMoneyString(allocation.paidAmount),
        previousBalance: toMoneyString(allocation.previousBalance),
        manualAdjustment: toMoneyString(allocation.manualAdjustment),
        paymentMethod: allocation.paymentMethod ?? 'cash',
        paidAt: toDateTimeInputValue(allocation.paidAt) || '',
      },
    ]),
  )
}
