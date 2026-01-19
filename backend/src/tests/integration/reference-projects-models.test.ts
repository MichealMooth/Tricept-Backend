import { prismaTest, disconnect } from './utils/prismaTestClient'
import { resetTestDb } from './utils/testDb'

/**
 * Tests for Reference Projects Prisma Models
 * Task Group 1: Database schema validation tests
 */
describe('Reference Projects Models', () => {
  const uniqueSuffix = `${Date.now()}_${Math.floor(Math.random() * 1e6)}`

  beforeAll(async () => {
    // Ensure test database is migrated
    await resetTestDb()
  })

  afterAll(async () => {
    await disconnect()
  })

  describe('Role Model', () => {
    it('should create and read a Role with unique name', async () => {
      const roleName = `TestRole_${uniqueSuffix}`

      const role = await prismaTest.role.create({
        data: { name: roleName },
      })

      expect(role.id).toBeDefined()
      expect(role.name).toBe(roleName)
      expect(role.createdAt).toBeInstanceOf(Date)
      expect(role.updatedAt).toBeInstanceOf(Date)

      // Read back
      const fetched = await prismaTest.role.findUnique({ where: { id: role.id } })
      expect(fetched).not.toBeNull()
      expect(fetched?.name).toBe(roleName)

      // Cleanup
      await prismaTest.role.delete({ where: { id: role.id } })
    })

    it('should enforce unique name constraint on Role', async () => {
      const roleName = `UniqueRole_${uniqueSuffix}`

      await prismaTest.role.create({ data: { name: roleName } })

      await expect(
        prismaTest.role.create({ data: { name: roleName } })
      ).rejects.toThrow()

      // Cleanup
      await prismaTest.role.delete({ where: { name: roleName } })
    })
  })

  describe('Topic Model', () => {
    it('should create and read a Topic with unique name', async () => {
      const topicName = `TestTopic_${uniqueSuffix}`

      const topic = await prismaTest.topic.create({
        data: { name: topicName },
      })

      expect(topic.id).toBeDefined()
      expect(topic.name).toBe(topicName)
      expect(topic.createdAt).toBeInstanceOf(Date)
      expect(topic.updatedAt).toBeInstanceOf(Date)

      // Read back
      const fetched = await prismaTest.topic.findUnique({ where: { id: topic.id } })
      expect(fetched).not.toBeNull()
      expect(fetched?.name).toBe(topicName)

      // Cleanup
      await prismaTest.topic.delete({ where: { id: topic.id } })
    })
  })

  describe('ReferenceProject Model', () => {
    it('should create ReferenceProject with required fields and role relation', async () => {
      // Create prerequisite Role
      const role = await prismaTest.role.create({
        data: { name: `ProjectRole_${uniqueSuffix}` },
      })

      const project = await prismaTest.referenceProject.create({
        data: {
          project_name: 'Test Project',
          customer: 'Test Customer',
          project_description: 'A test project description',
          activity_description: 'Test activities performed',
          duration_from: '2024-01',
          duration_to: '2024-12',
          contact_person: 'John Doe',
          approved: true,
          roleId: role.id,
        },
        include: { role: true },
      })

      expect(project.id).toBeDefined()
      expect(project.project_name).toBe('Test Project')
      expect(project.customer).toBe('Test Customer')
      expect(project.approved).toBe(true)
      expect(project.role.name).toBe(`ProjectRole_${uniqueSuffix}`)
      expect(project.person_legacy).toBeNull()
      expect(project.short_teaser).toBeNull()
      expect(project.short_project_description).toBeNull()

      // Cleanup
      await prismaTest.referenceProject.delete({ where: { id: project.id } })
      await prismaTest.role.delete({ where: { id: role.id } })
    })

    it('should support person_legacy fallback field', async () => {
      const role = await prismaTest.role.create({
        data: { name: `LegacyRole_${uniqueSuffix}` },
      })

      const project = await prismaTest.referenceProject.create({
        data: {
          project_name: 'Legacy Person Project',
          customer: 'Legacy Customer',
          project_description: 'Project with legacy person',
          activity_description: 'Activities',
          duration_from: '2023-01',
          duration_to: '2023-06',
          contact_person: 'Jane Smith',
          approved: false,
          roleId: role.id,
          person_legacy: 'Max Mustermann', // Unmatched employee stored as legacy
        },
      })

      expect(project.person_legacy).toBe('Max Mustermann')

      // Cleanup
      await prismaTest.referenceProject.delete({ where: { id: project.id } })
      await prismaTest.role.delete({ where: { id: role.id } })
    })
  })

  describe('ReferenceProjectTopic Junction Table', () => {
    it('should link ReferenceProject to multiple Topics via junction', async () => {
      const role = await prismaTest.role.create({
        data: { name: `TopicTestRole_${uniqueSuffix}` },
      })

      const topic1 = await prismaTest.topic.create({
        data: { name: `Topic1_${uniqueSuffix}` },
      })

      const topic2 = await prismaTest.topic.create({
        data: { name: `Topic2_${uniqueSuffix}` },
      })

      const project = await prismaTest.referenceProject.create({
        data: {
          project_name: 'Multi-Topic Project',
          customer: 'Topic Customer',
          project_description: 'Project with multiple topics',
          activity_description: 'Activities',
          duration_from: '2024-01',
          duration_to: '2024-06',
          contact_person: 'Contact Person',
          approved: true,
          roleId: role.id,
          topics: {
            create: [
              { topicId: topic1.id },
              { topicId: topic2.id },
            ],
          },
        },
        include: {
          topics: { include: { topic: true } },
        },
      })

      expect(project.topics).toHaveLength(2)
      const topicNames = project.topics.map((t) => t.topic.name).sort()
      expect(topicNames).toEqual([`Topic1_${uniqueSuffix}`, `Topic2_${uniqueSuffix}`].sort())

      // Cleanup
      await prismaTest.referenceProjectTopic.deleteMany({ where: { referenceProjectId: project.id } })
      await prismaTest.referenceProject.delete({ where: { id: project.id } })
      await prismaTest.topic.delete({ where: { id: topic1.id } })
      await prismaTest.topic.delete({ where: { id: topic2.id } })
      await prismaTest.role.delete({ where: { id: role.id } })
    })
  })

  describe('ReferenceProjectEmployee Junction Table', () => {
    it('should link ReferenceProject to Employee via junction', async () => {
      // Create Employee
      const employee = await prismaTest.employee.create({
        data: {
          email: `refproj_emp_${uniqueSuffix}@example.com`,
          firstName: 'Anna',
          lastName: 'Beispiel',
          passwordHash: 'x',
          department: 'Consulting',
          isAdmin: false,
        },
      })

      const role = await prismaTest.role.create({
        data: { name: `EmpLinkRole_${uniqueSuffix}` },
      })

      const project = await prismaTest.referenceProject.create({
        data: {
          project_name: 'Employee Link Project',
          customer: 'Link Customer',
          project_description: 'Project linked to employee',
          activity_description: 'Activities',
          duration_from: '2024-01',
          duration_to: '2024-06',
          contact_person: 'Contact',
          approved: true,
          roleId: role.id,
          employees: {
            create: [{ employeeId: employee.id }],
          },
        },
        include: {
          employees: { include: { employee: true } },
        },
      })

      expect(project.employees).toHaveLength(1)
      expect(project.employees[0].employee.firstName).toBe('Anna')
      expect(project.employees[0].employee.lastName).toBe('Beispiel')

      // Also verify bidirectional relation from Employee side
      const empWithProjects = await prismaTest.employee.findUnique({
        where: { id: employee.id },
        include: { referenceProjects: { include: { referenceProject: true } } },
      })

      expect(empWithProjects?.referenceProjects).toHaveLength(1)
      expect(empWithProjects?.referenceProjects[0].referenceProject.project_name).toBe('Employee Link Project')

      // Cleanup
      await prismaTest.referenceProjectEmployee.deleteMany({ where: { referenceProjectId: project.id } })
      await prismaTest.referenceProject.delete({ where: { id: project.id } })
      await prismaTest.role.delete({ where: { id: role.id } })
      await prismaTest.employee.delete({ where: { id: employee.id } })
    })
  })
})
