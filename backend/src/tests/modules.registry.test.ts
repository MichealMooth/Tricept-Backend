/**
 * Tests for Module Registry
 */

import {
  MODULE_REGISTRY,
  getModuleById,
  getAllModules,
  isValidScope,
  getDefaultScope,
  getAllModuleIds,
  isValidModuleId,
  getConfigurableModules,
} from '@/config/modules.registry';

describe('Module Registry', () => {
  describe('getModuleById', () => {
    it('returns correct module definition for valid ID', () => {
      const module = getModuleById('strategic-goals');

      expect(module).toBeDefined();
      expect(module?.id).toBe('strategic-goals');
      expect(module?.name).toBe('Strategische Ziele');
      expect(module?.route).toBe('/strategic-goals');
      expect(module?.apiPrefix).toBe('/api/strategic-goals');
    });

    it('returns undefined for invalid ID', () => {
      const module = getModuleById('non-existent-module');
      expect(module).toBeUndefined();
    });
  });

  describe('getAllModules', () => {
    it('returns all defined modules', () => {
      const modules = getAllModules();

      expect(modules.length).toBeGreaterThan(0);
      expect(modules).toContainEqual(
        expect.objectContaining({ id: 'strategic-goals' })
      );
      expect(modules).toContainEqual(
        expect.objectContaining({ id: 'skills' })
      );
      expect(modules).toContainEqual(
        expect.objectContaining({ id: 'assessments' })
      );
    });
  });

  describe('isValidScope', () => {
    it('returns true for valid scope in module allowedScopes', () => {
      // strategic-goals allows GLOBAL and TEAM
      expect(isValidScope('strategic-goals', 'GLOBAL')).toBe(true);
      expect(isValidScope('strategic-goals', 'TEAM')).toBe(true);
    });

    it('returns false for scope not in module allowedScopes', () => {
      // strategic-goals does not allow USER
      expect(isValidScope('strategic-goals', 'USER')).toBe(false);
      // skills only allows GLOBAL
      expect(isValidScope('skills', 'TEAM')).toBe(false);
      expect(isValidScope('skills', 'USER')).toBe(false);
    });

    it('returns false for non-existent module', () => {
      expect(isValidScope('non-existent', 'GLOBAL')).toBe(false);
    });
  });

  describe('getDefaultScope', () => {
    it('returns module default scope', () => {
      expect(getDefaultScope('strategic-goals')).toBe('GLOBAL');
      expect(getDefaultScope('assessments')).toBe('USER');
      expect(getDefaultScope('kurzprofil')).toBe('USER');
    });

    it('returns undefined for non-existent module', () => {
      expect(getDefaultScope('non-existent')).toBeUndefined();
    });
  });

  describe('isValidModuleId', () => {
    it('returns true for valid module IDs', () => {
      expect(isValidModuleId('strategic-goals')).toBe(true);
      expect(isValidModuleId('skills')).toBe(true);
    });

    it('returns false for invalid module IDs', () => {
      expect(isValidModuleId('invalid-id')).toBe(false);
    });
  });

  describe('getConfigurableModules', () => {
    it('returns only non-admin modules', () => {
      const configurable = getConfigurableModules();

      // Should not include admin-only modules
      expect(configurable.find((m) => m.id === 'employees')).toBeUndefined();

      // Should include regular modules
      expect(configurable.find((m) => m.id === 'strategic-goals')).toBeDefined();
    });
  });

  describe('Registry Integrity', () => {
    it('all modules have required fields', () => {
      for (const module of MODULE_REGISTRY) {
        expect(module.id).toBeDefined();
        expect(module.name).toBeDefined();
        expect(module.route).toBeDefined();
        expect(module.apiPrefix).toBeDefined();
        expect(module.allowedScopes).toBeDefined();
        expect(module.allowedScopes.length).toBeGreaterThan(0);
        expect(module.defaultScope).toBeDefined();
      }
    });

    it('all modules have defaultScope in allowedScopes', () => {
      for (const module of MODULE_REGISTRY) {
        expect(module.allowedScopes).toContain(module.defaultScope);
      }
    });

    it('all module IDs are unique', () => {
      const ids = getAllModuleIds();
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });
  });
});
