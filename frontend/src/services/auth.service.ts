import { api } from './api'

async function getCsrfToken(): Promise<string> {
  const res = await api.get('/auth/csrf')
  return res.data?.csrfToken
}

export async function register(payload: {
  email: string
  password: string
  firstName: string
  lastName: string
  role?: string
  department?: string
}): Promise<AuthUser> {
  const csrf = await getCsrfToken()
  const res = await api.post<AuthUser>('/auth/register', payload, { headers: { 'x-csrf-token': csrf } })
  return res.data
}

export type AuthUser = {
  id: string
  email: string
  firstName: string
  lastName: string
  isAdmin: boolean
}

export async function login(email: string, password: string): Promise<AuthUser> {
  const csrf = await getCsrfToken()
  const res = await api.post<AuthUser>('/auth/login', { email, password }, { headers: { 'x-csrf-token': csrf } })
  return res.data
}

export async function logout(): Promise<void> {
  const csrf = await getCsrfToken()
  await api.post('/auth/logout', {}, { headers: { 'x-csrf-token': csrf } })
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  const res = await api.get<AuthUser>('/auth/me', {
    // Treat 401 as a valid response so Axios doesn't throw (and the console doesn't show an exception stack)
    validateStatus: () => true,
  })
  if (res.status === 200) return res.data
  return null
}

export async function isAuthenticated(): Promise<boolean> {
  const me = await getCurrentUser()
  return !!me
}
