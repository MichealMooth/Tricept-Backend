import { api } from './api'

export type CapacityAllocation = { project_name?: string; percent: number }
export type UserCapacity = {
  id: string
  userId: string
  year: number
  month: number
  allocations: CapacityAllocation[]
  totalPercent: number
  createdAt: string
  updatedAt: string
}

async function getCsrfToken(): Promise<string> {
  const res = await api.get('/auth/csrf')
  return res.data?.csrfToken
}

export async function fetchUserCapacities(userId: string, year: number): Promise<UserCapacity[]> {
  const res = await api.get(`/capacities/${userId}/${year}`)
  return res.data
}

export async function saveUserMonthCapacity(params: {
  userId: string
  year: number
  month: number
  allocations: CapacityAllocation[]
  totalPercent: number
}) {
  const csrf = await getCsrfToken()
  const { userId, year, month, allocations, totalPercent } = params
  const res = await api.post(
    `/capacities/${userId}/${year}/${month}`,
    { allocations, total_percent: totalPercent },
    { headers: { 'x-csrf-token': csrf } }
  )
  return res.data as UserCapacity
}

export async function fetchOverview(year: number): Promise<Array<{ userId: string; name: string; isActive: boolean; months: Array<number | null> }>> {
  const res = await api.get(`/capacities/overview/${year}`, { timeout: 30000 })
  return res.data
}
