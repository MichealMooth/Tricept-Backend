import { describe, it, expect, jest, beforeEach } from '@jest/globals'

// Mock prisma
const mPrisma = {
  skillAssessment: {
    findMany: jest.fn(),
    findFirst: jest.fn(),
    update: jest.fn(),
    create: jest.fn(),
  },
}

jest.mock('@/config/database', () => ({ prisma: mPrisma }))

import {
  getCurrentAssessments,
  getAssessmentHistory,
  calculateAveragePeerRating,
  getSkillDevelopmentTrend,
} from '@/services/assessment.service'

beforeEach(() => {
  jest.clearAllMocks()
})

describe('assessment.service (unit, mocked prisma)', () => {
  it('getCurrentAssessments groups by skill and separates self vs peer; uses fallback assessor', async () => {
    mPrisma.skillAssessment.findMany.mockResolvedValueOnce([
      {
        employeeId: 'e1',
        skillId: 's1',
        assessmentType: 'SELF',
        rating: 5,
        comment: null,
        skill: { id: 's1', name: 'Skill 1', description: null },
        assessor: { id: 'a1', firstName: 'U', lastName: 'S', email: 'u@example.com' },
      },
      {
        employeeId: 'e1',
        skillId: 's1',
        assessmentType: 'PEER',
        rating: 7,
        comment: 'ok',
        skill: { id: 's1', name: 'Skill 1', description: null },
        assessor: null,
      },
    ])
    const res = await getCurrentAssessments('e1', false)
    expect(res).toHaveLength(1)
    expect(res[0].selfRating?.rating).toBe(5)
    expect(res[0].peerRatings[0].assessor.id).toBe('unknown')
  })

  it('getAssessmentHistory delegates to prisma.findMany', async () => {
    mPrisma.skillAssessment.findMany.mockResolvedValueOnce([{ id: 'x' }])
    const hist = await getAssessmentHistory('e1', 's1')
    expect(hist).toEqual([{ id: 'x' }])
  })

  it('calculateAveragePeerRating returns null for empty and average to 2 decimals', async () => {
    // empty
    mPrisma.skillAssessment.findMany.mockResolvedValueOnce([])
    const none = await calculateAveragePeerRating('e1', 's1')
    expect(none).toBeNull()
    // with values
    mPrisma.skillAssessment.findMany.mockResolvedValueOnce([{ rating: 5 }, { rating: 7 }])
    const avg = await calculateAveragePeerRating('e1', 's1')
    expect(avg).toBe(6)
  })

  it('getSkillDevelopmentTrend aggregates per month and sorts', async () => {
    const now = new Date()
    const lastMonth = new Date(now)
    lastMonth.setMonth(now.getMonth() - 1)
    mPrisma.skillAssessment.findMany.mockResolvedValueOnce([
      { assessmentType: 'SELF', rating: 6, validFrom: lastMonth },
      { assessmentType: 'PEER', rating: 4, validFrom: lastMonth },
      { assessmentType: 'SELF', rating: 8, validFrom: now },
    ])
    const trend = await getSkillDevelopmentTrend('e1', 's1', 2)
    expect(trend.length).toBeGreaterThan(0)
    expect(trend[0]).toHaveProperty('period')
  })
})
