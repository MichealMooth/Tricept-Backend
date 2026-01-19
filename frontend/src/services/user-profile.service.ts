import { api } from './api'

export type UserProfile = {
  userId: string
  firstName: string
  lastName: string
  roleTitle: string
  mainFocus: string[]
  projectReferences?: { current?: string; past?: string } | null
  experience?: string | null
  certifications?: string | null
  tools?: string[] | null
  methods?: string[] | null
  softSkills?: string[] | null
  education?: string | null
  profileImageUrl?: string | null
  createdAt?: string
  updatedAt?: string
}

export async function getProfile(userId: string) {
  const res = await api.get<UserProfile>(`/user/profile/${encodeURIComponent(userId)}`, { validateStatus: () => true })
  if (res.status === 200) return res.data
  if (res.status === 404) return null
  throw new Error(res.data && (res as any).data.message ? (res as any).data.message : `Request failed with status ${res.status}`)
}

export async function createProfile(input: Omit<UserProfile, 'createdAt' | 'updatedAt'> & { userId?: string }) {
  const { data } = await api.post<UserProfile>('/user/profile', input)
  return data
}

export async function updateProfile(userId: string, input: Partial<UserProfile>) {
  const { data } = await api.put<UserProfile>(`/user/profile/${encodeURIComponent(userId)}`, input)
  return data
}
