import { api, unwrap, unwrapList } from './client'

function buildParams(params = {}) {
  return Object.fromEntries(Object.entries(params).filter(([, v]) => v !== '' && v != null))
}

export async function fetchBookings(params) {
  const response = await api.get('/bookings/', { params: buildParams(params) })
  return unwrapList(response)
}

export async function fetchBooking(id) {
  const response = await api.get(`/bookings/${id}/`)
  return unwrap(response)
}

export async function createWalkIn(payload) {
  const response = await api.post('/bookings/walk-in/', payload)
  return unwrap(response)
}

export async function confirmBooking(id, note = '') {
  const response = await api.post(`/bookings/${id}/confirm/`, { note })
  return unwrap(response)
}

export async function cancelBooking(id, reason = '') {
  const response = await api.post(`/bookings/${id}/cancel/`, { reason })
  return unwrap(response)
}

export async function checkInBooking(id, note = '') {
  const response = await api.post(`/bookings/${id}/check-in/`, { note })
  return unwrap(response)
}

export async function checkOutBooking(id, note = '') {
  const response = await api.post(`/bookings/${id}/check-out/`, { note })
  return unwrap(response)
}

export async function fetchBookingHistory(id) {
  const response = await api.get(`/bookings/${id}/status-history/`)
  return unwrap(response)
}

export async function fetchBookingServiceOrders(bookingId) {
  const response = await api.get(`/bookings/${bookingId}/service-orders/`)
  return unwrap(response)
}
