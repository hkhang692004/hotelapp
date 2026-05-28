import { api, unwrap } from './client'

export async function login(email, password) {
  const response = await api.post('/auth/login/', { email, password })
  return unwrap(response)
}

export async function logout(refresh) {
  await api.post('/auth/logout/', { refresh })
}

export async function fetchMe() {
  const response = await api.get('/auth/me/')
  return unwrap(response)
}
