import { api, unwrap, unwrapList } from './client'

function buildParams(params = {}) {
  return Object.fromEntries(Object.entries(params).filter(([, v]) => v !== '' && v != null))
}

export async function fetchPayments(params) {
  const response = await api.get('/payments/', { params: buildParams(params) })
  return unwrapList(response)
}

export async function createPayment(payload) {
  const response = await api.post('/payments/', payload)
  return unwrap(response)
}

export async function refundPayment(id, payload) {
  const response = await api.post(`/payments/${id}/refund/`, payload)
  return unwrap(response)
}

export async function fetchInvoices(params) {
  const response = await api.get('/invoices/', { params: buildParams(params) })
  return unwrapList(response)
}

export async function createInvoice(bookingId) {
  const response = await api.post('/invoices/', { booking_id: bookingId })
  return unwrap(response)
}

export async function fetchInvoice(id) {
  const response = await api.get(`/invoices/${id}/`)
  return unwrap(response)
}
