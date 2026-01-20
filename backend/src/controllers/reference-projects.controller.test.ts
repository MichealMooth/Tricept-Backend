import request from 'supertest'
import http from 'http'
import { execSync } from 'child_process'
import app from '@/app'

// Helper: set test env and isolated data dir
process.env.REFPROJ_DATA_DIR = './var-test-ctrl'

describe('reference-projects.controller importExcel', () => {
  let server: http.Server

  beforeAll(async () => {
    // Seed the database to ensure Role and Topic lookup tables exist
    // Pass environment variables to the child process
    execSync('npx prisma db seed', {
      stdio: 'pipe',
      env: { ...process.env, DATABASE_URL: 'file:./test.db' },
    })

    await new Promise<void>((resolve) => {
      server = app.listen(0, () => resolve())
    })
  }, 30000)

  afterAll((done) => {
    server.close(() => done())
  })

  test('imports valid rows and returns german errors for invalid', async () => {
    const payload = [
      {
        person: 'Alice',
        project_name: 'Apollo',
        customer: 'ACME',
        project_description: 'Satz eins. Satz zwei. Satz drei.',
        role: 'Testmanager',
        activity_description: 'Testing',
        duration_from: '01/2022',
        duration_to: '12/2022',
        contact_person: 'Max Mustermann',
        approved: true,
        topics: ['Testmanagement'],
      },
      {
        person: '', // invalid
        project_name: '',
        customer: 'ACME',
        project_description: 'Zuwenig.', // invalid (nur 1 Satz)
        role: 'XYZ', // invalid enum
        activity_description: '',
        duration_from: '',
        duration_to: '',
        contact_person: '',
        approved: false,
        topics: [],
      },
    ]

    const res = await request(server)
      .post('/api/reference-projects/import')
      .send(payload)
      .expect(200)

    expect(res.body.ok).toBe(1)
    expect(res.body.fail).toBe(1)
    const errRow = res.body.results.find((r: any) => !r.ok)
    expect(errRow.errors).toBeDefined()
    const messages = errRow.errors.map((e: any) => e.message)
    expect(messages.some((m: string) => m.includes('Pflichtfeld'))).toBeTruthy()
    expect(messages.some((m: string) => m.includes('Ungueltiger Wert'))).toBeTruthy()
  })
})
