import { describe, it, expect, jest } from '@jest/globals'
import type { Request, Response, NextFunction } from 'express'

function makeRes() {
  const res: any = {}
  res.status = jest.fn().mockReturnValue(res)
  res.json = jest.fn().mockReturnValue(res)
  return res as Response & { status: jest.Mock; json: jest.Mock }
}

describe('auth.middleware', () => {
  afterEach(() => jest.resetModules())

  it('isAuthenticated bypasses in test env', async () => {
    jest.doMock('@/config/env', () => ({ env: { nodeEnv: 'test' } }))
    const { isAuthenticated } = await import('@/middleware/auth.middleware')
    const next: NextFunction = jest.fn()
    const req = {} as Request
    const res = makeRes()
    isAuthenticated(req, res, next)
    expect(next).toHaveBeenCalled()
  })

  it('isAuthenticated returns 401 in production when unauthenticated', async () => {
    jest.doMock('@/config/env', () => ({ env: { nodeEnv: 'production' } }))
    const { isAuthenticated } = await import('@/middleware/auth.middleware')
    const next: NextFunction = jest.fn()
    const req = { isAuthenticated: () => false } as unknown as Request
    const res = makeRes()
    isAuthenticated(req, res, next)
    expect(res.status).toHaveBeenCalledWith(401)
  })

  it('isAdmin allows admin in production, forbids non-admin', async () => {
    jest.doMock('@/config/env', () => ({ env: { nodeEnv: 'production' } }))
    const { isAdmin } = await import('@/middleware/auth.middleware')

    const next1: NextFunction = jest.fn()
    const req1 = { user: { isAdmin: true } } as any
    const res1 = makeRes()
    isAdmin(req1, res1, next1)
    expect(next1).toHaveBeenCalled()

    const next2: NextFunction = jest.fn()
    const req2 = { user: { isAdmin: false } } as any
    const res2 = makeRes()
    isAdmin(req2, res2, next2)
    expect(res2.status).toHaveBeenCalledWith(403)
  })

  it('isAdmin bypasses when not production', async () => {
    jest.doMock('@/config/env', () => ({ env: { nodeEnv: 'development' } }))
    const { isAdmin } = await import('@/middleware/auth.middleware')
    const next: NextFunction = jest.fn()
    const req = {} as any
    const res = makeRes()
    isAdmin(req, res, next)
    expect(next).toHaveBeenCalled()
  })
})
