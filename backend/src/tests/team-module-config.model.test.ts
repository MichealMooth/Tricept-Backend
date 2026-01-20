/**
 * Tests for TeamModuleConfig and ModuleConfigAudit Data Models
 *
 * Task Group 2.1: Write focused tests for data models
 */

import { prismaTest, disconnect } from './utils/prismaTestClient';
import { resetTestDb } from './utils/testDb';

describe('TeamModuleConfig and ModuleConfigAudit Models', () => {
  beforeAll(async () => {
    await resetTestDb();
  });

  afterAll(async () => {
    await disconnect();
  });

  describe('TeamModuleConfig', () => {
    let teamGroupId: string;
    let employeeId: string;

    beforeAll(async () => {
      // Create test employee
      const employee = await prismaTest.employee.create({
        data: {
          email: 'moduleconfig-test@test.com',
          passwordHash: 'hash',
          firstName: 'Module',
          lastName: 'Test',
        },
      });
      employeeId = employee.id;

      // Create test team group
      const teamGroup = await prismaTest.teamGroup.create({
        data: {
          name: 'Config Test Team',
          description: 'Team for module config tests',
          createdBy: employeeId,
        },
      });
      teamGroupId = teamGroup.id;
    });

    it('creates TeamModuleConfig with valid data', async () => {
      const config = await prismaTest.teamModuleConfig.create({
        data: {
          teamGroupId,
          moduleId: 'strategic-goals',
          isEnabled: true,
          scope: 'TEAM',
          createdBy: employeeId,
        },
      });

      expect(config).toBeDefined();
      expect(config.id).toBeDefined();
      expect(config.teamGroupId).toBe(teamGroupId);
      expect(config.moduleId).toBe('strategic-goals');
      expect(config.isEnabled).toBe(true);
      expect(config.scope).toBe('TEAM');
      expect(config.createdBy).toBe(employeeId);
      expect(config.createdAt).toBeInstanceOf(Date);
    });

    it('enforces unique constraint on [teamGroupId, moduleId]', async () => {
      // First, create a config
      await prismaTest.teamModuleConfig.upsert({
        where: {
          teamGroupId_moduleId: {
            teamGroupId,
            moduleId: 'skills',
          },
        },
        update: {},
        create: {
          teamGroupId,
          moduleId: 'skills',
          isEnabled: true,
        },
      });

      // Try to create duplicate - should fail
      await expect(
        prismaTest.teamModuleConfig.create({
          data: {
            teamGroupId,
            moduleId: 'skills',
            isEnabled: false,
          },
        })
      ).rejects.toThrow();
    });

    it('allows null scope for using module default', async () => {
      const config = await prismaTest.teamModuleConfig.create({
        data: {
          teamGroupId,
          moduleId: 'capacities',
          isEnabled: true,
          scope: null,
        },
      });

      expect(config.scope).toBeNull();
    });

    it('cascade deletes configs when TeamGroup is deleted', async () => {
      // Create a new team specifically for cascade test
      const cascadeTeam = await prismaTest.teamGroup.create({
        data: {
          name: 'Cascade Test Team',
          createdBy: employeeId,
        },
      });

      // Create configs for this team
      await prismaTest.teamModuleConfig.createMany({
        data: [
          { teamGroupId: cascadeTeam.id, moduleId: 'assessments', isEnabled: true },
          { teamGroupId: cascadeTeam.id, moduleId: 'reference-projects', isEnabled: false },
        ],
      });

      // Verify configs exist
      const configsBefore = await prismaTest.teamModuleConfig.findMany({
        where: { teamGroupId: cascadeTeam.id },
      });
      expect(configsBefore.length).toBe(2);

      // Delete the team
      await prismaTest.teamGroup.delete({
        where: { id: cascadeTeam.id },
      });

      // Verify configs are also deleted
      const configsAfter = await prismaTest.teamModuleConfig.findMany({
        where: { teamGroupId: cascadeTeam.id },
      });
      expect(configsAfter.length).toBe(0);
    });
  });

  describe('ModuleConfigAudit', () => {
    it('creates ModuleConfigAudit with JSON fields', async () => {
      const oldValues = { isEnabled: true, scope: 'GLOBAL' };
      const newValues = { isEnabled: false, scope: 'TEAM' };

      const audit = await prismaTest.moduleConfigAudit.create({
        data: {
          teamGroupId: 'some-team-id',
          moduleId: 'strategic-goals',
          action: 'UPDATE',
          oldValues: JSON.stringify(oldValues),
          newValues: JSON.stringify(newValues),
          performedBy: 'admin-user-id',
        },
      });

      expect(audit).toBeDefined();
      expect(audit.id).toBeDefined();
      expect(audit.action).toBe('UPDATE');
      expect(JSON.parse(audit.oldValues!)).toEqual(oldValues);
      expect(JSON.parse(audit.newValues!)).toEqual(newValues);
      expect(audit.performedAt).toBeInstanceOf(Date);
    });

    it('allows null oldValues for CREATE action', async () => {
      const newValues = { isEnabled: true, scope: 'GLOBAL' };

      const audit = await prismaTest.moduleConfigAudit.create({
        data: {
          teamGroupId: 'another-team-id',
          moduleId: 'skills',
          action: 'CREATE',
          oldValues: null,
          newValues: JSON.stringify(newValues),
          performedBy: 'admin-user-id',
        },
      });

      expect(audit.oldValues).toBeNull();
      expect(JSON.parse(audit.newValues!)).toEqual(newValues);
    });

    it('allows null newValues for DELETE action', async () => {
      const oldValues = { isEnabled: true, scope: 'TEAM' };

      const audit = await prismaTest.moduleConfigAudit.create({
        data: {
          teamGroupId: 'delete-team-id',
          moduleId: 'capacities',
          action: 'DELETE',
          oldValues: JSON.stringify(oldValues),
          newValues: null,
          performedBy: 'admin-user-id',
        },
      });

      expect(JSON.parse(audit.oldValues!)).toEqual(oldValues);
      expect(audit.newValues).toBeNull();
    });

    it('preserves audit history even after team deletion', async () => {
      // Create audit entry with a non-existent team ID (simulating after deletion)
      const audit = await prismaTest.moduleConfigAudit.create({
        data: {
          teamGroupId: 'non-existent-team-id',
          moduleId: 'strategic-goals',
          action: 'DELETE',
          oldValues: JSON.stringify({ isEnabled: true }),
          newValues: null,
          performedBy: 'admin-user-id',
        },
      });

      // Should still be queryable
      const found = await prismaTest.moduleConfigAudit.findUnique({
        where: { id: audit.id },
      });
      expect(found).toBeDefined();
      expect(found?.teamGroupId).toBe('non-existent-team-id');
    });
  });
});
