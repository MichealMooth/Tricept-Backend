import { prismaTest, disconnect } from './utils/prismaTestClient'
import { execSync } from 'node:child_process'
import path from 'path'

/**
 * Tests for Seed Data: Role and Topic Lookup Tables
 * Validates that seed data matches the expected enums.
 */
describe('Seed Data for Lookup Tables', () => {
  /**
   * Expected Role values matching RolesEnum in constants/reference-projects.ts
   * Note: Using exact values with proper German characters (umlauts)
   */
  const EXPECTED_ROLES = [
    'Projektleiter',
    'IT-Projektleiter',
    'PMO',
    'Testmanager',
    'Projektunterstuetzung', // Note: Using 'ue' instead of umlaut for database compatibility
    'Business-Analyst',
    'Scrum-Master',
    'Tester',
    'TPL',
    'PO',
  ]

  /**
   * Expected Topic values matching TopicsEnum in constants/reference-projects.ts
   */
  const EXPECTED_TOPICS = [
    'Testmanagement',
    'Migration',
    'Cut Over',
    'Agile Transformation',
    'Digitale Transformation',
    'Prozessoptimierung',
    'Regulatorik/Compliance',
    'Informationssicherheit',
  ]

  /**
   * Helper to run the seed script
   */
  function runSeed() {
    execSync('npx prisma db seed', {
      stdio: 'pipe',
      cwd: path.resolve(process.cwd()),
      env: process.env,
    })
  }

  beforeAll(async () => {
    // Reset database and run seed
    execSync('npx prisma migrate reset --force --skip-seed', {
      stdio: 'pipe',
      cwd: path.resolve(process.cwd()),
      env: process.env,
    })

    // Run seed once before all tests
    runSeed()
  })

  afterAll(async () => {
    await disconnect()
  })

  describe('Role Seed Data', () => {
    it('should seed all 10 Roles correctly', async () => {
      const roles = await prismaTest.role.findMany({
        orderBy: { name: 'asc' },
      })

      expect(roles).toHaveLength(10)

      const roleNames = roles.map((r) => r.name).sort()
      expect(roleNames).toEqual([...EXPECTED_ROLES].sort())

      // Verify each role has proper timestamps
      for (const role of roles) {
        expect(role.id).toBeDefined()
        expect(role.createdAt).toBeInstanceOf(Date)
        expect(role.updatedAt).toBeInstanceOf(Date)
      }
    })
  })

  describe('Topic Seed Data', () => {
    it('should seed all 8 Topics correctly', async () => {
      const topics = await prismaTest.topic.findMany({
        orderBy: { name: 'asc' },
      })

      expect(topics).toHaveLength(8)

      const topicNames = topics.map((t) => t.name).sort()
      expect(topicNames).toEqual([...EXPECTED_TOPICS].sort())

      // Verify each topic has proper timestamps
      for (const topic of topics) {
        expect(topic.id).toBeDefined()
        expect(topic.createdAt).toBeInstanceOf(Date)
        expect(topic.updatedAt).toBeInstanceOf(Date)
      }
    })
  })

  describe('Idempotent Seeding', () => {
    it('should not create duplicates when seed is run twice', async () => {
      // Get counts before second seed
      const rolesBefore = await prismaTest.role.count()
      const topicsBefore = await prismaTest.topic.count()

      // Run seed again
      runSeed()

      // Get counts after second seed
      const rolesAfter = await prismaTest.role.count()
      const topicsAfter = await prismaTest.topic.count()

      // Counts should remain the same (no duplicates)
      expect(rolesAfter).toBe(rolesBefore)
      expect(topicsAfter).toBe(topicsBefore)

      // Verify exact counts
      expect(rolesAfter).toBe(10)
      expect(topicsAfter).toBe(8)
    })
  })

  describe('Seed Data Matches Enum Values', () => {
    it('should have Role seed values matching RolesEnum constants', async () => {
      // Verify each expected role exists in the database
      for (const roleName of EXPECTED_ROLES) {
        const role = await prismaTest.role.findUnique({
          where: { name: roleName },
        })
        expect(role).not.toBeNull()
        expect(role?.name).toBe(roleName)
      }
    })

    it('should have Topic seed values matching TopicsEnum constants', async () => {
      // Verify each expected topic exists in the database
      for (const topicName of EXPECTED_TOPICS) {
        const topic = await prismaTest.topic.findUnique({
          where: { name: topicName },
        })
        expect(topic).not.toBeNull()
        expect(topic?.name).toBe(topicName)
      }
    })
  })
})
