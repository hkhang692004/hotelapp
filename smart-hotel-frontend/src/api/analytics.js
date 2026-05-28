import { api, unwrap } from './client'

function buildParams(params = {}) {
  return Object.fromEntries(Object.entries(params).filter(([, v]) => v !== '' && v != null))
}

export async function fetchDashboard(date) {
  const response = await api.get('/analytics/dashboard/', { params: buildParams({ date }) })
  return unwrap(response)
}

export async function fetchRevenue(params) {
  const response = await api.get('/analytics/revenue/', { params: buildParams(params) })
  return unwrap(response)
}

export async function fetchOccupancy(from, to) {
  const response = await api.get('/analytics/occupancy/', { params: { from, to } })
  return unwrap(response)
}

export async function fetchBookingStats(params) {
  const response = await api.get('/analytics/bookings/', { params: buildParams(params) })
  return unwrap(response)
}

export async function fetchServiceStats(params) {
  const response = await api.get('/analytics/services/', { params: buildParams(params) })
  return unwrap(response)
}

export async function fetchNotifications(params) {
  const response = await api.get('/notifications/', { params: buildParams(params) })
  return unwrap(response)
}

export async function markNotificationRead(id) {
  const response = await api.post(`/notifications/${id}/read/`)
  return unwrap(response)
}

export async function markAllNotificationsRead() {
  const response = await api.post('/notifications/read-all/')
  return unwrap(response)
}
