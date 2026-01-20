/**
 * Team Groups Seed Script
 *
 * Creates TeamGroups based on unique departments from the Employee table.
 * Each employee is added to their department's TeamGroup with the USER role.
 *
 * This script is idempotent - it will skip creating TeamGroups that already exist
 * and will not duplicate memberships.
 *
 * Task Group 6.4: Create optional seed script for TeamGroups from departments
 *
 * Usage:
 *   Import and call seedTeamGroups() from the main seed.ts file
 *   Or run directly: npx tsx prisma/seeds/team-groups.seed.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Seed TeamGroups from department field in Employee table.
 *
 * - Extracts unique departments from existing employees
 * - Creates a TeamGroup for each department
 * - Adds each employee to their department's TeamGroup with USER role
 * - Skips employees who are already members of their department's TeamGroup
 *
 * @param systemUserId - Optional user ID to set as createdBy/updatedBy (for audit trail)
 */
export async function seedTeamGroups(systemUserId?: string): Promise<void> {
  console.log('Seeding TeamGroups from departments...');

  // Get all employees with their departments
  const employees = await prisma.employee.findMany({
    where: {
      isActive: true,
    },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      department: true,
    },
  });

  if (employees.length === 0) {
    console.log('No employees found, skipping TeamGroup seeding');
    return;
  }

  // Extract unique departments
  const departments = [...new Set(employees.map((e) => e.department).filter(Boolean))];

  if (departments.length === 0) {
    console.log('No departments found, skipping TeamGroup seeding');
    return;
  }

  console.log(`Found ${departments.length} unique departments: ${departments.join(', ')}`);

  // Track statistics
  let teamGroupsCreated = 0;
  let teamGroupsSkipped = 0;
  let membershipsCreated = 0;
  let membershipsSkipped = 0;

  // Process each department
  for (const department of departments) {
    // Check if TeamGroup already exists for this department
    let teamGroup = await prisma.teamGroup.findFirst({
      where: {
        name: department,
      },
    });

    if (teamGroup) {
      console.log(`  TeamGroup "${department}" already exists (id: ${teamGroup.id})`);
      teamGroupsSkipped++;
    } else {
      // Create TeamGroup for this department
      teamGroup = await prisma.teamGroup.create({
        data: {
          name: department,
          description: `Team for ${department} department`,
          isActive: true,
          createdBy: systemUserId ?? null,
          updatedBy: systemUserId ?? null,
        },
      });
      console.log(`  Created TeamGroup "${department}" (id: ${teamGroup.id})`);
      teamGroupsCreated++;
    }

    // Add employees from this department to the TeamGroup
    const departmentEmployees = employees.filter((e) => e.department === department);

    for (const employee of departmentEmployees) {
      // Check if membership already exists
      const existingMembership = await prisma.teamMembership.findUnique({
        where: {
          employeeId_teamGroupId: {
            employeeId: employee.id,
            teamGroupId: teamGroup.id,
          },
        },
      });

      if (existingMembership) {
        membershipsSkipped++;
      } else {
        // Create membership with USER role
        await prisma.teamMembership.create({
          data: {
            employeeId: employee.id,
            teamGroupId: teamGroup.id,
            role: 'USER',
            createdBy: systemUserId ?? null,
            updatedBy: systemUserId ?? null,
          },
        });
        console.log(`    Added ${employee.firstName} ${employee.lastName} to "${department}"`);
        membershipsCreated++;
      }
    }
  }

  console.log('');
  console.log('TeamGroups seed completed:');
  console.log(`  TeamGroups created: ${teamGroupsCreated}`);
  console.log(`  TeamGroups skipped (already exist): ${teamGroupsSkipped}`);
  console.log(`  Memberships created: ${membershipsCreated}`);
  console.log(`  Memberships skipped (already exist): ${membershipsSkipped}`);
}

/**
 * Optional: Promote first employee in each TeamGroup to OWNER role.
 * Call this after seedTeamGroups() if you want team owners.
 *
 * @param systemUserId - Optional user ID to set as updatedBy (for audit trail)
 */
export async function promoteTeamOwners(systemUserId?: string): Promise<void> {
  console.log('Promoting first members to OWNER role...');

  const teamGroups = await prisma.teamGroup.findMany({
    where: { isActive: true },
    include: {
      memberships: {
        orderBy: { createdAt: 'asc' },
        take: 1,
        include: {
          employee: {
            select: { firstName: true, lastName: true },
          },
        },
      },
    },
  });

  let promoted = 0;
  for (const teamGroup of teamGroups) {
    const firstMembership = teamGroup.memberships[0];
    if (firstMembership && firstMembership.role !== 'OWNER') {
      await prisma.teamMembership.update({
        where: { id: firstMembership.id },
        data: {
          role: 'OWNER',
          updatedBy: systemUserId ?? null,
        },
      });
      console.log(
        `  Promoted ${firstMembership.employee.firstName} ${firstMembership.employee.lastName} to OWNER in "${teamGroup.name}"`
      );
      promoted++;
    }
  }

  console.log(`Promoted ${promoted} members to OWNER role`);
}

// Allow running directly
if (require.main === module) {
  seedTeamGroups()
    .then(() => promoteTeamOwners())
    .catch((e) => {
      console.error('Error seeding TeamGroups:', e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
