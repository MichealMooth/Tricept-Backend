describe('config/env', () => {
  const originalEnv = process.env

  afterEach(() => {
    process.env = { ...originalEnv }
    jest.resetModules()
  })

  test('loads required variables and defaults', async () => {
    process.env = {
      ...originalEnv,
      NODE_ENV: 'test',
      PORT: '4100',
      DATABASE_URL: 'file:./test.db',
      JWT_SECRET: 's',
      SESSION_SECRET: 'sess',
      // leave CORS_ORIGIN empty to use default
    }
    const { env } = await import('@/config/env')
    expect(env.nodeEnv).toBe('test')
    expect(env.port).toBe(4100)
    expect(env.databaseUrl).toBe('file:./test.db')
    expect(env.jwtSecret).toBe('s')
    expect(env.sessionSecret).toBe('sess')
    expect(env.corsOrigin).toBeDefined()
    expect(env.rateLimitWindowMs).toBeGreaterThan(0)
    expect(env.rateLimitMax).toBeGreaterThan(0)
  })
})
