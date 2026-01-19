import axios from 'axios';

const baseURL = ((import.meta as any).env?.VITE_API_BASE_URL) || 'http://localhost:4000/api';

export const api = axios.create({
  baseURL,
  withCredentials: true,
  timeout: 30000,
});

// Automatically attach CSRF token for mutating requests
api.interceptors.request.use(async (config) => {
  const method = (config.method || 'get').toUpperCase()
  const needsCsrf = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)
  const hasHeader = !!(config.headers as any)?.['x-csrf-token']
  const isCsrfCall = (config.url || '').endsWith('/auth/csrf')
  if (needsCsrf && !hasHeader && !isCsrfCall) {
    try {
      const res = await api.get('/auth/csrf')
      const token = res.data?.csrfToken
      if (token) {
        const h: any = config.headers || {}
        if (typeof h.set === 'function') {
          h.set('x-csrf-token', token)
        } else {
          config.headers = { ...h, 'x-csrf-token': token } as any
        }
      }
    } catch {
      // ignore; request may still fail with 401 which is handled below
    }
  }
  return config
})

// Redirect to login on 401
api.interceptors.response.use(
  (res) => res,
  (error) => {
    const status = error?.response?.status
    if (status === 401) {
      // optional: preserve current path
      try { sessionStorage.setItem('postLoginRedirect', window.location.pathname + window.location.search) } catch {}
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)
