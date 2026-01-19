import { describe, beforeAll, afterAll, beforeEach, it, expect } from '@jest/globals'
import { prismaTest } from '@/tests/utils/prismaTestClient'
import { migrateTestDb } from '@/tests/utils/testDb'
import {
  createCategory,
  updateCategory,
  createSkill,
  updateSkill,
  getCategoriesTree,
  softDeleteCategory,
  reactivateCategoryCascade,
  hardDeleteCategoryCascade,
  importSkillGroups,
} from '@/services/skill.service'

describe('skill.service', () => {
  beforeAll(() => {
    migrateTestDb()
  })
  // kein Reset pro Test, um Windows-Dateisperren zu vermeiden
  afterAll(async () => prismaTest.$disconnect())

  it('create/update category and skill, getCategoriesTree returns nested structure', async () => {
    // root cat
    const root = await createCategory({ name: 'Root' })
    // child cat
    const child = await createCategory({ name: 'Child', parentId: root.id })
    // skills
    await createSkill({ name: 'S1', categoryId: root.id })
    await createSkill({ name: 'S2', categoryId: child.id })

    // update
    await updateCategory(child.id, { description: 'child', displayOrder: 1 })
    await updateSkill(
      (await prismaTest.skill.findFirstOrThrow({ where: { name: 'S1' } })).id,
      { description: 'updated' }
    )

    const tree = await getCategoriesTree()
    // finde den Root-Knoten in der Ergebnisliste
    const rootNode = tree.find((n) => n.name === 'Root')!
    expect(rootNode).toBeDefined()
    expect(rootNode.skills.map((s) => s.name)).toContain('S1')
    const childNode = rootNode.children.find((c) => c.name === 'Child')!
    expect(childNode).toBeDefined()
    expect(childNode.skills.map((s) => s.name)).toContain('S2')
  })

  it('softDeleteCategory deactivates cascade, reactivateCategoryCascade reactivates', async () => {
    const a = await createCategory({ name: 'A' })
    const b = await createCategory({ name: 'B', parentId: a.id })
    const sA = await createSkill({ name: 'SA', categoryId: a.id })
    const sB = await createSkill({ name: 'SB', categoryId: b.id })

    await softDeleteCategory(a.id)
    const afterSoft = await prismaTest.skillCategory.findMany({ where: { id: { in: [a.id, b.id] } } })
    expect(afterSoft.every((c) => c.isActive === false)).toBe(true)
    const skillsAfterSoft = await prismaTest.skill.findMany({ where: { id: { in: [sA.id, sB.id] } } })
    expect(skillsAfterSoft.every((s) => s.isActive === false)).toBe(true)

    await reactivateCategoryCascade(a.id)
    const afterReact = await prismaTest.skillCategory.findMany({ where: { id: { in: [a.id, b.id] } } })
    expect(afterReact.every((c) => c.isActive === true)).toBe(true)
    const skillsAfterReact = await prismaTest.skill.findMany({ where: { id: { in: [sA.id, sB.id] } } })
    expect(skillsAfterReact.every((s) => s.isActive === true)).toBe(true)
  })

  it('hardDeleteCategoryCascade removes categories and their skills', async () => {
    const a = await createCategory({ name: 'DelA' })
    const b = await createCategory({ name: 'DelB', parentId: a.id })
    const sB = await createSkill({ name: 'DelSB', categoryId: b.id })

    await hardDeleteCategoryCascade(a.id)

    const catCount = await prismaTest.skillCategory.count({ where: { id: { in: [a.id, b.id] } } })
    const skillCount = await prismaTest.skill.count({ where: { id: sB.id } })
    expect(catCount).toBe(0)
    expect(skillCount).toBe(0)
  })

  it('importSkillGroups creates and updates categories/skills', async () => {
    const res1 = await importSkillGroups({
      skillGroups: [
        { title: 'Group1', skills: [{ name: 'A' }, { name: 'B', description: 'desc' }] },
        { title: 'Group2', skills: [{ name: 'C', displayOrder: 2 }] },
      ],
    })
    expect(res1.createdCategories).toBe(2)
    expect(res1.createdSkills).toBe(3)

    const res2 = await importSkillGroups({
      skillGroups: [
        { title: 'Group1', skills: [{ name: 'A', description: 'new' }] }, // update existing
      ],
    })
    expect(res2.updatedSkills).toBe(1)
    const updatedA = await prismaTest.skill.findFirstOrThrow({ where: { name: 'A' } })
    expect(updatedA.description).toBe('new')
  })
})
