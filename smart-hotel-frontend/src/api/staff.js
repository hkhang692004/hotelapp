import { api, unwrap } from './client'

function buildParams(params = {}) {
  return Object.fromEntries(Object.entries(params).filter(([, v]) => v !== '' && v != null))
}

export async function fetchHousekeepingTasks(params) {
  const response = await api.get('/housekeeping/tasks/', { params: buildParams(params) })
  const data = response.data?.data ?? []
  const meta = response.data?.meta ?? {}
  return { items: data, meta }
}

export async function createHousekeepingTask(payload) {
  const response = await api.post('/housekeeping/tasks/', payload)
  return unwrap(response)
}

export async function updateHousekeepingTask(id, payload) {
  const response = await api.patch(`/housekeeping/tasks/${id}/`, payload)
  return unwrap(response)
}

export async function assignHousekeepingTask(id, assignedToId) {
  const response = await api.post(`/housekeeping/tasks/${id}/assign/`, { assigned_to_id: assignedToId })
  return unwrap(response)
}

export async function fetchHousekeepingHistory(params) {
  const response = await api.get('/housekeeping/history/', { params: buildParams(params) })
  return unwrap(response)
}

export async function fetchStaff(params) {
  const response = await api.get('/staff/', { params: buildParams(params) })
  const data = response.data?.data ?? []
  const meta = response.data?.meta ?? {}
  return { items: data, meta }
}

export async function createStaff(payload) {
  const response = await api.post('/staff/', payload)
  return unwrap(response)
}

export async function updateStaff(id, payload) {
  const response = await api.patch(`/staff/${id}/`, payload)
  return unwrap(response)
}

export async function deleteStaff(id) {
  await api.delete(`/staff/${id}/`)
}
