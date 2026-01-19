import { describe, beforeAll, afterAll, beforeEach, it, expect } from '@jest/globals'
import { prismaTest } from '@/tests/utils/prismaTestClient'
import { migrateTestDb } from '@/tests/utils/testDb'
import { createOrUpdateAssessment, calculateAveragePeerRating, getSkillDevelopmentTrend } from './assessment.service'

describe('assessment.service', () => {
  beforeAll(() => {
    migrateTestDb()
  })

  // Kein Reset pro Test, um Windows-Dateisperren zu vermeiden. Tests seeden eigene Daten.

  afterAll(async () => {
    await prismaTest.$disconnect()
  })

  async function seedBasicUnique() {
    const unique = `${Date.now()}_${Math.floor(Math.random() * 1e6)}`
    const emp = await prismaTest.employee.create({
      data: {
        email: `emp+${unique}@example.com`,
        firstName: 'Erika',
        lastName: 'Mustermann',
        passwordHash: 'x',
        department: 'Consulting',
        isAdmin: false,
      },
    })
    const cat = await prismaTest.skillCategory.create({
      data: { name: `Testing_${unique}`, isActive: true, displayOrder: 0 },
    })
    const skill = await prismaTest.skill.create({
      data: { name: `Unit Testing_${unique}`, categoryId: cat.id, isActive: true, displayOrder: 0 },
    })
    return { emp, cat, skill }
  }

  it('createOrUpdateAssessment() - Neue Bewertung', async () => {
    const { emp, skill } = await seedBasicUnique()
    const created = await createOrUpdateAssessment({
      employeeId: emp.id,
      skillId: skill.id,
      assessmentType: 'SELF',
      assessorId: emp.id,
      rating: 7,
      comment: 'ok',
    })
    expect(created.id).toBeDefined()
    expect(created.validTo).toBeNull()
  })

  it('createOrUpdateAssessment() - Update setzt validTo der alten', async () => {
    const { emp, skill } = await seedBasicUnique()
    const first = await createOrUpdateAssessment({ employeeId: emp.id, skillId: skill.id, assessmentType: 'SELF', assessorId: emp.id, rating: 5 })
    const second = await createOrUpdateAssessment({ employeeId: emp.id, skillId: skill.id, assessmentType: 'SELF', assessorId: emp.id, rating: 8 })
    const prev = await prismaTest.skillAssessment.findUnique({ where: { id: first.id } })
    expect(prev?.validTo).not.toBeNull()
    expect(second.validTo).toBeNull()
  })

  it('calculateAveragePeerRating() - Durchschnitt korrekt', async () => {
    const { emp, skill } = await seedBasicUnique()
    // zweiter Assessor, damit beide Peer-Ratings gleichzeitig "current" sind (validTo null)
    const unique = `${Date.now()}_${Math.floor(Math.random() * 1e6)}`
    const assessor2 = await prismaTest.employee.create({
      data: { email: `peer+${unique}@example.com`, firstName: 'Peer', lastName: 'Rater', passwordHash: 'x', department: 'Consulting', isAdmin: false },
    })
    await createOrUpdateAssessment({ employeeId: emp.id, skillId: skill.id, assessmentType: 'PEER', assessorId: emp.id, rating: 4 })
    await createOrUpdateAssessment({ employeeId: emp.id, skillId: skill.id, assessmentType: 'PEER', assessorId: assessor2.id, rating: 8 })
    const avg = await calculateAveragePeerRating(emp.id, skill.id)
    expect(avg).toBe(6)
  })

  it('getSkillDevelopmentTrend() - Timeline-Daten korrekt', async () => {
    const { emp, skill } = await seedBasicUnique()
    await createOrUpdateAssessment({ employeeId: emp.id, skillId: skill.id, assessmentType: 'SELF', assessorId: emp.id, rating: 5 })
    await createOrUpdateAssessment({ employeeId: emp.id, skillId: skill.id, assessmentType: 'PEER', assessorId: emp.id, rating: 7 })
    const trend = await getSkillDevelopmentTrend(emp.id, skill.id, 6)
    expect(trend.length).toBeGreaterThan(0)
    // jeder Punkt hat period und optional self/peer
    expect(trend[0]).toHaveProperty('period')
  })
})
