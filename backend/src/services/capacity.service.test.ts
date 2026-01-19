import { describe, it, expect, jest, beforeEach } from '@jest/globals'

const mPrisma = {
  userCapacity: {
    findMany: jest.fn(),
    upsert: jest.fn(),
  },
  employee: {
    findMany: jest.fn(),
  },
}

jest.mock('@/config/database', () => ({ prisma: mPrisma }))

import { getUserYearCapacities, upsertUserMonthCapacity, getOverviewByYear } from '@/services/capacity.service'

beforeEach(() => {
  jest.clearAllMocks()
})

describe('capacity.service (mocked prisma)', () => {
  it('getUserYearCapacities parses allocations JSON and orders by month', async () => {
    mPrisma.userCapacity.findMany.mockResolvedValueOnce([
      { userId: 'u1', year: 2025, month: 1, allocations: '[{"project_name":"X","percent":50}]', totalPercent: 50 },
      { userId: 'u1', year: 2025, month: 2, allocations: 'not-json', totalPercent: 0 },
    ])
    const res = await getUserYearCapacities('u1', 2025)
    expect(mPrisma.userCapacity.findMany).toHaveBeenCalledWith({ where: { userId: 'u1', year: 2025 }, orderBy: { month: 'asc' } })
    expect(res[0].allocations).toEqual([{ project_name: 'X', percent: 50 }])
    expect(res[1].allocations).toEqual([])
  })

  it('upsertUserMonthCapacity stringifies allocations and parses back', async () => {
    mPrisma.userCapacity.upsert.mockResolvedValueOnce({ userId: 'u1', year: 2025, month: 3, allocations: '[{"percent":100}]', totalPercent: 100 })
    const res = await upsertUserMonthCapacity({ userId: 'u1', year: 2025, month: 3, allocations: [{ percent: 100 }], totalPercent: 100 })
    expect(res.allocations).toEqual([{ percent: 100 }])
    const call = mPrisma.userCapacity.upsert.mock.calls[0][0]
    expect(call.create.allocations).toBe('[{"percent":100}]')
  })

  it('getOverviewByYear returns 12 months per user with nulls for missing', async () => {
    mPrisma.userCapacity.findMany.mockResolvedValueOnce([
      { userId: 'u1', year: 2025, month: 1, totalPercent: 50 },
      { userId: 'u1', year: 2025, month: 12, totalPercent: 80 },
    ])
    mPrisma.employee.findMany.mockResolvedValueOnce([
      { id: 'u1', firstName: 'Erika', lastName: 'Mustermann', isActive: true },
      { id: 'u2', firstName: 'Max', lastName: 'Maier', isActive: false },
    ])
    const res = await getOverviewByYear(2025)
    const u1 = res.find((r) => r.userId === 'u1')!
    expect(u1.months.length).toBe(12)
    expect(u1.months[0]).toBe(50)
    expect(u1.months[11]).toBe(80)
    const u2 = res.find((r) => r.userId === 'u2')!
    expect(u2.months.every((m) => m === null)).toBe(true)
  })
})
