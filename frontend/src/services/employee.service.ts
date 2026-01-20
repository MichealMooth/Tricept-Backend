/**
 * Employee Service
 *
 * API service for Employee management.
 * Task Group 4: Extended to include team memberships.
 */

import { api } from './api'
import type { TeamRole } from '@/types/team'

async function getCsrfToken(): Promise<string> {
  const res = await api.get('/auth/csrf')
  return res.data?.csrfToken
}

export type Employee = {
  id: string
  email: string
  firstName: string
  lastName: string
  role: string | null
  department: string
  isActive: boolean
  isAdmin: boolean
  hireDate: string | null
  createdAt: string
}

/**
 * Employee with team memberships.
 * Task Group 4: Extended employee type for team column display.
 */
export type EmployeeWithTeams = Employee & {
  teams: Array<{ id: string; name: string }>
}

/**
 * Employee team membership info.
 * Task Group 4: Used in EmployeeForm for team assignment.
 */
export type EmployeeTeam = {
  teamId: string
  teamName: string
  role: TeamRole
  membershipId: string
}

export async function listEmployees(search?: string) {
  const res = await api.get<Employee[]>('/employees', { params: { search } })
  return res.data
}

/**
 * List employees with their team memberships.
 * Task Group 4: Extended listing for team column display.
 *
 * @param search - Optional search string
 * @returns List of employees with team info
 */
export async function listEmployeesWithTeams(search?: string) {
  const res = await api.get<EmployeeWithTeams[]>('/employees', {
    params: { search, includeTeams: 'true' }
  })
  return res.data
}

/**
 * Get teams for a specific employee.
 * Task Group 4: Used in EmployeeForm for team assignment.
 *
 * @param employeeId - Employee ID
 * @returns List of team memberships with role info
 */
export async function getEmployeeTeams(employeeId: string): Promise<EmployeeTeam[]> {
  const res = await api.get<EmployeeTeam[]>(`/employees/${employeeId}/teams`)
  return res.data
}

export async function createEmployee(data: {
  email: string
  password: string
  firstName: string
  lastName: string
  role?: string | null
  department?: string | null
  isAdmin?: boolean
  isActive?: boolean
  hireDate?: string | null
}) {
  const csrf = await getCsrfToken()
  const res = await api.post<Employee>('/employees', data, { headers: { 'x-csrf-token': csrf } })
  return res.data
}

export async function updateEmployee(id: string, data: Partial<Omit<Parameters<typeof createEmployee>[0], 'password'>>) {
  const csrf = await getCsrfToken()
  const res = await api.put<Employee>(`/employees/${id}`, data, { headers: { 'x-csrf-token': csrf } })
  return res.data
}

export async function archiveEmployee(id: string) {
  const csrf = await getCsrfToken()
  await api.delete(`/employees/${id}`, { headers: { 'x-csrf-token': csrf } })
}
