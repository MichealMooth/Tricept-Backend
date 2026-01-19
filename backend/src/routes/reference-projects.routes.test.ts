import request from 'supertest'
import http from 'http'
import app from '@/app'

process.env.REFPROJ_DATA_DIR = './var-test-routes'

describe('reference-projects routes', () => {
  let server: http.Server

  beforeAll((done) => {
    server = app.listen(0, () => done())
  })

  afterAll((done) => {
    server.close(() => done())
  })

  let createdId = ''

  test('create -> list filters -> delete', async () => {
    // Create 2 entries
    const p1 = {
      person: 'Alice',
      project_name: 'Apollo',
      customer: 'ACME',
      project_description: 'Satz eins. Satz zwei. Satz drei.',
      role: 'Testmanager',
      activity_description: 'Testing',
      duration_from: '01/2022',
      duration_to: '12/2022',
      topics: ['Testmanagement', 'Migration'],
    }

    const p2 = {
      person: 'Bob',
      project_name: 'Beta',
      customer: 'Globex',
      project_description: 'Satz eins. Satz zwei. Satz drei.',
      role: 'PMO',
      activity_description: 'PM',
      duration_from: '01/2023',
      duration_to: '06/2023',
      topics: ['Cut Over'],
    }

    const r1 = await request(server).post('/api/reference-projects').send(p1).expect(201)
    const r2 = await request(server).post('/api/reference-projects').send(p2).expect(201)

    createdId = r1.body.id
    expect(createdId).toBeDefined()

    // List unfiltered
    const listAll = await request(server).get('/api/reference-projects').expect(200)
    expect(listAll.body.total).toBeGreaterThanOrEqual(2)

    // Filter by role
    const listRole = await request(server).get('/api/reference-projects').query({ role: 'PMO' }).expect(200)
    expect(listRole.body.items.every((it: any) => it.role === 'PMO')).toBe(true)

    // Filter by topic
    const listTopic = await request(server).get('/api/reference-projects').query({ topic: 'Migration' }).expect(200)
    expect(listTopic.body.items.every((it: any) => it.topics.includes('Migration'))).toBe(true)

    // Delete createdId
    await request(server).delete(`/api/reference-projects/${createdId}`).expect(204)

    const afterDel = await request(server).get('/api/reference-projects').expect(200)
    expect(afterDel.body.items.find((it: any) => it.id === createdId)).toBeUndefined()
  })
})
