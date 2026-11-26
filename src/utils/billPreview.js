export function previewShares(total, users, residentIds) {
  const selected = new Set(residentIds)
  const people = users.filter(user => selected.has(user.id)).sort((a, b) => a.id.localeCompare(b.id))
  if (!people.length) return []
  const cents = Math.max(0, Math.round(Number(total) * 100) || 0)
  const base = Math.floor(cents / people.length)
  const remainder = cents % people.length
  return people.map((person, index) => ({ ...person, amount: (base + (index < remainder ? 1 : 0)) / 100 }))
}
