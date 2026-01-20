/**
 * Tests for Effective Modules API
 *
 * Task Group 4.1: Write focused tests for effective modules logic
 */

import request from 'supertest';
import app from '@/app';
import { prismaTest, disconnect } from './utils/prismaTestClient';
import { resetTestDb } from './utils/testDb';

describe('Effective Modules API', () => {
  let userId: string;
  let teamGroup1Id: string;
  let teamGroup2Id: string;

  beforeAll(async () => {
    await resetTestDb();

    // Create test user
    const user = await prismaTest.employee.create({
      data: {
        email: 'effective-modules-test@test.com',
        passwordHash: 'hash',
        firstName: 'Test',
        lastName: 'User',
        isAdmin: false,
      },
    });
    userId = user.id;

    // Create two team groups
    const teamGroup1 = await prismaTest.teamGroup.create({
      data: {
        name: 'Team Alpha',
        description: 'First team',
      },
    });
    teamGroup1Id = teamGroup1.id;

    const teamGroup2 = await prismaTest.teamGroup.create({
      data: {
        name: 'Team Beta',
        description: 'Second team',
      },
    });
    teamGroup2Id = teamGroup2.id;

    // Add user to Team Alpha as EDITOR
    await prismaTest.teamMembership.create({
      data: {
        employeeId: userId,
        teamGroupId: teamGroup1Id,
        role: 'EDITOR',
      },
    });

    // Add user to Team Beta as VIEWER
    await prismaTest.teamMembership.create({
      data: {
        employeeId: userId,
        teamGroupId: teamGroup2Id,
        role: 'VIEWER',
      },
    });
  });

  afterAll(async () => {
    await disconnect();
  });

  describe('GET /api/user/effective-modules', () => {
    it('returns all modules for user with single team', async () => {
      // Create a user with single team for this test
      const singleTeamUser = await prismaTest.employee.create({
        data: {
          email: 'single-team-user@test.com',
          passwordHash: 'hash',
          firstName: 'Single',
          lastName: 'Team',
        },
      });

      await prismaTest.teamMembership.create({
        data: {
          employeeId: singleTeamUser.id,
          teamGroupId: teamGroup1Id,
          role: 'VIEWER',
        },
      });

      const res = await request(app)
        .get(`/api/user/effective-modules?userId=${singleTeamUser.id}`)
        .expect(200);

      expect(res.body).toHaveProperty('modules');
      expect(res.body).toHaveProperty('accessibleCount');
      expect(res.body).toHaveProperty('teamMemberships');
      expect(Array.isArray(res.body.modules)).toBe(true);
      expect(res.body.modules.length).toBeGreaterThan(0);

      // Check module structure
      const firstModule = res.body.modules[0];
      expect(firstModule).toHaveProperty('module');
      expect(firstModule).toHaveProperty('isAccessible');
      expect(firstModule).toHaveProperty('effectiveScope');
      expect(firstModule).toHaveProperty('effectiveRole');
      expect(firstModule).toHaveProperty('enabledTeams');
    });

    it('returns union of modules for user with multiple teams', async () => {
      const res = await request(app)
        .get(`/api/user/effective-modules?userId=${userId}`)
        .expect(200);

      // User belongs to both Team Alpha and Team Beta
      expect(res.body.teamMemberships.length).toBeGreaterThanOrEqual(2);

      // Modules should be accessible
      const accessibleModules = res.body.modules.filter((m: any) => m.isAccessible);
      expect(accessibleModules.length).toBeGreaterThan(0);
    });

    it('applies scope precedence (GLOBAL > TEAM)', async () => {
      // Configure strategic-goals with GLOBAL scope in Team Alpha
      await prismaTest.teamModuleConfig.upsert({
        where: {
          teamGroupId_moduleId: {
            teamGroupId: teamGroup1Id,
            moduleId: 'strategic-goals',
          },
        },
        update: {
          isEnabled: true,
          scope: 'GLOBAL',
        },
        create: {
          teamGroupId: teamGroup1Id,
          moduleId: 'strategic-goals',
          isEnabled: true,
          scope: 'GLOBAL',
        },
      });

      // Configure strategic-goals with TEAM scope in Team Beta
      await prismaTest.teamModuleConfig.upsert({
        where: {
          teamGroupId_moduleId: {
            teamGroupId: teamGroup2Id,
            moduleId: 'strategic-goals',
          },
        },
        update: {
          isEnabled: true,
          scope: 'TEAM',
        },
        create: {
          teamGroupId: teamGroup2Id,
          moduleId: 'strategic-goals',
          isEnabled: true,
          scope: 'TEAM',
        },
      });

      const res = await request(app)
        .get(`/api/user/effective-modules?userId=${userId}`)
        .expect(200);

      const strategicGoalsModule = res.body.modules.find(
        (m: any) => m.module.id === 'strategic-goals'
      );

      // GLOBAL should take precedence over TEAM
      expect(strategicGoalsModule.effectiveScope).toBe('GLOBAL');
      expect(strategicGoalsModule.enabledTeams.length).toBe(2);
    });

    it('returns team breakdown for TEAM-scoped modules', async () => {
      const res = await request(app)
        .get(`/api/user/effective-modules?userId=${userId}`)
        .expect(200);

      const strategicGoalsModule = res.body.modules.find(
        (m: any) => m.module.id === 'strategic-goals'
      );

      // Should have team breakdown
      expect(strategicGoalsModule.enabledTeams).toBeDefined();
      expect(Array.isArray(strategicGoalsModule.enabledTeams)).toBe(true);

      // Each team should have name, id, scope, and role
      strategicGoalsModule.enabledTeams.forEach((team: any) => {
        expect(team).toHaveProperty('teamGroupId');
        expect(team).toHaveProperty('teamName');
        expect(team).toHaveProperty('scope');
        expect(team).toHaveProperty('userRole');
      });
    });
  });

  describe('GET /api/user/effective-modules/:moduleId/access', () => {
    it('returns access info for accessible module', async () => {
      const res = await request(app)
        .get(`/api/user/effective-modules/strategic-goals/access?userId=${userId}`)
        .expect(200);

      expect(res.body.moduleId).toBe('strategic-goals');
      expect(res.body.hasAccess).toBe(true);
      expect(res.body.effectiveScope).toBeDefined();
    });

    it('returns no access for disabled module', async () => {
      // Disable skills module for both teams
      await prismaTest.teamModuleConfig.upsert({
        where: {
          teamGroupId_moduleId: {
            teamGroupId: teamGroup1Id,
            moduleId: 'skills',
          },
        },
        update: { isEnabled: false },
        create: {
          teamGroupId: teamGroup1Id,
          moduleId: 'skills',
          isEnabled: false,
        },
      });

      await prismaTest.teamModuleConfig.upsert({
        where: {
          teamGroupId_moduleId: {
            teamGroupId: teamGroup2Id,
            moduleId: 'skills',
          },
        },
        update: { isEnabled: false },
        create: {
          teamGroupId: teamGroup2Id,
          moduleId: 'skills',
          isEnabled: false,
        },
      });

      const res = await request(app)
        .get(`/api/user/effective-modules/skills/access?userId=${userId}`)
        .expect(200);

      expect(res.body.moduleId).toBe('skills');
      expect(res.body.hasAccess).toBe(false);
    });
  });
});
