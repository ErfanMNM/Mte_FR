const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api/v1'

function getToken() {
  try { return localStorage.getItem('auth_token') } catch { return null }
}

export async function apiFetch(path, options = {}) {
  const headers = new Headers(options.headers || {})
  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json')
  }
  const token = getToken()
  if (token) headers.set('Authorization', `Bearer ${token}`)

  const res = await fetch(`${BASE_URL}${path}`, { ...options, headers })
  const isJson = (res.headers.get('content-type') || '').includes('application/json')
  const data = isJson ? await res.json().catch(() => null) : null
  if (!res.ok) {
    const message = data?.message || data?.error || res.statusText
    const err = new Error(message)
    err.status = res.status
    err.data = data
    throw err
  }
  return data
}

export const authApi = {
  login: (payload) => apiFetch('/auth/login', { method: 'POST', body: JSON.stringify(payload) }),
  me: () => apiFetch('/auth/me', { method: 'GET' }),
}

export const profileApi = {
  me: () => apiFetch('/profiles/me', { method: 'GET' }),
  update: (payload) => apiFetch('/profiles/me', { method: 'PUT', body: JSON.stringify(payload) }),
  logs: ({ page = 1, pageSize = 10, type } = {}) => {
    const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) })
    if (type) params.set('type', type)
    return apiFetch(`/profiles/me/logs?${params.toString()}`, { method: 'GET' })
  },
}
