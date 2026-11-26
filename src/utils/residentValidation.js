export function normalizeResidentPhone(value) {
  if (typeof value !== 'string' || !/^[+\d\s()-]+$/.test(value.trim())) return ''
  let digits = value.replace(/\D/g, '')
  if (digits.startsWith('00')) digits = digits.slice(2)
  if (/^0\d{9}$/.test(digits)) digits = '94' + digits.slice(1)
  return /^[1-9]\d{7,14}$/.test(digits) ? '+' + digits : ''
}

function validDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const date = new Date(value + 'T00:00:00Z')
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value
}

export function validateResidentForm(form, users = []) {
  const normalized = {
    ...form,
    fullName: form.fullName.trim(),
    roomNumber: form.roomNumber.trim(),
    email: form.email.trim().toLowerCase(),
    phone: normalizeResidentPhone(form.phone),
  }
  const errors = {}
  if (!normalized.fullName) errors.fullName = 'Enter the resident’s full name.'
  if (!normalized.roomNumber) errors.roomNumber = 'Enter a room number.'
  if (normalized.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized.email)) errors.email = 'Enter a valid email address.'
  if (!normalized.phone) errors.phone = 'Enter a WhatsApp number like 0771234567 or +94771234567.'
  if (form.birthday && !validDate(form.birthday)) errors.birthday = 'Choose a valid birth date.'
  else if (form.birthday && form.birthday > new Date().toISOString().slice(0, 10)) errors.birthday = 'Birthday cannot be in the future.'
  if (!validDate(form.joinedDate)) errors.joinedDate = 'Choose a valid joined date.'
  if (form.leftDate && !validDate(form.leftDate)) errors.leftDate = 'Choose a valid left date.'
  else if (form.leftDate && !errors.joinedDate && form.leftDate < form.joinedDate) errors.leftDate = 'Left date cannot be before joined date.'
  if (!['active', 'inactive'].includes(form.status)) errors.status = 'Choose Active or Inactive.'
  const others = users.filter(user => user.id !== form.id)
  if (normalized.email && others.some(user => user.email?.trim().toLowerCase() === normalized.email)) {
    errors.email = 'This email is already assigned to another user.'
  }
  if (normalized.phone && others.some(user => normalizeResidentPhone(user.phone) === normalized.phone)) {
    errors.phone = 'This phone number is already assigned to another user.'
  }
  return { form: normalized, errors }
}
