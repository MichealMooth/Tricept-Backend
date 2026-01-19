import { prismaTest, disconnect } from './utils/prismaTestClient'
import { execSync } from 'node:child_process'
import path from 'path'

// Import the Prisma service
import * as referenceProjectsService from '@/services/reference-projects.service'

/**
 * Tests for Reference Projects Prisma Service
 * Task Group 3: Service layer validation tests
 */
describe('Reference Projects Prisma Service', () => {
  const uniqueSuffix = `${Date.now()}_${Math.floor(Math.random() * 1e6)}`

  // Store created IDs for cleanup
  let testEmployeeId: string
  let createdProjectIds: string[] = []

  // Increase timeout for beforeAll which runs migrations
  beforeAll(async () => {
    // Reset and seed the test database
    execSync('npx prisma migrate reset --force --skip-seed', {
      stdio: 'pipe',
      cwd: path.resolve(process.cwd()),
      env: process.env,
    })

    // Run seed to populate lookup tables
    execSync('npx prisma db seed', {
      stdio: 'pipe',
      cwd: path.resolve(process.cwd()),
      env: process.env,
    })

    // Create a test employee for matching
    const employee = await prismaTest.employee.create({
      data: {
        email: `test_emp_${uniqueSuffix}@example.com`,
        firstName: 'Max',
        lastName: 'Mustermann',
        passwordHash: 'x',
        department: 'Consulting',
        isAdmin: false,
        isActive: true,
      },
    })
    testEmployeeId = employee.id
  }, 60000) // 60 second timeout for setup

  afterAll(async () => {
    // Cleanup created projects
    for (const id of createdProjectIds) {
      try {
        await prismaTest.referenceProjectTopic.deleteMany({ where: { referenceProjectId: id } })
        await prismaTest.referenceProjectEmployee.deleteMany({ where: { referenceProjectId: id } })
        await prismaTest.referenceProject.delete({ where: { id } })
      } catch {
        // Ignore cleanup errors
      }
    }

    // Cleanup test employee
    try {
      await prismaTest.employee.delete({ where: { id: testEmployeeId } })
    } catch {
      // Ignore cleanup errors
    }

    await disconnect()
  }, 30000)

  describe('list() function', () => {
    let projectId1: string
    let projectId2: string
    let projectId3: string

    beforeAll(async () => {
      // Create test projects for list tests
      const project1 = await referenceProjectsService.create({
        project_name: `ListTest Project Alpha ${uniqueSuffix}`,
        customer: 'Customer Alpha',
        project_description: 'Description for Alpha project',
        activity_description: 'Activities for Alpha',
        duration_from: '2024-01',
        duration_to: '2024-06',
        contact_person: 'Contact Alpha',
        approved: true,
        person: 'Max Mustermann',
        role: 'Projektleiter',
        topics: ['Testmanagement', 'Migration'],
      })
      projectId1 = project1.id
      createdProjectIds.push(projectId1)

      const project2 = await referenceProjectsService.create({
        project_name: `ListTest Project Beta ${uniqueSuffix}`,
        customer: 'Customer Beta',
        project_description: 'Description for Beta project',
        activity_description: 'Activities for Beta',
        duration_from: '2024-02',
        duration_to: '2024-07',
        contact_person: 'Contact Beta',
        approved: true,
        person: 'Unknown Person',
        role: 'PMO',
        topics: ['Agile Transformation'],
      })
      projectId2 = project2.id
      createdProjectIds.push(projectId2)

      const project3 = await referenceProjectsService.create({
        project_name: `ListTest Project Gamma ${uniqueSuffix}`,
        customer: 'Customer Gamma',
        project_description: 'Description for Gamma project',
        activity_description: 'Activities for Gamma',
        duration_from: '2024-03',
        duration_to: '2024-08',
        contact_person: 'Contact Gamma',
        approved: false,
        person: 'Max Mustermann',
        role: 'Testmanager',
        topics: ['Testmanagement'],
      })
      projectId3 = project3.id
      createdProjectIds.push(projectId3)
    }, 30000)

    it('should return paginated results with correct page and pageSize', async () => {
      const result = await referenceProjectsService.list({ page: 1, pageSize: 2 })

      expect(result.page).toBe(1)
      expect(result.pageSize).toBe(2)
      expect(result.items.length).toBeLessThanOrEqual(2)
      expect(result.total).toBeGreaterThanOrEqual(3) // At least our 3 test projects
    })

    it('should filter by search term across person, project_name, customer', async () => {
      const result = await referenceProjectsService.list({
        search: `Alpha ${uniqueSuffix}`,
        pageSize: 100,
      })

      expect(result.items.length).toBeGreaterThanOrEqual(1)
      const found = result.items.find((p) => p.project_name.includes('Alpha'))
      expect(found).toBeDefined()
    })

    it('should filter by role name', async () => {
      const result = await referenceProjectsService.list({
        role: 'PMO',
        pageSize: 100,
      })

      // Should find at least our Beta project with PMO role
      const found = result.items.find((p) => p.project_name.includes(`Beta ${uniqueSuffix}`))
      expect(found).toBeDefined()
      expect(found?.role).toBe('PMO')
    })

    it('should filter by topic name', async () => {
      const result = await referenceProjectsService.list({
        topic: 'Agile Transformation',
        pageSize: 100,
      })

      // Should find at least our Beta project with Agile Transformation topic
      const found = result.items.find((p) => p.project_name.includes(`Beta ${uniqueSuffix}`))
      expect(found).toBeDefined()
      expect(found?.topics).toContain('Agile Transformation')
    })
  })

  describe('getById() function', () => {
    let testProjectId: string

    beforeAll(async () => {
      const project = await referenceProjectsService.create({
        project_name: `GetById Test Project ${uniqueSuffix}`,
        customer: 'GetById Customer',
        project_description: 'Description for GetById test',
        activity_description: 'Activities for GetById',
        duration_from: '2024-01',
        duration_to: '2024-06',
        contact_person: 'Contact GetById',
        approved: true,
        person: 'Max Mustermann',
        role: 'Projektleiter',
        topics: ['Migration', 'Cut Over'],
      })
      testProjectId = project.id
      createdProjectIds.push(testProjectId)
    }, 15000)

    it('should return project with all relations when found', async () => {
      const project = await referenceProjectsService.getById(testProjectId)

      expect(project).not.toBeNull()
      expect(project?.id).toBe(testProjectId)
      expect(project?.project_name).toContain('GetById Test Project')
      expect(project?.role).toBe('Projektleiter')
      expect(project?.topics).toContain('Migration')
      expect(project?.topics).toContain('Cut Over')
      // person should be derived from employee relation or person_legacy
      expect(project?.person).toBe('Max Mustermann')
    })

    it('should return null when project not found', async () => {
      const project = await referenceProjectsService.getById('non-existent-uuid')

      expect(project).toBeNull()
    })
  })

  describe('create() function', () => {
    it('should create project with valid data and match employee', async () => {
      const project = await referenceProjectsService.create({
        project_name: `Create Test Project ${uniqueSuffix}`,
        customer: 'Create Customer',
        project_description: 'Description for Create test',
        activity_description: 'Activities for Create',
        duration_from: '2024-01',
        duration_to: '2024-06',
        contact_person: 'Contact Create',
        approved: true,
        person: 'Max Mustermann',
        role: 'Projektleiter',
        topics: ['Testmanagement'],
      })

      createdProjectIds.push(project.id)

      expect(project.id).toBeDefined()
      expect(project.project_name).toContain('Create Test Project')
      expect(project.person).toBe('Max Mustermann')
      expect(project.role).toBe('Projektleiter')
      expect(project.topics).toContain('Testmanagement')
      expect(project.created_at).toBeDefined()
      expect(project.updated_at).toBeDefined()
    })

    it('should store person_legacy when employee not matched', async () => {
      const project = await referenceProjectsService.create({
        project_name: `Legacy Person Project ${uniqueSuffix}`,
        customer: 'Legacy Customer',
        project_description: 'Description for legacy test',
        activity_description: 'Activities for legacy',
        duration_from: '2024-01',
        duration_to: '2024-06',
        contact_person: 'Contact Legacy',
        approved: true,
        person: 'Non Existent Person',
        role: 'PMO',
        topics: ['Migration'],
      })

      createdProjectIds.push(project.id)

      expect(project.person).toBe('Non Existent Person')
    })
  })

  describe('update() function', () => {
    let updateProjectId: string

    beforeAll(async () => {
      const project = await referenceProjectsService.create({
        project_name: `Update Test Project ${uniqueSuffix}`,
        customer: 'Update Customer',
        project_description: 'Description for Update test',
        activity_description: 'Activities for Update',
        duration_from: '2024-01',
        duration_to: '2024-06',
        contact_person: 'Contact Update',
        approved: false,
        person: 'Max Mustermann',
        role: 'Projektleiter',
        topics: ['Testmanagement'],
      })
      updateProjectId = project.id
      createdProjectIds.push(updateProjectId)
    }, 15000)

    it('should support partial updates', async () => {
      const updated = await referenceProjectsService.update(updateProjectId, {
        customer: 'Updated Customer Name',
        approved: true,
      })

      expect(updated).not.toBeNull()
      expect(updated?.customer).toBe('Updated Customer Name')
      expect(updated?.approved).toBe(true)
      // Other fields should remain unchanged
      expect(updated?.project_name).toContain('Update Test Project')
    })
  })

  describe('remove() function', () => {
    it('should delete project and return true', async () => {
      const project = await referenceProjectsService.create({
        project_name: `Delete Test Project ${uniqueSuffix}`,
        customer: 'Delete Customer',
        project_description: 'Description for Delete test',
        activity_description: 'Activities for Delete',
        duration_from: '2024-01',
        duration_to: '2024-06',
        contact_person: 'Contact Delete',
        approved: true,
        person: 'Max Mustermann',
        role: 'PMO',
        topics: ['Migration'],
      })

      const result = await referenceProjectsService.remove(project.id)

      expect(result).toBe(true)

      // Verify project is deleted
      const deleted = await referenceProjectsService.getById(project.id)
      expect(deleted).toBeNull()
    })
  })

  describe('max 6 topics validation', () => {
    it('should reject creation with more than 6 topics', async () => {
      await expect(
        referenceProjectsService.create({
          project_name: `Too Many Topics Project ${uniqueSuffix}`,
          customer: 'Topics Customer',
          project_description: 'Description',
          activity_description: 'Activities',
          duration_from: '2024-01',
          duration_to: '2024-06',
          contact_person: 'Contact',
          approved: true,
          person: 'Max Mustermann',
          role: 'Projektleiter',
          topics: [
            'Testmanagement',
            'Migration',
            'Cut Over',
            'Agile Transformation',
            'Digitale Transformation',
            'Prozessoptimierung',
            'Regulatorik/Compliance', // 7th topic - should fail
          ],
        })
      ).rejects.toThrow('Maximum 6 topics allowed per project')
    })
  })
})
