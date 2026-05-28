export function formatMoney(value) {
  const num = Number(value || 0)
  return `${num.toLocaleString('vi-VN')} ₫`
}

export function formatDate(value) {
  if (!value) return '—'
  return new Date(value).toLocaleDateString('vi-VN')
}

export function formatDateTime(value) {
  if (!value) return '—'
  return new Date(value).toLocaleString('vi-VN')
}

export function todayISO() {
  return new Date().toISOString().slice(0, 10)
}

export function addDaysISO(dateStr, days) {
  const d = new Date(dateStr)
  d.setDate(d.getDate() + days)
  return d.toISOString().slice(0, 10)
}
