import { api, unwrap, unwrapList } from './client'

function buildParams(params = {}) {
  return Object.fromEntries(Object.entries(params).filter(([, v]) => v !== '' && v != null))
}

export async function fetchRooms(params) {
  const response = await api.get('/rooms/', { params: buildParams(params) })
  return unwrapList(response)
}

export async function fetchRoom(id) {
  const response = await api.get(`/rooms/${id}/`)
  return unwrap(response)
}

export async function createRoom(payload) {
  const response = await api.post('/rooms/', payload)
  return unwrap(response)
}

export async function updateRoom(id, payload) {
  const response = await api.patch(`/rooms/${id}/`, payload)
  return unwrap(response)
}

export async function updateRoomStatus(id, status, notes = '') {
  const response = await api.patch(`/rooms/${id}/status/`, { status, notes })
  return unwrap(response)
}

export async function deleteRoom(id) {
  await api.delete(`/rooms/${id}/`)
}

export async function fetchAvailability(params) {
  const response = await api.get('/rooms/availability/', { params: buildParams(params) })
  return unwrap(response)
}

export async function fetchRoomTypes(params) {
  const response = await api.get('/room-types/', { params: buildParams(params) })
  return unwrapList(response)
}

export async function fetchRoomType(id) {
  const response = await api.get(`/room-types/${id}/`)
  return unwrap(response)
}

export async function createRoomType(payload) {
  const response = await api.post('/room-types/', payload)
  return unwrap(response)
}

export async function updateRoomType(id, payload) {
  const response = await api.patch(`/room-types/${id}/`, payload)
  return unwrap(response)
}

export async function deleteRoomType(id) {
  await api.delete(`/room-types/${id}/`)
}

export async function fetchAmenities() {
  const response = await api.get('/amenities/')
  return unwrap(response)
}
