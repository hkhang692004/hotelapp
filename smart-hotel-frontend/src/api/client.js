import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || '/api/v1'

function resolveOAuthBaseUrl() {
  const envBase = import.meta.env.VITE_OAUTH_BASE_URL
  if (envBase) return envBase

  if (/^https?:\/\//i.test(API_URL)) {
    try {
      return new URL(API_URL).origin
    } catch {
      return ''
    }
  }

  return ''
}

const OAUTH_BASE_URL = resolveOAuthBaseUrl()

export function buildOAuthUrl(path) {
  if (!OAUTH_BASE_URL) return path
  const normalizedBase = OAUTH_BASE_URL.replace(/\/+$/, '')
  return new URL(path, `${normalizedBase}/`).toString()
}

export const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

let refreshPromise = null

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config
    if (error.response?.status !== 401 || original._retry) {
      return Promise.reject(error)
    }
    original._retry = true
    const refresh = localStorage.getItem('refresh_token')
    if (!refresh) {
      return Promise.reject(error)
    }
    if (!refreshPromise) {
      refreshPromise = axios
        .post(
          buildOAuthUrl('/o/token/'),
          new URLSearchParams({
            grant_type: 'refresh_token',
            refresh_token: refresh,
            client_id: import.meta.env.VITE_OAUTH_CLIENT_ID,
            client_secret: import.meta.env.VITE_OAUTH_CLIENT_SECRET,
          }).toString(),
          { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
        )
        .then((res) => {
          const access = res.data.access_token
          localStorage.setItem('access_token', access)
          return access
        })
        .finally(() => {
          refreshPromise = null
        })
    }
    try {
      const access = await refreshPromise
      original.headers.Authorization = `Bearer ${access}`
      return api(original)
    } catch {
      localStorage.removeItem('access_token')
      localStorage.removeItem('refresh_token')
      localStorage.removeItem('user')
      window.location.href = '/login'
      return Promise.reject(error)
    }
  },
)

export function unwrap(response) {
  return response.data?.data ?? response.data
}

export function unwrapList(response) {
  return {
    items: response.data?.data ?? [],
    meta: response.data?.meta ?? {},
  }
}
