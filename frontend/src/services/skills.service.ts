import { api } from './api'

export type SkillImportPayload = {
  skillGroups: Array<{
    title: string
    skills: Array<{ name: string; description?: string | null; displayOrder?: number }>
  }>
}

export type SkillImportResult = {
  createdCategories: number
  createdSkills: number
  skippedSkills: number
}

export async function importSkillGroups(payload: SkillImportPayload): Promise<SkillImportResult> {
  // Fetch CSRF token and include it in the header for protected POST
  const csrf = (await api.get('/auth/csrf')).data?.csrfToken
  const res = await api.post<SkillImportResult>('/skills/import', payload, {
    headers: { 'x-csrf-token': csrf },
  })
  return res.data
}
