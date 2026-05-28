import { api, unwrap, unwrapList } from './client'

function buildParams(params = {}) {
  return Object.fromEntries(Object.entries(params).filter(([, v]) => v !== '' && v != null))
}

export async function fetchCustomers(params) {
  const response = await api.get('/customers/', { params: buildParams(params) })
  return unwrapList(response)
}

export async function fetchCustomer(id) {
  const response = await api.get(`/customers/${id}/`)
  return unwrap(response)
}

export async function fetchCustomerBookings(id) {
  const response = await api.get(`/customers/${id}/bookings/`)
  return unwrap(response)
}
