import { api, unwrap, unwrapList } from './client'

function buildParams(params = {}) {
  return Object.fromEntries(Object.entries(params).filter(([, v]) => v !== '' && v != null))
}

export async function fetchServices(params) {
  const response = await api.get('/services/', { params: buildParams(params) })
  return unwrap(response)
}

export async function createService(payload) {
  const response = await api.post('/services/', payload)
  return unwrap(response)
}

export async function updateService(id, payload) {
  const response = await api.patch(`/services/${id}/`, payload)
  return unwrap(response)
}

export async function deleteService(id) {
  await api.delete(`/services/${id}/`)
}

export async function fetchServiceCategories() {
  const response = await api.get('/service-categories/')
  return unwrap(response)
}

export async function createServiceCategory(payload) {
  const response = await api.post('/service-categories/', payload)
  return unwrap(response)
}

export async function fetchServiceOrders(params) {
  const response = await api.get('/service-orders/', { params: buildParams(params) })
  return unwrapList(response)
}

export async function createServiceOrder(payload) {
  const response = await api.post('/service-orders/', payload)
  return unwrap(response)
}

export async function confirmServiceOrder(id) {
  const response = await api.post(`/service-orders/${id}/confirm/`)
  return unwrap(response)
}

export async function cancelServiceOrder(id) {
  const response = await api.post(`/service-orders/${id}/cancel/`)
  return unwrap(response)
}
