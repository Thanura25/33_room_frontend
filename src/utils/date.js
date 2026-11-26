export function getMonthValue(date = new Date()) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')

  return `${year}-${month}`
}

export function formatMonthLabel(month) {
  if (!month) {
    return 'Current month'
  }

  const [year, monthIndex] = month.split('-').map(Number)

  return new Intl.DateTimeFormat('en-US', {
    month: 'long',
    year: 'numeric',
  }).format(new Date(year, monthIndex - 1, 1))
}

export function toMoneyString(value) {
  const amount = Number(value ?? 0)
  return Number.isFinite(amount) ? amount.toFixed(2) : '0.00'
}

export function toDateInputValue(value) {
  if (!value) {
    return ''
  }

  return String(value).slice(0, 10)
}

export function toDateTimeInputValue(value) {
  if (!value) {
    return ''
  }

  const parsed = new Date(value)

  if (Number.isNaN(parsed.getTime())) {
    return ''
  }

  const year = parsed.getFullYear()
  const month = String(parsed.getMonth() + 1).padStart(2, '0')
  const day = String(parsed.getDate()).padStart(2, '0')
  const hours = String(parsed.getHours()).padStart(2, '0')
  const minutes = String(parsed.getMinutes()).padStart(2, '0')

  return `${year}-${month}-${day}T${hours}:${minutes}`
}

export function getCurrentDateTimeInputValue(date = new Date()) {
  return toDateTimeInputValue(date)
}
