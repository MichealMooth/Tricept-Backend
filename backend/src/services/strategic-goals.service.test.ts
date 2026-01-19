import { describe, it, expect, jest, beforeEach } from '@jest/globals'

// Mock prisma from config/database so we don't hit a real DB
const mPrisma = {
  strategicGoal: {
    findMany: jest.fn(),
    upsert: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  strategicGoalRating: {
    findMany: jest.fn(),
    upsert: jest.fn(),
    groupBy: jest.fn(),
    deleteMany: jest.fn(),
  },
  $transaction: jest.fn((ops: any[]) => Promise.all(ops.map((op: any) => op))),
}

jest.mock('@/config/database', () => ({ prisma: mPrisma }))

import {
  listGoals,
  upsertGoalsFromJson,
  createGoal,
  updateGoal,
  deleteGoal,
  listGoalsWithMyRatings,
  upsertMyRating,
  listAverages,
} from '@/services/strategic-goals.service'

beforeEach(() => {
  jest.clearAllMocks()
})

describe('strategic-goals.service (mocked prisma)', () => {
  it('listGoals orders by active, displayOrder, createdAt', async () => {
    mPrisma.strategicGoal.findMany.mockResolvedValueOnce([{ id: '1' }])
    const res = await listGoals()
    expect(res).toEqual([{ id: '1' }])
    expect(mPrisma.strategicGoal.findMany).toHaveBeenCalledWith({
      orderBy: [{ isActive: 'desc' }, { displayOrder: 'asc' }, { createdAt: 'asc' }],
    })
  })

  it('upsertGoalsFromJson creates/updates and returns list', async () => {
    const items = [
      { key: 'k1', title: 'T1' },
      { key: 'k2', title: 'T2', description: 'd', displayOrder: 2, isActive: false },
    ]
    mPrisma.$transaction.mockResolvedValueOnce(undefined as any)
    mPrisma.strategicGoal.findMany.mockResolvedValueOnce([{ id: 'a' }, { id: 'b' }])

    const res = await upsertGoalsFromJson(items)
    expect(mPrisma.$transaction).toHaveBeenCalled()
    expect(mPrisma.strategicGoal.upsert).toHaveBeenCalledTimes(2)
    // defaults applied via service
    expect(res).toEqual([{ id: 'a' }, { id: 'b' }])
  })

  it('create/update/delete goal delegates to prisma', async () => {
    mPrisma.strategicGoal.create.mockResolvedValueOnce({ id: 'g1', title: 'T' })
    const created = await createGoal({ key: 'k', title: 'T' })
    expect(created).toEqual({ id: 'g1', title: 'T' })

    mPrisma.strategicGoal.update.mockResolvedValueOnce({ id: 'g1', title: 'T2' })
    const updated = await updateGoal('g1', { title: 'T2' })
    expect(updated.title).toBe('T2')

    mPrisma.strategicGoalRating.deleteMany.mockResolvedValueOnce({})
    mPrisma.strategicGoal.delete.mockResolvedValueOnce({})
    await deleteGoal('g1')
    expect(mPrisma.$transaction).toHaveBeenCalled()
  })

  it('listGoalsWithMyRatings merges ratings onto active goals', async () => {
    mPrisma.strategicGoal.findMany.mockResolvedValueOnce([
      { id: 'g1', isActive: true },
      { id: 'g2', isActive: true },
    ])
    mPrisma.strategicGoalRating.findMany.mockResolvedValueOnce([
      { goalId: 'g2', rating: 3 },
    ])
    const res = await listGoalsWithMyRatings('u1', 2025, 10)
    expect(res).toEqual([
      { goal: { id: 'g1', isActive: true }, rating: null },
      { goal: { id: 'g2', isActive: true }, rating: { goalId: 'g2', rating: 3 } },
    ])
  })

  it('upsertMyRating uses composite key and returns record', async () => {
    mPrisma.strategicGoalRating.upsert.mockResolvedValueOnce({ goalId: 'g1', userId: 'u1', rating: 5 })
    const res = await upsertMyRating({ userId: 'u1', goalId: 'g1', year: 2025, month: 10, rating: 5 })
    expect(res.rating).toBe(5)
    expect(mPrisma.strategicGoalRating.upsert).toHaveBeenCalled()
  })

  it('listAverages returns entries for all active goals, null avg for missing', async () => {
    mPrisma.strategicGoalRating.groupBy.mockResolvedValueOnce([
      { goalId: 'g1', _avg: { rating: 4 }, _count: { _all: 2 } },
    ])
    mPrisma.strategicGoal.findMany.mockResolvedValueOnce([{ id: 'g1' }, { id: 'g2' }])
    const res = await listAverages(2025, 10)
    expect(res).toEqual([
      { goalId: 'g1', avg: 4, count: 2 },
      { goalId: 'g2', avg: null, count: 0 },
    ])
  })
})
