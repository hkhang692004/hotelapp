import axios from 'axios'
import { api, unwrap, buildOAuthUrl } from './client'

const CLIENT_ID = import.meta.env.VITE_OAUTH_CLIENT_ID
const CLIENT_SECRET = import.meta.env.VITE_OAUTH_CLIENT_SECRET

function buildOAuthParams(extra) {
  return new URLSearchParams({
    client_id: CLIENT_ID,
    client_secret: CLIENT_SECRET,
    ...extra,
  }).toString()
}

export async function login(email, password) {
  let access, refresh
  try {
    const res = await axios.post(
      buildOAuthUrl('/o/token/'),
      buildOAuthParams({ grant_type: 'password', username: email, password, scope: 'read write' }),
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
    )
    access = res.data.access_token
    refresh = res.data.refresh_token
  } catch (err) {
    const oauthError = err?.response?.data
    if (oauthError?.error) {
      const wrapped = new Error(oauthError.error_description || 'Đăng nhập thất bại')
      wrapped.response = {
        data: { error: { message: oauthError.error_description || 'Email hoặc mật khẩu không đúng' } },
      }
      throw wrapped
    }
    throw err
  }

  const meRes = await api.get('/auth/me/', { headers: { Authorization: `Bearer ${access}` } })
  const user = unwrap(meRes)
  return { access, refresh, user }
}

export async function logout(refresh) {
  if (!refresh) return
  try {
    await axios.post(
      buildOAuthUrl('/o/revoke_token/'),
      buildOAuthParams({ token: refresh }),
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
    )
  } catch {
    // Bỏ qua lỗi revoke
  }
}

export async function fetchMe() {
  const response = await api.get('/auth/me/')
  return unwrap(response)
}
