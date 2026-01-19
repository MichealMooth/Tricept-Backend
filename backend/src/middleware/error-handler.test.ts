import express from 'express'
import request from 'supertest'
import { errorHandler, notFoundHandler } from '@/middleware/error-handler'

function makeApp() {
  const app = express()
  app.get('/bad-request', (_req, _res, next) => {
    const err: any = new Error('Invalid input')
    err.status = 400
    next(err)
  })
  app.get('/throw', () => {
    throw new Error('Boom')
  })
  app.use(notFoundHandler)
  app.use(errorHandler)
  return app
}

describe('middleware/error-handler', () => {
  const app = makeApp()

  test('returns 400 with message for handled error', async () => {
    const res = await request(app).get('/bad-request').expect(400)
    expect(res.body.message).toContain('Invalid input')
    expect(res.body.path).toBe('/bad-request')
  })

  test('returns 500 for thrown error', async () => {
    const res = await request(app).get('/throw').expect(500)
    expect(res.body.message).toBeDefined()
    expect(res.body.path).toBe('/throw')
  })

  test('notFoundHandler returns 404 for unknown route', async () => {
    const res = await request(app).get('/unknown').expect(404)
    expect(res.body.message).toBe('Route not found')
  })
})
