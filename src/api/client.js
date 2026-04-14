const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080'

export async function api(endpoint, options = {}) {
  const url = `${API_URL}/${endpoint}`
  const config = {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  }

  // Don't set Content-Type for FormData
  if (options.body instanceof FormData) {
    delete config.headers['Content-Type']
  }

  const res = await fetch(url, config)

  if (!res.ok && res.status !== 401) {
    const err = await res.json().catch(() => ({ error: 'Netzwerkfehler' }))
    throw new Error(err.error || `HTTP ${res.status}`)
  }

  return res.json()
}

export const get = (endpoint) => api(endpoint, { method: 'GET' })

export const post = (endpoint, data) =>
  api(endpoint, { method: 'POST', body: JSON.stringify(data) })

export const put = (endpoint, data) =>
  api(endpoint, { method: 'POST', body: JSON.stringify({ ...data, _method: 'PUT' }) })

export const del = (endpoint) =>
  api(endpoint, { method: 'POST', body: JSON.stringify({ _method: 'DELETE' }) })
