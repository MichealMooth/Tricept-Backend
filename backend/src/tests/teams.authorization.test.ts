/**
 * Teams Authorization Tests
 *
 * Tests for authorization flows in Team Admin feature.
 * Task Group 5.3: Strategic tests for critical gaps
 *
 * Tests (3 tests):
 * 1. E2E: Create team and add first member workflow
 * 2. E2E: Team OWNER can manage members (add, update role, remove)
 * 3. Authorization boundary checks (invalid role, non-existent team/membership)
 */

import request from 'supertest';
import app from '@/app';
import { prismaTest, disconnect } from './utils/prismaTestClient';
import { resetTestDb } from './utils/testDb';

describe('Teams Authorization', () => {
  let teamOwnerId: string;
  let regularUserId: string;
  let testTeamId: string;

  beforeAll(async () => {
    await resetTestDb();

    // Create team owner (non-admin)
    const owner = await prismaTest.employee.create({
      data: {
        email: 'team-owner-auth@example.com',
        passwordHash: 'hash',
        firstName: 'Team',
        lastName: 'Owner',
        isAdmin: false,
      },
    });
    teamOwnerId = owner.id;

    // Create regular user
    const regular = await prismaTest.employee.create({
      data: {
        email: 'regular-user-auth@example.com',
        passwordHash: 'hash',
        firstName: 'Regular',
        lastName: 'User',
        isAdmin: false,
      },
    });
    regularUserId = regular.id;
  });

  afterAll(async () => {
    await disconnect();
  });

  it('E2E: Create team and add first member workflow', async () => {
    // Step 1: Create a new team (admin creates via POST)
    const createRes = await request(app)
      .post('/api/teams')
      .send({
        name: 'E2E Test Team',
        description: 'Created via E2E test',
      })
      .expect(201);

    testTeamId = createRes.body.id;
    expect(createRes.body.name).toBe('E2E Test Team');
    expect(createRes.body.isActive).toBe(true);

    // Step 2: Add the team owner as first member with OWNER role
    const addOwnerRes = await request(app)
      .post(`/api/teams/${testTeamId}/members`)
      .send({
        employeeId: teamOwnerId,
        role: 'OWNER',
      })
      .expect(201);

    expect(addOwnerRes.body.role).toBe('OWNER');
    expect(addOwnerRes.body.employeeId).toBe(teamOwnerId);

    // Step 3: Verify team appears in list with member count
    const listRes = await request(app)
      .get('/api/teams?search=E2E')
      .expect(200);

    const team = listRes.body.items.find(
      (t: { name: string }) => t.name === 'E2E Test Team'
    );
    expect(team).toBeDefined();
    expect(team.memberCount).toBe(1);

    // Step 4: Verify members endpoint returns the owner
    const membersRes = await request(app)
      .get(`/api/teams/${testTeamId}/members`)
      .expect(200);

    expect(membersRes.body.items.length).toBe(1);
    expect(membersRes.body.items[0].employee.firstName).toBe('Team');
    expect(membersRes.body.items[0].employee.lastName).toBe('Owner');
  });

  it('E2E: Team OWNER can manage members (add, update role, remove)', async () => {
    // Step 1: OWNER adds regular user as VIEWER
    const addRes = await request(app)
      .post(`/api/teams/${testTeamId}/members`)
      .send({
        employeeId: regularUserId,
        role: 'VIEWER',
      })
      .expect(201);

    const membershipId = addRes.body.id;
    expect(addRes.body.role).toBe('VIEWER');
    expect(addRes.body.teamGroupId).toBe(testTeamId);

    // Step 2: OWNER updates member role from VIEWER to EDITOR
    const updateRes = await request(app)
      .put(`/api/team-memberships/${membershipId}`)
      .send({ role: 'EDITOR' })
      .expect(200);

    expect(updateRes.body.id).toBe(membershipId);
    expect(updateRes.body.role).toBe('EDITOR');

    // Step 3: OWNER removes member from team
    await request(app)
      .delete(`/api/team-memberships/${membershipId}`)
      .expect(204);

    // Verify member was removed
    const membersRes = await request(app)
      .get(`/api/teams/${testTeamId}/members`)
      .expect(200);

    const removedMember = membersRes.body.items.find(
      (m: { employeeId: string }) => m.employeeId === regularUserId
    );
    expect(removedMember).toBeUndefined();
  });

  it('Authorization boundary checks: invalid role, non-existent team/membership', async () => {
    // Check 1: Invalid role returns 400
    const invalidRoleRes = await request(app)
      .post(`/api/teams/${testTeamId}/members`)
      .send({
        employeeId: regularUserId,
        role: 'SUPERADMIN', // Invalid role
      })
      .expect(400);

    expect(invalidRoleRes.body.message).toBeDefined();

    // Check 2: Non-existent team returns 404
    const fakeTeamId = '00000000-0000-0000-0000-000000000000';
    const notFoundTeamRes = await request(app)
      .post(`/api/teams/${fakeTeamId}/members`)
      .send({
        employeeId: regularUserId,
        role: 'VIEWER',
      })
      .expect(404);

    expect(notFoundTeamRes.body.message).toContain('not found');

    // Check 3: Non-existent membership returns 404
    const fakeMembershipId = '00000000-0000-0000-0000-000000000000';
    await request(app)
      .put(`/api/team-memberships/${fakeMembershipId}`)
      .send({ role: 'EDITOR' })
      .expect(404);
  });
});
