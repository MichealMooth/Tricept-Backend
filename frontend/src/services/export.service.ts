import { api } from './api'

export type MatrixExportFilters = { categoryId?: string; employeeIds?: string[]; skillIds?: string[] }

async function getCsrfToken(): Promise<string> {
  const res = await api.get('/auth/csrf')
  return res.data?.csrfToken
}

export async function exportExcel(filters: MatrixExportFilters, includeComments: boolean): Promise<Blob> {
  const csrf = await getCsrfToken()
  const res = await api.post(
    '/export/excel',
    { filters, includeComments },
    {
      headers: { 'x-csrf-token': csrf },
      responseType: 'blob',
    }
  )
  return res.data as Blob
}
