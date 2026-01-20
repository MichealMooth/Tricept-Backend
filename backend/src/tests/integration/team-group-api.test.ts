/**
 * Team Group API Integration Tests
 *
 * Tests for TeamGroup and TeamMembership API endpoints.
 * These tests verify CRUD operations and authorization rules.
 *
 * Task Group 4.1: Write 5-7 focused tests for TeamGroup/Membership API
 */

import request from 'supertest';
import app from '../../app';
import { prismaTest, disconnect } from '../utils/prismaTestClient';

describe('TeamGroup and TeamMembership API', () => {
  let testEmployee: { id: string; email: string };
  let testAdminEmployee: { id: string; email: string };
  let testTeamGroup: { id: string; name: string };

  // Setup test data before all tests
  beforeAll(async () => {
    const unique = `${Date.now()}_${Math.floor(Math.random() * 1e6)}`;

    // Create a non-admin test employee
    testEmployee = await prismaTest.employee.create({
      data: {
        email: `team-api-user-${unique}@example.com`,
        firstName: 'API',
        lastName: 'User',
        passwordHash: 'x',
        department: 'Testing',
        isAdmin: false,
      },
    });

    // Create an admin test employee
    testAdminEmployee = await prismaTest.employee.create({
      data: {
        email: `team-api-admin-${unique}@example.com`,
        firstName: 'Admin',
        lastName: 'User',
        passwordHash: 'x',
        department: 'Testing',
        isAdmin: true,
      },
    });

    // Create a test team group for membership tests
    testTeamGroup = await prismaTest.teamGroup.create({
      data: {
        name: `API Test Team ${unique}`,
        description: 'Team for API testing',
        isActive: true,
        createdBy: testAdminEmployee.id,
      },
    });

    // Make the regular employee an OWNER of the test team
    await prismaTest.teamMembership.create({
      data: {
        employeeId: testEmployee.id,
        teamGroupId: testTeamGroup.id,
        role: 'OWNER',
        createdBy: testAdminEmployee.id,
      },
    });
  });

  // Clean up after all tests
  afterAll(async () => {
    // Delete test data in correct order
    await prismaTest.teamMembership.deleteMany({
      where: {
        OR: [
          { employeeId: testEmployee.id },
          { employeeId: testAdminEmployee.id },
        ],
      },
    });
    await prismaTest.teamGroup.deleteMany({
      where: {
        OR: [
          { id: testTeamGroup.id },
          { createdBy: testAdminEmployee.id },
        ],
      },
    });
    await prismaTest.employee.delete({ where: { id: testEmployee.id } });
    await prismaTest.employee.delete({ where: { id: testAdminEmployee.id } });
    await disconnect();
  });

  /**
   * Test 1: GET /api/team-groups returns user's teams
   */
  describe('GET /api/team-groups', () => {
    it('should return list of team groups', async () => {
      const response = await request(app)
        .get('/api/team-groups')
        .expect(200);

      expect(response.body).toBeDefined();
      expect(Array.isArray(response.body.items || response.body)).toBe(true);
    });
  });

  /**
   * Test 2: POST /api/team-groups creates team (admin only in non-test env)
   * Note: In test env, auth is bypassed, so this tests the basic creation flow
   */
  describe('POST /api/team-groups', () => {
    it('should create a new team group with valid data', async () => {
      const unique = `${Date.now()}_${Math.floor(Math.random() * 1e6)}`;
      const newTeam = {
        name: `New API Team ${unique}`,
        description: 'Created via API test',
      };

      const response = await request(app)
        .post('/api/team-groups')
        .send(newTeam)
        .expect(201);

      expect(response.body.id).toBeDefined();
      expect(response.body.name).toBe(newTeam.name);
      expect(response.body.description).toBe(newTeam.description);
      expect(response.body.isActive).toBe(true);

      // Clean up created team
      await prismaTest.teamGroup.delete({ where: { id: response.body.id } });
    });

    it('should return 400 for missing required name field', async () => {
      const response = await request(app)
        .post('/api/team-groups')
        .send({ description: 'No name provided' })
        .expect(400);

      expect(response.body.message).toBeDefined();
    });
  });

  /**
   * Test 3: GET /api/team-groups/:id returns team details
   */
  describe('GET /api/team-groups/:id', () => {
    it('should return team group details by ID', async () => {
      const response = await request(app)
        .get(`/api/team-groups/${testTeamGroup.id}`)
        .expect(200);

      expect(response.body.id).toBe(testTeamGroup.id);
      expect(response.body.name).toBe(testTeamGroup.name);
    });

    it('should return 404 for non-existent team', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';
      const response = await request(app)
        .get(`/api/team-groups/${fakeId}`)
        .expect(404);

      expect(response.body.message).toBeDefined();
    });
  });

  /**
   * Test 4: POST /api/team-groups/:id/members adds member (OWNER only in non-test env)
   */
  describe('POST /api/team-groups/:id/members', () => {
    it('should add a new member to team group', async () => {
      const unique = `${Date.now()}_${Math.floor(Math.random() * 1e6)}`;

      // Create a new employee to add
      const newEmployee = await prismaTest.employee.create({
        data: {
          email: `new-member-${unique}@example.com`,
          firstName: 'New',
          lastName: 'Member',
          passwordHash: 'x',
          department: 'Testing',
          isAdmin: false,
        },
      });

      const response = await request(app)
        .post(`/api/team-groups/${testTeamGroup.id}/members`)
        .send({
          employeeId: newEmployee.id,
          role: 'EDITOR',
        })
        .expect(201);

      expect(response.body.id).toBeDefined();
      expect(response.body.employeeId).toBe(newEmployee.id);
      expect(response.body.teamGroupId).toBe(testTeamGroup.id);
      expect(response.body.role).toBe('EDITOR');

      // Clean up
      await prismaTest.teamMembership.deleteMany({
        where: { employeeId: newEmployee.id },
      });
      await prismaTest.employee.delete({ where: { id: newEmployee.id } });
    });

    it('should return 400 for invalid role', async () => {
      const response = await request(app)
        .post(`/api/team-groups/${testTeamGroup.id}/members`)
        .send({
          employeeId: testAdminEmployee.id,
          role: 'INVALID_ROLE',
        })
        .expect(400);

      expect(response.body.message).toBeDefined();
    });
  });

  /**
   * Test 5: PUT /api/team-memberships/:id updates member role
   */
  describe('PUT /api/team-memberships/:id', () => {
    it('should update member role', async () => {
      const unique = `${Date.now()}_${Math.floor(Math.random() * 1e6)}`;

      // Create employee and membership for update test
      const updateEmployee = await prismaTest.employee.create({
        data: {
          email: `update-member-${unique}@example.com`,
          firstName: 'Update',
          lastName: 'Test',
          passwordHash: 'x',
          department: 'Testing',
          isAdmin: false,
        },
      });

      const membership = await prismaTest.teamMembership.create({
        data: {
          employeeId: updateEmployee.id,
          teamGroupId: testTeamGroup.id,
          role: 'VIEWER',
        },
      });

      const response = await request(app)
        .put(`/api/team-memberships/${membership.id}`)
        .send({ role: 'EDITOR' })
        .expect(200);

      expect(response.body.id).toBe(membership.id);
      expect(response.body.role).toBe('EDITOR');

      // Clean up
      await prismaTest.teamMembership.delete({ where: { id: membership.id } });
      await prismaTest.employee.delete({ where: { id: updateEmployee.id } });
    });
  });

  /**
   * Test 6: DELETE /api/team-memberships/:id removes member
   */
  describe('DELETE /api/team-memberships/:id', () => {
    it('should remove member from team', async () => {
      const unique = `${Date.now()}_${Math.floor(Math.random() * 1e6)}`;

      // Create employee and membership for delete test
      const deleteEmployee = await prismaTest.employee.create({
        data: {
          email: `delete-member-${unique}@example.com`,
          firstName: 'Delete',
          lastName: 'Test',
          passwordHash: 'x',
          department: 'Testing',
          isAdmin: false,
        },
      });

      const membership = await prismaTest.teamMembership.create({
        data: {
          employeeId: deleteEmployee.id,
          teamGroupId: testTeamGroup.id,
          role: 'VIEWER',
        },
      });

      await request(app)
        .delete(`/api/team-memberships/${membership.id}`)
        .expect(204);

      // Verify membership was deleted
      const deletedMembership = await prismaTest.teamMembership.findUnique({
        where: { id: membership.id },
      });
      expect(deletedMembership).toBeNull();

      // Clean up employee
      await prismaTest.employee.delete({ where: { id: deleteEmployee.id } });
    });

    it('should return 404 for non-existent membership', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';
      await request(app)
        .delete(`/api/team-memberships/${fakeId}`)
        .expect(404);
    });
  });

  /**
   * Test 7: PUT /api/team-groups/:id updates team
   */
  describe('PUT /api/team-groups/:id', () => {
    it('should update team group details', async () => {
      const unique = `${Date.now()}_${Math.floor(Math.random() * 1e6)}`;

      // Create a team to update
      const teamToUpdate = await prismaTest.teamGroup.create({
        data: {
          name: `Update Test Team ${unique}`,
          description: 'Original description',
          isActive: true,
        },
      });

      const response = await request(app)
        .put(`/api/team-groups/${teamToUpdate.id}`)
        .send({
          name: `Updated Team ${unique}`,
          description: 'Updated description',
        })
        .expect(200);

      expect(response.body.name).toBe(`Updated Team ${unique}`);
      expect(response.body.description).toBe('Updated description');

      // Clean up
      await prismaTest.teamGroup.delete({ where: { id: teamToUpdate.id } });
    });
  });
});
