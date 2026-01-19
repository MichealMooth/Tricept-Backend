import { api } from './api'

export type AssessmentSummary = {
  skill: { id: string; name: string; description: string | null }
  selfRating: { rating: number; comment: string | null } | null
  peerRatings: Array<{ assessor: { id: string; firstName: string; lastName: string; email: string }; rating: number; comment: string | null }>
}

async function getCsrfToken(): Promise<string> {
  const res = await api.get('/auth/csrf')
  return res.data?.csrfToken
}

export async function listForEmployee(employeeId: string, includeHistory = false) {
  const res = await api.get<AssessmentSummary[]>(`/assessments/employee/${employeeId}`, { params: { includeHistory } })
  return res.data
}

export async function createAssessment(payload: {
  employeeId: string
  skillId: string
  assessmentType: 'SELF' | 'PEER'
  rating: number
  comment?: string | null
}) {
  const csrf = await getCsrfToken()
  const res = await api.post('/assessments', payload, { headers: { 'x-csrf-token': csrf } })
  return res.data
}

export async function getHistory(employeeId: string, skillId: string) {
  const res = await api.get(`/assessments/history/${employeeId}/${skillId}`)
  return res.data
}

export async function getPeerAverage(employeeId: string, skillId: string) {
  const res = await api.get<{ average: number | null }>(`/assessments/average/${employeeId}/${skillId}`)
  return res.data.average
}

export type TrendPoint = { period: string; self?: number | null; peer?: number | null }
export async function getTrend(employeeId: string, skillId: string, months = 6) {
  const res = await api.get<TrendPoint[]>(`/assessments/trend/${employeeId}/${skillId}`, { params: { months } })
  return res.data
}
