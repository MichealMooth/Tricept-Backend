import { api } from './api'

export async function listTables(): Promise<string[]> {
  const { data } = await api.get('/admin/db/tables')
  return data
}

export type TableInfo = { columns: { name: string; type: string }[]; count: number }
export async function getTableInfo(table: string): Promise<TableInfo> {
  const { data } = await api.get(`/admin/db/table/${encodeURIComponent(table)}/info`)
  return data
}

export async function getTableRows(table: string, params: { limit?: number; offset?: number } = {}) {
  const { data } = await api.get(`/admin/db/table/${encodeURIComponent(table)}/rows`, { params })
  return data as { rows: any[]; limit: number; offset: number }
}
