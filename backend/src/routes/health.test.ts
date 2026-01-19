import express from 'express'
import request from 'supertest'

describe('routes/health', () => {
  test('returns ok when DB is connected', async () => {
    const app = express()
    const health = (await import('@/routes/health')).default
    app.use('/health', health)

    const res = await request(app).get('/health').expect(200)
    expect(res.body).toEqual({ status: 'ok', db: 'connected' })
  })

  test('returns degraded when DB throws', async () => {
    jest.resetModules()
    jest.doMock('@/config/database', () => ({
      prisma: { $queryRaw: jest.fn().mockRejectedValue(new Error('db down')) },
    }))
    const app = express()
    const health = (await import('@/routes/health')).default
    app.use('/health', health)

    const res = await request(app).get('/health').expect(500)
    expect(res.body).toEqual({ status: 'degraded', db: 'disconnected' })
  })
})
