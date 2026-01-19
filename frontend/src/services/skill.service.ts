import { api } from './api'

export type CategoryTree = {
  id: string
  name: string
  parentId: string | null
  description: string | null
  displayOrder: number
  isActive: boolean
  createdAt: string
  children: CategoryTree[]
  skills: SkillSummary[]
}

export type SkillSummary = {
  id: string
  name: string
  description: string | null
  displayOrder: number
  isActive: boolean
  createdAt: string
}

async function getCsrfToken(): Promise<string> {
  const res = await api.get('/auth/csrf')
  return res.data?.csrfToken
}

export async function fetchCategoriesTree(includeInactive = false) {
  const res = await api.get<CategoryTree[]>('/categories', { params: { includeInactive } })
  return res.data
}

export async function createCategory(data: { name: string; parentId?: string | null; description?: string | null; displayOrder?: number }) {
  const csrf = await getCsrfToken()
  const res = await api.post('/categories', data, { headers: { 'x-csrf-token': csrf } })
  return res.data
}

export async function updateCategory(id: string, data: Partial<{ name: string; parentId: string | null; description: string | null; displayOrder: number; isActive: boolean }>) {
  const csrf = await getCsrfToken()
  const res = await api.put(`/categories/${id}`, data, { headers: { 'x-csrf-token': csrf } })
  return res.data
}

export async function deleteCategory(id: string) {
  const csrf = await getCsrfToken()
  await api.delete(`/categories/${id}`, { headers: { 'x-csrf-token': csrf } })
}

export async function reactivateCategory(id: string) {
  const csrf = await getCsrfToken()
  const res = await api.put(`/categories/${id}/reactivate`, {}, { headers: { 'x-csrf-token': csrf } })
  return res.data
}

export async function deleteCategoryPermanent(id: string) {
  const csrf = await getCsrfToken()
  await api.delete(`/categories/${id}/permanent`, { headers: { 'x-csrf-token': csrf } })
}

export async function fetchSkills(params?: { categoryId?: string; isActive?: boolean }) {
  const res = await api.get('/skills', { params })
  return res.data
}

export async function createSkill(data: { name: string; categoryId: string; description?: string | null; displayOrder?: number }) {
  const csrf = await getCsrfToken()
  const res = await api.post('/skills', data, { headers: { 'x-csrf-token': csrf } })
  return res.data
}

export async function updateSkill(id: string, data: Partial<{ name: string; categoryId: string; description: string | null; displayOrder: number; isActive: boolean }>) {
  const csrf = await getCsrfToken()
  const res = await api.put(`/skills/${id}`, data, { headers: { 'x-csrf-token': csrf } })
  return res.data
}

export async function deleteSkill(id: string) {
  const csrf = await getCsrfToken()
  await api.delete(`/skills/${id}`, { headers: { 'x-csrf-token': csrf } })
}
