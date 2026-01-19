import { vi, afterEach } from 'vitest'
import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'

// Mock API module to avoid real HTTP calls
vi.mock('@/services/api', () => {
  const handlers: Record<string, any> = {}
  const api = {
    get: vi.fn((url: string, _config?: any) => {
      const key = `GET ${url}`
      if (handlers[key]) return Promise.resolve({ data: handlers[key] })
      return Promise.resolve({ data: {} })
    }),
    post: vi.fn(async (url: string, body?: any, _config?: any) => {
      const key = `POST ${url}`
      const handler = handlers[key]
      if (typeof handler === 'function') {
        const res = handler(body)
        const data = res && typeof (res as any).then === 'function' ? await res : res
        return { data }
      }
      if (handler !== undefined) return { data: handler }
      return { data: {} }
    }),
    put: vi.fn((_url: string, _body?: any) => Promise.resolve({ data: {} })),
    delete: vi.fn((_url: string) => Promise.resolve({ status: 204 })),
    interceptors: { request: { use: vi.fn() }, response: { use: vi.fn() } },
  }
  const set = (method: 'GET'|'POST', url: string, data: any) => { handlers[`${method} ${url}`] = data }
  ;(globalThis as any).__setApiResponse = set
  return { api, __setApiResponse: set }
})

// Clean up DOM between tests
afterEach(() => {
  cleanup()
})
