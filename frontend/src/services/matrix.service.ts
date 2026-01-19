import { api } from './api'

export type MatrixEmployee = { id: string; firstName: string; lastName: string; role: string | null }
export type MatrixSkill = { id: string; name: string; categoryName: string | null }
export type MatrixCell = {
  employeeId: string
  skillId: string
  selfRating: number | null
  avgPeerRating: number | null
  peerCount: number
  lastUpdated: string | null
}
export type MatrixData = { employees: MatrixEmployee[]; skills: MatrixSkill[]; data: MatrixCell[] }

export async function getMatrix(params: { categoryId?: string; employeeIds?: string[]; skillIds?: string[] }) {
  const query: any = {}
  if (params.categoryId) query.categoryId = params.categoryId
  if (params.employeeIds?.length) query.employeeIds = params.employeeIds.join(',')
  if (params.skillIds?.length) query.skillIds = params.skillIds.join(',')
  const res = await api.get<MatrixData>('/matrix', { params: query })
  return res.data
}

export function cellColor(rating: number | null): string {
  if (rating == null) return '#f3f4f6'
  // Softer, less saturated palette
  if (rating <= 2) return '#fde2e2'   // soft red
  if (rating <= 4) return '#fdecc8'   // soft orange
  if (rating <= 6) return '#fff6bf'   // soft yellow
  if (rating <= 8) return '#d9f2d9'   // soft green
  return '#c9f0f0'                    // soft teal
}
