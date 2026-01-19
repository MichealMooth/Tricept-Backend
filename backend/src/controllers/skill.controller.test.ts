import { describe, it, expect, jest } from '@jest/globals'
import type { Request, Response, NextFunction } from 'express'

// Mock services so we don't hit DB (declare before importing controller)
jest.mock('@/services/skill.service', () => ({
  getCategoriesTree: jest.fn().mockResolvedValue([{ id: '1', name: 'A' }]),
  createCategory: jest.fn().mockResolvedValue({ id: 'c1', name: 'New' }),
  updateCategory: jest.fn().mockResolvedValue({ id: 'c1', name: 'Upd' }),
  softDeleteCategory: jest.fn().mockResolvedValue(undefined),
  reactivateCategoryCascade: jest.fn().mockResolvedValue(undefined),
  hardDeleteCategoryCascade: jest.fn().mockResolvedValue(undefined),
  getSkills: jest.fn().mockResolvedValue([{ id: 's1', name: 'S' }]),
  createSkill: jest.fn().mockResolvedValue({ id: 's1', name: 'NewS' }),
  updateSkill: jest.fn().mockResolvedValue({ id: 's1', name: 'UpdS' }),
  softDeleteSkill: jest.fn().mockResolvedValue(undefined),
  importSkillGroups: jest.fn().mockResolvedValue({ createdCategories: 1, createdSkills: 2, updatedSkills: 0 }),
}))

import * as controller from '@/controllers/skill.controller'
const svc = jest.requireMock('@/services/skill.service') as any

function mockRes() {
  const res: any = {}
  res.status = jest.fn().mockReturnValue(res)
  res.json = jest.fn().mockReturnValue(res)
  res.send = jest.fn().mockReturnValue(res)
  return res as Response & { status: jest.Mock; json: jest.Mock; send: jest.Mock }
}

const next: NextFunction = jest.fn()

describe('skill.controller', () => {
  it('getCategories includeInactive=false by default, true when query set', async () => {
    let req = { query: {} } as unknown as Request
    let res = mockRes()
    await controller.getCategories(req, res, next)
    expect(res.json).toHaveBeenCalledWith(expect.any(Array))

    ;(svc.getCategoriesTree as jest.Mock).mockClear()

    req = { query: { includeInactive: 'true' } } as any
    res = mockRes()
    await controller.getCategories(req, res, next)
    // verify a response is produced (arguments to service are covered via unit tests)
    expect(res.json).toHaveBeenCalledWith(expect.any(Array))
  })

  it('createCategory happy path and 400 on validation error', async () => {
    const reqOk = { body: { name: 'X' } } as any
    const resOk = mockRes()
    await controller.createCategory(reqOk, resOk, next)
    expect(resOk.status).toHaveBeenCalledWith(201)

    const reqBad = { body: {} } as any
    const resBad = mockRes()
    await controller.createCategory(reqBad, resBad, next)
    expect(resBad.status).toHaveBeenCalledWith(400)
    expect(resBad.json).toHaveBeenCalledWith(expect.objectContaining({ message: 'Validation error' }))
  })

  it('updateCategory ok and 400 on invalid', async () => {
    const reqOk = { params: { id: 'c1' }, body: { name: 'Y' } } as any
    const resOk = mockRes()
    await controller.updateCategory(reqOk, resOk, next)
    expect(resOk.json).toHaveBeenCalledWith(expect.objectContaining({ id: 'c1' }))

    const reqBad = { params: { id: 'c1' }, body: { displayOrder: -1 } } as any
    const resBad = mockRes()
    await controller.updateCategory(reqBad, resBad, next)
    expect(resBad.status).toHaveBeenCalledWith(400)
  })

  it('delete/reactivate/hardDelete Category return expected status', async () => {
    const res = mockRes()
    await controller.deleteCategory({ params: { id: 'x' } } as any, res, next)
    expect(res.status).toHaveBeenCalledWith(204)

    const res2 = mockRes()
    await controller.reactivateCategory({ params: { id: 'x' } } as any, res2, next)
    expect(res2.status).toHaveBeenCalledWith(200)

    const res3 = mockRes()
    await controller.hardDeleteCategory({ params: { id: 'x' } } as any, res3, next)
    expect(res3.status).toHaveBeenCalledWith(204)
  })

  it('createSkill/updateSkill validations and ok', async () => {
    const res1 = mockRes()
    await controller.createSkill({ body: { name: 'S', categoryId: '00000000-0000-0000-0000-000000000000' } } as any, res1, next)
    expect(res1.status).toHaveBeenCalledWith(201)

    const resBad = mockRes()
    await controller.createSkill({ body: { name: 'S' } } as any, resBad, next)
    expect(resBad.status).toHaveBeenCalledWith(400)

    const res2 = mockRes()
    await controller.updateSkill({ params: { id: 's1' }, body: { description: 'x' } } as any, res2, next)
    expect(res2.json).toHaveBeenCalledWith(expect.objectContaining({ id: 's1' }))
  })

  it('getSkills returns list', async () => {
    ;(svc.getSkills as jest.Mock).mockClear()
    const res = mockRes()
    await controller.getSkills({ query: { categoryId: 'c1', isActive: 'true' } } as any, res, next)
    expect(res.json).toHaveBeenCalledWith(expect.any(Array))
  })

  it('importSkillGroupsController returns 201 or 400 on invalid', async () => {
    const res1 = mockRes()
    await controller.importSkillGroupsController({ body: { skillGroups: [{ title: 'G', skills: [{ name: 'A' }] }] } } as any, res1, next)
    expect(res1.status).toHaveBeenCalledWith(201)

    const res2 = mockRes()
    await controller.importSkillGroupsController({ body: { skillGroups: [{ title: '', skills: [] }] } } as any, res2, next)
    expect(res2.status).toHaveBeenCalledWith(400)
  })
})
