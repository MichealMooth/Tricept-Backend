import { api } from './api'

export type StrategicGoal = {
  id: string
  key: string
  title: string
  description?: string | null
  displayOrder: number
  isActive: boolean
}

export type StrategicGoalRating = {
  id: string
  goalId: string
  userId: string
  year: number
  month: number
  rating: number
  comment?: string | null
}

export async function listGoalsAdmin() {
  const { data } = await api.get<StrategicGoal[]>('/strategic-goals')
  return data
}

export async function importGoalsAdmin(payload: Array<{ key: string; title: string; description?: string | null; displayOrder?: number; isActive?: boolean }>) {
  const { data } = await api.post<StrategicGoal[]>('/strategic-goals/import', payload, { timeout: 30000 })
  return data
}

export async function createGoalAdmin(input: { key: string; title: string; description?: string | null; displayOrder?: number; isActive?: boolean }) {
  const { data } = await api.post<StrategicGoal>('/strategic-goals', input)
  return data
}

export async function updateGoalAdmin(id: string, input: Partial<{ key: string; title: string; description?: string | null; displayOrder?: number; isActive?: boolean }>) {
  const { data } = await api.put<StrategicGoal>(`/strategic-goals/${id}`, input)
  return data
}

export async function deleteGoalAdmin(id: string) {
  await api.delete(`/strategic-goals/${id}`)
}

export async function listGoalsWithMyRatings(params?: { year?: number; month?: number }) {
  const { data } = await api.get<{ year: number; month: number; items: Array<{ goal: StrategicGoal; rating: StrategicGoalRating | null }> }>('/strategic-goals/with-my-ratings', { params })
  return data
}

export async function upsertMyRating(input: { goalId: string; rating: number; comment?: string | null; year?: number; month?: number }) {
  const { data } = await api.post<StrategicGoalRating>('/strategic-goals/rate', input)
  return data
}

export async function fetchAverages(params?: { year?: number; month?: number }) {
  const { data } = await api.get<{ year: number; month: number; items: Array<{ goalId: string; avg: number | null; count: number }> }>('/strategic-goals/averages', { params })
  return data
}
