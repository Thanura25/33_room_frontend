const configuredApiUrl = import.meta.env.VITE_API_URL?.trim()

if (!configuredApiUrl) {
  throw new Error('VITE_API_URL must be set in the frontend .env file.')
}

export const API_URL = configuredApiUrl.replace(/\/$/, '')

export const chargeFields = [
  { key: 'electricity', label: 'Electricity' },
  { key: 'water', label: 'Water' },
]

export const billCategories = [
  { key: 'electricity', label: 'Electricity Bill', icon: 'zap' },
  { key: 'water', label: 'Water Bill', icon: 'droplet' },
  { key: 'telecom', label: 'Telecom Bill', icon: 'wifi' },
  { key: 'restaurant', label: 'Restaurant Bill', icon: 'utensils' },
  { key: 'other', label: 'Other Expenses', icon: 'receipt' },
]

export const paymentMethods = ['cash', 'bank transfer', 'online payment', 'other']

export const pageIds = [
  'overview',
  'categoryBills',
  'discounts',
  'balances',
  'payments',
  'users',
  'reports',
  'whatsappNotices',
  'billing',
  'settings',
]

export const pageMeta = {
  overview: {
    eyebrow: 'Admin Dashboard',
    title: 'Monthly utility totals and all-month progress in one place.',
    description:
      'Track current month total bills, category expenses, and see how collections are moving across every saved month.',
  },
  categoryBills: {
    eyebrow: 'Bill Management',
    title: 'Enter bills for the 5 categories and calculate equal member shares.',
    description:
      'Create bills for Electricity, Water, Telecom, Restaurant, and Other Expenses, select members, and distribute.',
  },
  discounts: {
    eyebrow: 'Discount Management',
    title: 'Monthly member discount allocation and equal division.',
    description:
      'Set custom monthly discounts, divide equally among active boarding members, and deduct from their payable amounts.',
  },
  balances: {
    eyebrow: 'Outstanding Balances',
    title: 'Individual member financial breakdown and balance matrix.',
    description:
      'Monitor previous arrears, current month category charges, amounts paid, and remaining balances.',
  },
  payments: {
    eyebrow: 'Payment Management',
    title: 'Record payments, manage partial settlements, and generate official receipts.',
    description:
      'Record transactions with payment method and reference, and generate printable payment receipts.',
  },
  reports: {
    eyebrow: 'Financial Reports',
    title: 'Filterable statements and exportable monthly summaries.',
    description:
      'Generate monthly bill, collection, and outstanding balance reports with Excel CSV and PDF export.',
  },
  whatsappNotices: {
    eyebrow: 'WhatsApp Notifications',
    title: 'Track bill delivery and use instant Click-to-Chat fallback.',
    description:
      'Monitor Meta Cloud API delivery statuses and use prefilled WhatsApp links for immediate delivery.',
  },
  users: {
    eyebrow: 'Boarding Members Directory',
    title: 'Manage members and configure member portal credentials.',
    description:
      'Keep rooms, phone numbers, and member accounts up to date.',
  },
}
