import { describe, it, expect, jest, beforeEach } from '@jest/globals'

// Capture listeners registered via prisma.$on('query', ...)
let registeredQueryHandler: Function | null = null

// Mock logger to assert logs and avoid real output
const logger = {
  debug: jest.fn(),
  info: jest.fn(),
  error: jest.fn(),
}

// Mock PrismaClient class
class PrismaClientMock {
  opts: any
  constructor(opts?: any) {
    this.opts = opts
  }
  $on(event: string, handler: any) {
    if (event === 'query') registeredQueryHandler = handler
  }
  $connect = jest.fn().mockResolvedValue(undefined)
  $disconnect = jest.fn().mockResolvedValue(undefined)
}

jest.mock('@/config/logger', () => ({ logger }))
jest.mock('@prisma/client', () => ({ PrismaClient: PrismaClientMock }))

beforeEach(() => {
  jest.resetModules()
  registeredQueryHandler = null
  jest.clearAllMocks()
})

describe('config/database', () => {
  it('creates PrismaClient with log config and registers query logger in development', async () => {
    const oldEnv = process.env.NODE_ENV
    process.env.NODE_ENV = 'development'
    const mod = await import('@/config/database')
    // verify prisma constructed with log options
    // @ts-ignore accessing mock
    const prisma: any = (mod as any).prisma
    expect(prisma.opts?.log).toEqual([
      { level: 'query', emit: 'event' },
      { level: 'error', emit: 'stdout' },
      { level: 'warn', emit: 'stdout' },
    ])
    // simulate a query event
    expect(registeredQueryHandler).toBeInstanceOf(Function)
    registeredQueryHandler?.({ query: 'SELECT 1', duration: 5 })
    expect(logger.debug).toHaveBeenCalledWith('Query: ' + 'SELECT 1')
    expect(logger.debug).toHaveBeenCalledWith('Duration: ' + 5 + 'ms')
    process.env.NODE_ENV = oldEnv
  })

  it('connectDatabase/disconnectDatabase call prisma and log info', async () => {
    const { connectDatabase, disconnectDatabase, prisma } = await import('@/config/database')
    await connectDatabase()
    // @ts-ignore mock method
    expect((prisma as any).$connect).toHaveBeenCalled()
    await disconnectDatabase()
    // @ts-ignore mock method
    expect((prisma as any).$disconnect).toHaveBeenCalled()
    expect(logger.info).toHaveBeenCalled()
  })
})
