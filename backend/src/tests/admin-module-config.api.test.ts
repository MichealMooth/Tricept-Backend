/**
 * Tests for Admin Module Configuration API
 *
 * Task Group 3.1: Write focused tests for Admin API endpoints
 */

import request from 'supertest';
import app from '@/app';
import { prismaTest, disconnect } from './utils/prismaTestClient';
import { resetTestDb } from './utils/testDb';

describe('Admin Module Configuration API', () => {
  let adminId: string;
  let teamGroupId: string;

  beforeAll(async () => {
    await resetTestDb();

    // Create admin user
    const admin = await prismaTest.employee.create({
      data: {
        email: 'admin-moduleconfig@test.com',
        passwordHash: 'hash',
        firstName: 'Admin',
        lastName: 'User',
        isAdmin: true,
      },
    });
    adminId = admin.id;

    // Create test team group
    const teamGroup = await prismaTest.teamGroup.create({
      data: {
        name: 'API Test Team',
        description: 'Team for API tests',
        createdBy: adminId,
      },
    });
    teamGroupId = teamGroup.id;
  });

  afterAll(async () => {
    await disconnect();
  });

  describe('GET /api/admin/modules', () => {
    it('returns all modules with team configs', async () => {
      const res = await request(app)
        .get('/api/admin/modules')
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThan(0);

      // Check structure of first module
      const firstModule = res.body[0];
      expect(firstModule).toHaveProperty('module');
      expect(firstModule).toHaveProperty('teamConfigs');
      expect(firstModule).toHaveProperty('enabledTeamCount');
      expect(firstModule).toHaveProperty('totalTeamCount');
      expect(firstModule.module).toHaveProperty('id');
      expect(firstModule.module).toHaveProperty('name');
      expect(firstModule.module).toHaveProperty('allowedScopes');
      expect(firstModule.module).toHaveProperty('defaultScope');
    });
  });

  describe('GET /api/admin/modules/:moduleId', () => {
    it('returns module with all team configs', async () => {
      const res = await request(app)
        .get('/api/admin/modules/strategic-goals')
        .expect(200);

      expect(res.body).toHaveProperty('module');
      expect(res.body.module.id).toBe('strategic-goals');
      expect(res.body).toHaveProperty('teamConfigs');
      expect(Array.isArray(res.body.teamConfigs)).toBe(true);
    });

    it('returns 404 for invalid module ID', async () => {
      const res = await request(app)
        .get('/api/admin/modules/invalid-module')
        .expect(404);

      expect(res.body.message).toContain('not found');
    });
  });

  describe('GET /api/admin/team-module-config/:teamId', () => {
    it('returns team with all module configs', async () => {
      const res = await request(app)
        .get(`/api/admin/team-module-config/${teamGroupId}`)
        .expect(200);

      expect(res.body).toHaveProperty('teamGroupId', teamGroupId);
      expect(res.body).toHaveProperty('teamName', 'API Test Team');
      expect(res.body).toHaveProperty('configs');
      expect(Array.isArray(res.body.configs)).toBe(true);

      // Check structure of configs
      const config = res.body.configs[0];
      expect(config).toHaveProperty('moduleId');
      expect(config).toHaveProperty('moduleName');
      expect(config).toHaveProperty('isEnabled');
      expect(config).toHaveProperty('effectiveScope');
    });

    it('returns 404 for non-existent team', async () => {
      const res = await request(app)
        .get('/api/admin/team-module-config/non-existent-uuid')
        .expect(404);

      expect(res.body.message).toContain('not found');
    });
  });

  describe('PUT /api/admin/team-module-config', () => {
    it('creates/updates config with audit trail', async () => {
      const res = await request(app)
        .put('/api/admin/team-module-config')
        .send({
          teamGroupId,
          moduleId: 'strategic-goals',
          isEnabled: false,
          scope: 'TEAM',
        })
        .expect(200);

      expect(res.body).toHaveProperty('id');
      expect(res.body.teamGroupId).toBe(teamGroupId);
      expect(res.body.moduleId).toBe('strategic-goals');
      expect(res.body.isEnabled).toBe(false);
      expect(res.body.scope).toBe('TEAM');

      // Verify audit entry was created
      const auditEntries = await prismaTest.moduleConfigAudit.findMany({
        where: {
          teamGroupId,
          moduleId: 'strategic-goals',
        },
        orderBy: { performedAt: 'desc' },
      });

      expect(auditEntries.length).toBeGreaterThan(0);
      expect(auditEntries[0].action).toBe('CREATE');
    });

    it('validates scope against module allowedScopes', async () => {
      const res = await request(app)
        .put('/api/admin/team-module-config')
        .send({
          teamGroupId,
          moduleId: 'kurzprofil', // Only allows USER scope
          isEnabled: true,
          scope: 'GLOBAL', // Invalid for kurzprofil
        })
        .expect(400);

      expect(res.body.message).toContain('not allowed');
    });

    it('validates module ID against registry', async () => {
      const res = await request(app)
        .put('/api/admin/team-module-config')
        .send({
          teamGroupId,
          moduleId: 'invalid-module',
          isEnabled: true,
        })
        .expect(400);

      expect(res.body.message).toContain('Invalid module ID');
    });
  });

  describe('GET /api/admin/module-config-audit', () => {
    it('returns paginated audit entries', async () => {
      const res = await request(app)
        .get('/api/admin/module-config-audit')
        .expect(200);

      expect(res.body).toHaveProperty('items');
      expect(res.body).toHaveProperty('total');
      expect(res.body).toHaveProperty('page');
      expect(res.body).toHaveProperty('pageSize');
      expect(Array.isArray(res.body.items)).toBe(true);
    });

    it('filters audit entries by teamGroupId', async () => {
      const res = await request(app)
        .get(`/api/admin/module-config-audit?teamGroupId=${teamGroupId}`)
        .expect(200);

      expect(res.body.items.length).toBeGreaterThan(0);
      res.body.items.forEach((entry: any) => {
        expect(entry.teamGroupId).toBe(teamGroupId);
      });
    });
  });
});
