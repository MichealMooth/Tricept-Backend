import express from 'express'
import request from 'supertest'
import { corsMiddleware, rateLimiter } from '@/middleware/security'

describe('middleware/security', () => {
  test('cors allows localhost origins and sets header', async () => {
    const app = express()
    app.use(corsMiddleware)
    app.get('/ok', (_req, res) => res.json({ ok: true }))

    const origin = 'http://localhost:3000'
    const res = await request(app).get('/ok').set('Origin', origin).expect(200)
    expect(res.headers['access-control-allow-origin']).toBe(origin)
  })

  test('cors disallows non-listed origins (middleware returns 500)', async () => {
    const app = express()
    app.use(corsMiddleware)
    app.get('/ok', (_req, res) => res.json({ ok: true }))

    const res = await request(app).get('/ok').set('Origin', 'http://evil.com').expect(500)
    // Bei abgelehnter Origin wird keine AC-Allow-Origin gesetzt
    expect(res.headers['access-control-allow-origin']).toBeUndefined()
  })

  test('rateLimiter passes through in non-production', async () => {
    const app = express()
    app.use(rateLimiter as any)
    app.get('/ok', (_req, res) => res.json({ ok: true }))

    const res = await request(app).get('/ok').expect(200)
    expect(res.body.ok).toBe(true)
  })

  test('cors allows 127.0.0.1:* during development', async () => {
    const app = express()
    app.use(corsMiddleware)
    app.get('/ok', (_req, res) => res.json({ ok: true }))

    const origin = 'http://127.0.0.1:5173'
    const res = await request(app).get('/ok').set('Origin', origin).expect(200)
    expect(res.headers['access-control-allow-origin']).toBe(origin)
  })

  test('cors allows requests without Origin header', async () => {
    const app = express()
    app.use(corsMiddleware)
    app.get('/ok', (_req, res) => res.json({ ok: true }))

    const res = await request(app).get('/ok').expect(200)
    expect(res.body.ok).toBe(true)
  })
})

describe('middleware/security (production rate limiter)', () => {
  test('rateLimiter returns 429 in production when limit exceeded', async () => {
    jest.resetModules()
    jest.doMock('@/config/env', () => ({
      env: {
        nodeEnv: 'production',
        // Very tight limits for the test
        rateLimitWindowMs: 60_000,
        rateLimitMax: 1,
      },
    }))
    const { rateLimiter: prodLimiter } = await import('@/middleware/security')

    const app = express()
    app.use(prodLimiter as any)
    app.get('/data', (_req, res) => res.json({ ok: true }))

    await request(app).get('/data').expect(200)
    await request(app).get('/data').expect(429)
  })
})
