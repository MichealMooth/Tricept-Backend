import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

/**
 * Seed values for Role lookup table
 * Values from existing RolesEnum in reference-projects.store.ts
 * Note: Using 'ue' instead of umlaut for database compatibility
 */
const ROLE_SEED_VALUES = [
  'Projektleiter',
  'IT-Projektleiter',
  'PMO',
  'Testmanager',
  'Projektunterstuetzung',
  'Business-Analyst',
  'Scrum-Master',
  'Tester',
  'TPL',
  'PO',
]

/**
 * Seed values for Topic lookup table
 * Values from existing TopicsEnum in reference-projects.store.ts
 */
const TOPIC_SEED_VALUES = [
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
 * Seed Role lookup table with idempotent upsert pattern
 */
async function seedRoles() {
  console.log('Seeding Roles...')

  for (const roleName of ROLE_SEED_VALUES) {
    await prisma.role.upsert({
      where: { name: roleName },
      update: {},
      create: { name: roleName },
    })
  }

  console.log(`Seeded ${ROLE_SEED_VALUES.length} roles`)
}

/**
 * Seed Topic lookup table with idempotent upsert pattern
 */
async function seedTopics() {
  console.log('Seeding Topics...')

  for (const topicName of TOPIC_SEED_VALUES) {
    await prisma.topic.upsert({
      where: { name: topicName },
      update: {},
      create: { name: topicName },
    })
  }

  console.log(`Seeded ${TOPIC_SEED_VALUES.length} topics`)
}

async function main() {
  // Seed employees
  const adminEmail = 'admin@tricept.de'
  const testEmail = 'test@tricept.de'

  const adminPassword = 'Admin2025!Tricept'
  const testPassword = 'Test2025!'

  const admin = await prisma.employee.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail,
      passwordHash: bcrypt.hashSync(adminPassword, 10),
      firstName: 'Admin',
      lastName: 'User',
      isAdmin: true,
      isActive: true,
      department: 'Consulting',
      role: 'ADMIN',
    },
  })

  const testUser = await prisma.employee.upsert({
    where: { email: testEmail },
    update: {},
    create: {
      email: testEmail,
      passwordHash: bcrypt.hashSync(testPassword, 10),
      firstName: 'Test',
      lastName: 'Consultant',
      isAdmin: false,
      isActive: true,
      department: 'Consulting',
      role: 'USER',
    },
  })

  // Seed some skill categories (basic set)
  const categories = [
    { name: 'Projektmanagement', description: 'Klassisches und agiles PM' },
    { name: 'Scrum Master', description: 'Scrum, Facilitation, Coaching' },
    { name: 'Testing', description: 'Testkonzepte, Tools, Automatisierung' },
    { name: 'Agilität', description: 'Agile Methoden & Kultur' },
    { name: 'IPMA', description: 'IPMA Kompetenzen' },
    { name: 'Bankfachwissen', description: 'Domänenwissen Banking' },
  ]

  for (let i = 0; i < categories.length; i++) {
    const c = categories[i]
    await prisma.skillCategory.upsert({
      where: { name: c.name },
      update: {},
      create: {
        name: c.name,
        description: c.description,
        displayOrder: i,
        isActive: true,
      },
    })
  }

  // Seed Role and Topic lookup tables for Reference Projects
  await seedRoles()
  await seedTopics()

  console.log('Seed completed:', { admin: admin.email, test: testUser.email })
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
