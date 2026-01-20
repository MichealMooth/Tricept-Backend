import { prismaTest, disconnect } from '../utils/prismaTestClient';

// TeamRole type definition (validated at application layer)
// SQLite does not support native enums, so we use String type
type TeamRole = 'OWNER' | 'ADMIN' | 'EDITOR' | 'VIEWER' | 'USER';

describe('TeamGroup and TeamMembership Models', () => {
  // Clean up after all tests
  afterAll(async () => {
    await disconnect();
  });

  // Clean up test data before each test
  beforeEach(async () => {
    // Delete in correct order due to foreign key constraints
    await prismaTest.teamMembership.deleteMany({});
    await prismaTest.teamGroup.deleteMany({});
  });

  /**
   * Test 1: TeamGroup creation with all required fields
   */
  it('should create a TeamGroup with all required fields', async () => {
    const unique = `${Date.now()}_${Math.floor(Math.random() * 1e6)}`;

    const teamGroup = await prismaTest.teamGroup.create({
      data: {
        name: `Test Team ${unique}`,
        description: 'A test team for unit testing',
        isActive: true,
        createdBy: 'test-user-id',
        updatedBy: 'test-user-id',
      },
    });

    expect(teamGroup.id).toBeDefined();
    expect(teamGroup.name).toBe(`Test Team ${unique}`);
    expect(teamGroup.description).toBe('A test team for unit testing');
    expect(teamGroup.isActive).toBe(true);
    expect(teamGroup.createdBy).toBe('test-user-id');
    expect(teamGroup.updatedBy).toBe('test-user-id');
    expect(teamGroup.createdAt).toBeInstanceOf(Date);
    expect(teamGroup.updatedAt).toBeInstanceOf(Date);
  });

  /**
   * Test 2: TeamMembership role assignment (all 5 roles)
   */
  it('should create TeamMembership with all TeamRole values', async () => {
    const unique = `${Date.now()}_${Math.floor(Math.random() * 1e6)}`;

    // Create employee for membership
    const employee = await prismaTest.employee.create({
      data: {
        email: `team-test-${unique}@example.com`,
        firstName: 'Test',
        lastName: 'User',
        passwordHash: 'x',
        department: 'Testing',
        isAdmin: false,
      },
    });

    // Create team group
    const teamGroup = await prismaTest.teamGroup.create({
      data: {
        name: `Role Test Team ${unique}`,
        isActive: true,
      },
    });

    // Test each role value
    const roles: TeamRole[] = ['OWNER', 'ADMIN', 'EDITOR', 'VIEWER', 'USER'];

    for (const role of roles) {
      // Clean up any existing membership first
      await prismaTest.teamMembership.deleteMany({
        where: {
          employeeId: employee.id,
          teamGroupId: teamGroup.id,
        },
      });

      const membership = await prismaTest.teamMembership.create({
        data: {
          employeeId: employee.id,
          teamGroupId: teamGroup.id,
          role: role,
          createdBy: 'test-admin',
          updatedBy: 'test-admin',
        },
      });

      expect(membership.role).toBe(role);
    }

    // Clean up employee
    await prismaTest.teamMembership.deleteMany({
      where: { employeeId: employee.id },
    });
    await prismaTest.employee.delete({ where: { id: employee.id } });
  });

  /**
   * Test 3: User can belong to multiple TeamGroups with different roles
   */
  it('should allow user to belong to multiple TeamGroups with different roles', async () => {
    const unique = `${Date.now()}_${Math.floor(Math.random() * 1e6)}`;

    // Create employee
    const employee = await prismaTest.employee.create({
      data: {
        email: `multi-team-${unique}@example.com`,
        firstName: 'Multi',
        lastName: 'Team',
        passwordHash: 'x',
        department: 'Testing',
        isAdmin: false,
      },
    });

    // Create multiple team groups
    const teamGroup1 = await prismaTest.teamGroup.create({
      data: { name: `Team Alpha ${unique}`, isActive: true },
    });

    const teamGroup2 = await prismaTest.teamGroup.create({
      data: { name: `Team Beta ${unique}`, isActive: true },
    });

    const teamGroup3 = await prismaTest.teamGroup.create({
      data: { name: `Team Gamma ${unique}`, isActive: true },
    });

    // Create memberships with different roles
    const membership1 = await prismaTest.teamMembership.create({
      data: {
        employeeId: employee.id,
        teamGroupId: teamGroup1.id,
        role: 'OWNER',
      },
    });

    const membership2 = await prismaTest.teamMembership.create({
      data: {
        employeeId: employee.id,
        teamGroupId: teamGroup2.id,
        role: 'EDITOR',
      },
    });

    const membership3 = await prismaTest.teamMembership.create({
      data: {
        employeeId: employee.id,
        teamGroupId: teamGroup3.id,
        role: 'VIEWER',
      },
    });

    // Verify all memberships exist
    const memberships = await prismaTest.teamMembership.findMany({
      where: { employeeId: employee.id },
      include: { teamGroup: true },
    });

    expect(memberships).toHaveLength(3);
    expect(memberships.map((m) => m.role).sort()).toEqual(['EDITOR', 'OWNER', 'VIEWER']);

    // Clean up
    await prismaTest.teamMembership.deleteMany({ where: { employeeId: employee.id } });
    await prismaTest.employee.delete({ where: { id: employee.id } });
  });

  /**
   * Test 4: Cascade delete behavior - memberships deleted when TeamGroup deleted
   */
  it('should cascade delete memberships when TeamGroup is deleted', async () => {
    const unique = `${Date.now()}_${Math.floor(Math.random() * 1e6)}`;

    // Create employees
    const employee1 = await prismaTest.employee.create({
      data: {
        email: `cascade-1-${unique}@example.com`,
        firstName: 'Cascade',
        lastName: 'One',
        passwordHash: 'x',
        department: 'Testing',
        isAdmin: false,
      },
    });

    const employee2 = await prismaTest.employee.create({
      data: {
        email: `cascade-2-${unique}@example.com`,
        firstName: 'Cascade',
        lastName: 'Two',
        passwordHash: 'x',
        department: 'Testing',
        isAdmin: false,
      },
    });

    // Create team group
    const teamGroup = await prismaTest.teamGroup.create({
      data: { name: `Cascade Test Team ${unique}`, isActive: true },
    });

    // Create memberships
    await prismaTest.teamMembership.create({
      data: {
        employeeId: employee1.id,
        teamGroupId: teamGroup.id,
        role: 'OWNER',
      },
    });

    await prismaTest.teamMembership.create({
      data: {
        employeeId: employee2.id,
        teamGroupId: teamGroup.id,
        role: 'VIEWER',
      },
    });

    // Verify memberships exist
    const membershipsBefore = await prismaTest.teamMembership.findMany({
      where: { teamGroupId: teamGroup.id },
    });
    expect(membershipsBefore).toHaveLength(2);

    // Delete the team group
    await prismaTest.teamGroup.delete({
      where: { id: teamGroup.id },
    });

    // Verify memberships are cascade deleted
    const membershipsAfter = await prismaTest.teamMembership.findMany({
      where: { teamGroupId: teamGroup.id },
    });
    expect(membershipsAfter).toHaveLength(0);

    // Clean up employees
    await prismaTest.employee.delete({ where: { id: employee1.id } });
    await prismaTest.employee.delete({ where: { id: employee2.id } });
  });

  /**
   * Test 5: Composite unique constraint prevents duplicate memberships
   */
  it('should enforce unique constraint on employeeId + teamGroupId', async () => {
    const unique = `${Date.now()}_${Math.floor(Math.random() * 1e6)}`;

    // Create employee
    const employee = await prismaTest.employee.create({
      data: {
        email: `unique-test-${unique}@example.com`,
        firstName: 'Unique',
        lastName: 'Test',
        passwordHash: 'x',
        department: 'Testing',
        isAdmin: false,
      },
    });

    // Create team group
    const teamGroup = await prismaTest.teamGroup.create({
      data: { name: `Unique Test Team ${unique}`, isActive: true },
    });

    // Create first membership
    await prismaTest.teamMembership.create({
      data: {
        employeeId: employee.id,
        teamGroupId: teamGroup.id,
        role: 'EDITOR',
      },
    });

    // Attempt to create duplicate membership - should fail
    await expect(
      prismaTest.teamMembership.create({
        data: {
          employeeId: employee.id,
          teamGroupId: teamGroup.id,
          role: 'VIEWER', // Different role, same employee and team
        },
      })
    ).rejects.toThrow();

    // Clean up
    await prismaTest.teamMembership.deleteMany({ where: { employeeId: employee.id } });
    await prismaTest.teamGroup.delete({ where: { id: teamGroup.id } });
    await prismaTest.employee.delete({ where: { id: employee.id } });
  });
});
