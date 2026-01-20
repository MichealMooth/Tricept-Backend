/**
 * Scoped Strategic Goals API Integration Tests
 *
 * Tests for StrategicGoals API with GLOBAL and TEAM scope support.
 * Verifies scope-based filtering and authorization.
 *
 * Task Group 5.1: Write 4-6 focused tests for scoped StrategicGoals API
 */

import request from 'supertest';
import app from '../../app';
import { prismaTest, disconnect } from '../utils/prismaTestClient';

describe('Strategic Goals with Scope Support', () => {
  let testEmployee: { id: string; email: string };
  let testEmployee2: { id: string; email: string };
  let testTeamGroup: { id: string; name: string };
  let globalGoal: { id: string; key: string };
  let teamGoal: { id: string; key: string };

  // Setup test data before all tests
  beforeAll(async () => {
    const unique = `${Date.now()}_${Math.floor(Math.random() * 1e6)}`;

    // Create test employees
    testEmployee = await prismaTest.employee.create({
      data: {
        email: `sg-scope-user1-${unique}@example.com`,
        firstName: 'Scope',
        lastName: 'User1',
        passwordHash: 'x',
        department: 'Testing',
        isAdmin: false,
      },
    });

    testEmployee2 = await prismaTest.employee.create({
      data: {
        email: `sg-scope-user2-${unique}@example.com`,
        firstName: 'Scope',
        lastName: 'User2',
        passwordHash: 'x',
        department: 'Testing',
        isAdmin: false,
      },
    });

    // Create a test team group
    testTeamGroup = await prismaTest.teamGroup.create({
      data: {
        name: `SG Scope Test Team ${unique}`,
        description: 'Team for strategic goals scope testing',
        isActive: true,
      },
    });

    // Add testEmployee to the team as EDITOR
    await prismaTest.teamMembership.create({
      data: {
        employeeId: testEmployee.id,
        teamGroupId: testTeamGroup.id,
        role: 'EDITOR',
      },
    });

    // testEmployee2 is NOT a member of the team

    // Create a GLOBAL scope strategic goal
    globalGoal = await prismaTest.strategicGoal.create({
      data: {
        key: `SG-GLOBAL-${unique}`,
        title: 'Global Test Goal',
        description: 'A global goal visible to all',
        displayOrder: 1,
        isActive: true,
        scope: 'GLOBAL',
        teamGroupId: null,
      },
    });

    // Create a TEAM scope strategic goal
    teamGoal = await prismaTest.strategicGoal.create({
      data: {
        key: `SG-TEAM-${unique}`,
        title: 'Team Test Goal',
        description: 'A team goal visible only to team members',
        displayOrder: 2,
        isActive: true,
        scope: 'TEAM',
        teamGroupId: testTeamGroup.id,
      },
    });
  });

  // Clean up after all tests
  afterAll(async () => {
    // Delete test data in correct order
    await prismaTest.strategicGoalRating.deleteMany({
      where: {
        OR: [{ goalId: globalGoal.id }, { goalId: teamGoal.id }],
      },
    });
    await prismaTest.strategicGoal.deleteMany({
      where: {
        OR: [{ id: globalGoal.id }, { id: teamGoal.id }],
      },
    });
    await prismaTest.teamMembership.deleteMany({
      where: {
        OR: [{ employeeId: testEmployee.id }, { employeeId: testEmployee2.id }],
      },
    });
    await prismaTest.teamGroup.delete({ where: { id: testTeamGroup.id } });
    await prismaTest.employee.delete({ where: { id: testEmployee.id } });
    await prismaTest.employee.delete({ where: { id: testEmployee2.id } });
    await disconnect();
  });

  /**
   * Test 1: GET /api/strategic-goals returns GLOBAL goals
   * All authenticated users should see GLOBAL scope goals.
   */
  describe('GET /api/strategic-goals', () => {
    it('should return GLOBAL scope goals for all authenticated users', async () => {
      const response = await request(app)
        .get('/api/strategic-goals')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);

      // Find the global goal we created
      const foundGlobal = response.body.find(
        (g: { id: string }) => g.id === globalGoal.id
      );
      expect(foundGlobal).toBeDefined();
      expect(foundGlobal.scope).toBe('GLOBAL');
    });
  });

  /**
   * Test 2: GET /api/strategic-goals/with-my-ratings returns scoped goals
   * Should return GLOBAL + user's TEAM goals when userId is provided.
   */
  describe('GET /api/strategic-goals/with-my-ratings', () => {
    it('should return GLOBAL goals and user TEAM goals for team member', async () => {
      const response = await request(app)
        .get('/api/strategic-goals/with-my-ratings')
        .query({ userId: testEmployee.id })
        .expect(200);

      expect(response.body.items).toBeDefined();
      expect(Array.isArray(response.body.items)).toBe(true);

      // User is a team member, so should see both global and team goals
      const goalIds = response.body.items.map((item: { goal: { id: string } }) => item.goal.id);
      expect(goalIds).toContain(globalGoal.id);
      expect(goalIds).toContain(teamGoal.id);
    });

    it('should return only GLOBAL goals for non-team-member', async () => {
      const response = await request(app)
        .get('/api/strategic-goals/with-my-ratings')
        .query({ userId: testEmployee2.id })
        .expect(200);

      expect(response.body.items).toBeDefined();
      expect(Array.isArray(response.body.items)).toBe(true);

      // User is NOT a team member, so should only see global goals
      const goalIds = response.body.items.map((item: { goal: { id: string } }) => item.goal.id);
      expect(goalIds).toContain(globalGoal.id);
      expect(goalIds).not.toContain(teamGoal.id);
    });
  });

  /**
   * Test 3: POST /api/strategic-goals with scope=TEAM requires teamGroupId
   */
  describe('POST /api/strategic-goals', () => {
    it('should require teamGroupId when scope is TEAM', async () => {
      const unique = `${Date.now()}_${Math.floor(Math.random() * 1e6)}`;

      const response = await request(app)
        .post('/api/strategic-goals')
        .send({
          key: `SG-TEAM-NOID-${unique}`,
          title: 'Team Goal Without TeamGroupId',
          scope: 'TEAM',
          // Missing teamGroupId
        })
        .expect(400);

      expect(response.body.message).toBeDefined();
    });

    it('should create TEAM scope goal with valid teamGroupId', async () => {
      const unique = `${Date.now()}_${Math.floor(Math.random() * 1e6)}`;

      const response = await request(app)
        .post('/api/strategic-goals')
        .send({
          key: `SG-TEAM-VALID-${unique}`,
          title: 'Team Goal With TeamGroupId',
          scope: 'TEAM',
          teamGroupId: testTeamGroup.id,
        })
        .expect(201);

      expect(response.body.id).toBeDefined();
      expect(response.body.scope).toBe('TEAM');
      expect(response.body.teamGroupId).toBe(testTeamGroup.id);

      // Clean up created goal
      await prismaTest.strategicGoal.delete({ where: { id: response.body.id } });
    });

    it('should create GLOBAL scope goal without teamGroupId', async () => {
      const unique = `${Date.now()}_${Math.floor(Math.random() * 1e6)}`;

      const response = await request(app)
        .post('/api/strategic-goals')
        .send({
          key: `SG-GLOBAL-NEW-${unique}`,
          title: 'New Global Goal',
          scope: 'GLOBAL',
        })
        .expect(201);

      expect(response.body.id).toBeDefined();
      expect(response.body.scope).toBe('GLOBAL');
      expect(response.body.teamGroupId).toBeNull();

      // Clean up created goal
      await prismaTest.strategicGoal.delete({ where: { id: response.body.id } });
    });
  });

  /**
   * Test 4: StrategicGoalRatings remain user-scoped (owner-only)
   */
  describe('POST /api/strategic-goals/rate', () => {
    it('should allow user to rate a goal they have access to', async () => {
      const now = new Date();
      const year = now.getFullYear();
      const month = now.getMonth() + 1;

      const response = await request(app)
        .post('/api/strategic-goals/rate')
        .send({
          userId: testEmployee.id,
          goalId: globalGoal.id,
          rating: 4,
          comment: 'Good progress',
          year,
          month,
        })
        .expect(200);

      expect(response.body.userId).toBe(testEmployee.id);
      expect(response.body.goalId).toBe(globalGoal.id);
      expect(response.body.rating).toBe(4);

      // Clean up rating
      await prismaTest.strategicGoalRating.delete({
        where: { id: response.body.id },
      });
    });

    it('should allow team member to rate team-scoped goal', async () => {
      const now = new Date();
      const year = now.getFullYear();
      const month = now.getMonth() + 1;

      const response = await request(app)
        .post('/api/strategic-goals/rate')
        .send({
          userId: testEmployee.id,
          goalId: teamGoal.id,
          rating: 3,
          comment: 'In progress',
          year,
          month,
        })
        .expect(200);

      expect(response.body.userId).toBe(testEmployee.id);
      expect(response.body.goalId).toBe(teamGoal.id);
      expect(response.body.rating).toBe(3);

      // Clean up rating
      await prismaTest.strategicGoalRating.delete({
        where: { id: response.body.id },
      });
    });
  });
});
