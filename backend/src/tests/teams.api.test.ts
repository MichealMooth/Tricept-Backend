/**
 * Tests for Teams API (refactored from team-groups)
 *
 * Task Group 1.1: Write 4-6 focused tests for API changes
 *
 * Tests:
 * 1. GET /api/teams returns paginated list with memberCount
 * 2. GET /api/teams/:teamId/members returns paginated member list
 * 3. search parameter filters teams by name
 * 4. includeInactive parameter includes deactivated teams
 * 5. PATCH /api/teams/:teamId with isActive=false for soft-delete
 */

import request from 'supertest';
import app from '@/app';
import { prismaTest, disconnect } from './utils/prismaTestClient';
import { resetTestDb } from './utils/testDb';

describe('Teams API', () => {
  let adminId: string;
  let teamGroupId: string;
  let inactiveTeamId: string;
  let employeeId: string;

  beforeAll(async () => {
    await resetTestDb();

    // Create admin user
    const admin = await prismaTest.employee.create({
      data: {
        email: 'admin-teams@example.com',
        passwordHash: 'hash',
        firstName: 'Admin',
        lastName: 'Manager',
        isAdmin: true,
      },
    });
    adminId = admin.id;

    // Create regular employee for membership tests
    const employee = await prismaTest.employee.create({
      data: {
        email: 'developer@example.com',
        passwordHash: 'hash',
        firstName: 'John',
        lastName: 'Developer',
        isAdmin: false,
      },
    });
    employeeId = employee.id;

    // Create active test team group
    const teamGroup = await prismaTest.teamGroup.create({
      data: {
        name: 'Development Team',
        description: 'Team for development',
        isActive: true,
        createdBy: adminId,
      },
    });
    teamGroupId = teamGroup.id;

    // Create inactive test team group
    const inactiveTeam = await prismaTest.teamGroup.create({
      data: {
        name: 'Legacy Team',
        description: 'Deactivated team',
        isActive: false,
        createdBy: adminId,
      },
    });
    inactiveTeamId = inactiveTeam.id;

    // Add members to active team
    await prismaTest.teamMembership.create({
      data: {
        teamGroupId: teamGroupId,
        employeeId: adminId,
        role: 'OWNER',
        createdBy: adminId,
      },
    });

    await prismaTest.teamMembership.create({
      data: {
        teamGroupId: teamGroupId,
        employeeId: employeeId,
        role: 'EDITOR',
        createdBy: adminId,
      },
    });
  });

  afterAll(async () => {
    await disconnect();
  });

  describe('GET /api/teams', () => {
    it('returns paginated list with memberCount', async () => {
      const res = await request(app).get('/api/teams').expect(200);

      expect(res.body).toHaveProperty('items');
      expect(res.body).toHaveProperty('total');
      expect(res.body).toHaveProperty('page');
      expect(res.body).toHaveProperty('pageSize');
      expect(Array.isArray(res.body.items)).toBe(true);

      // Find the Development Team
      const devTeam = res.body.items.find(
        (t: any) => t.name === 'Development Team'
      );
      expect(devTeam).toBeDefined();
      expect(devTeam).toHaveProperty('memberCount');
      expect(devTeam.memberCount).toBe(2);
    });

    it('filters teams by name with search parameter (case-insensitive)', async () => {
      const res = await request(app)
        .get('/api/teams?search=development')
        .expect(200);

      expect(res.body.items.length).toBeGreaterThanOrEqual(1);
      expect(
        res.body.items.every((t: any) =>
          t.name.toLowerCase().includes('development')
        )
      ).toBe(true);
    });

    it('excludes inactive teams by default', async () => {
      const res = await request(app).get('/api/teams').expect(200);

      const inactiveTeam = res.body.items.find(
        (t: any) => t.name === 'Legacy Team'
      );
      expect(inactiveTeam).toBeUndefined();
    });

    it('includes inactive teams when includeInactive=true', async () => {
      const res = await request(app)
        .get('/api/teams?includeInactive=true')
        .expect(200);

      const inactiveTeam = res.body.items.find(
        (t: any) => t.name === 'Legacy Team'
      );
      expect(inactiveTeam).toBeDefined();
      expect(inactiveTeam.isActive).toBe(false);
    });
  });

  describe('GET /api/teams/:teamId/members', () => {
    it('returns paginated member list with employee details', async () => {
      const res = await request(app)
        .get(`/api/teams/${teamGroupId}/members`)
        .expect(200);

      expect(res.body).toHaveProperty('items');
      expect(res.body).toHaveProperty('total');
      expect(res.body).toHaveProperty('page');
      expect(res.body).toHaveProperty('pageSize');
      expect(Array.isArray(res.body.items)).toBe(true);
      expect(res.body.items.length).toBe(2);

      // Check member structure
      const member = res.body.items[0];
      expect(member).toHaveProperty('id');
      expect(member).toHaveProperty('employeeId');
      expect(member).toHaveProperty('role');
      expect(member).toHaveProperty('employee');
      expect(member.employee).toHaveProperty('id');
      expect(member.employee).toHaveProperty('firstName');
      expect(member.employee).toHaveProperty('lastName');
      expect(member.employee).toHaveProperty('email');
    });

    it('filters members by search parameter', async () => {
      // Search for "John" which only matches the employee, not the admin
      const res = await request(app)
        .get(`/api/teams/${teamGroupId}/members?search=John`)
        .expect(200);

      expect(res.body.items.length).toBe(1);
      expect(res.body.items[0].employee.firstName).toBe('John');
    });

    it('returns 404 for non-existent team', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';
      const res = await request(app)
        .get(`/api/teams/${fakeId}/members`)
        .expect(404);

      expect(res.body.message).toContain('not found');
    });
  });

  describe('PATCH /api/teams/:teamId (soft-delete)', () => {
    let softDeleteTeamId: string;

    beforeAll(async () => {
      // Create a team specifically for soft-delete test
      const team = await prismaTest.teamGroup.create({
        data: {
          name: 'Team To Deactivate',
          description: 'Will be deactivated',
          isActive: true,
          createdBy: adminId,
        },
      });
      softDeleteTeamId = team.id;
    });

    it('deactivates team with isActive=false', async () => {
      const res = await request(app)
        .patch(`/api/teams/${softDeleteTeamId}`)
        .send({ isActive: false })
        .expect(200);

      expect(res.body.isActive).toBe(false);
      expect(res.body.id).toBe(softDeleteTeamId);

      // Verify in database
      const team = await prismaTest.teamGroup.findUnique({
        where: { id: softDeleteTeamId },
      });
      expect(team?.isActive).toBe(false);
    });

    it('can reactivate team with isActive=true', async () => {
      const res = await request(app)
        .patch(`/api/teams/${softDeleteTeamId}`)
        .send({ isActive: true })
        .expect(200);

      expect(res.body.isActive).toBe(true);
    });
  });
});
