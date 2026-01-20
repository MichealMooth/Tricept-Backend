/**
 * Module Registry
 *
 * Central registry of all modules in the system.
 * Modules are defined in code for type safety and compile-time checks.
 * Database stores only team-specific configuration overrides (TeamModuleConfig).
 *
 * To add a new module:
 * 1. Add entry to MODULE_REGISTRY array below
 * 2. Update ModuleId type in types/modules.ts
 * 3. Run tests to verify registry integrity
 */

import { ModuleDefinition, DataScope, ModuleId } from '@/types/modules';

/**
 * All modules registered in the system.
 * This is the source of truth for module definitions.
 */
export const MODULE_REGISTRY: readonly ModuleDefinition[] = [
  {
    id: 'strategic-goals',
    name: 'Strategische Ziele',
    route: '/strategic-goals',
    apiPrefix: '/api/strategic-goals',
    allowedScopes: ['GLOBAL', 'TEAM'],
    defaultScope: 'GLOBAL',
    description: 'Strategische Ziele mit Ampel-Bewertung',
  },
  {
    id: 'skills',
    name: 'Skills',
    route: '/my-skills',
    apiPrefix: '/api/skills',
    allowedScopes: ['GLOBAL'],
    defaultScope: 'GLOBAL',
    description: 'Skill-Katalog und Kategorien',
  },
  {
    id: 'assessments',
    name: 'Assessments',
    route: '/assess',
    apiPrefix: '/api/assessments',
    allowedScopes: ['GLOBAL', 'TEAM', 'USER'],
    defaultScope: 'USER',
    description: 'Self-Assessment und Peer-Assessment',
  },
  {
    id: 'capacities',
    name: 'Kapazitaeten',
    route: '/my-capacity',
    apiPrefix: '/api/capacities',
    allowedScopes: ['GLOBAL', 'TEAM', 'USER'],
    defaultScope: 'USER',
    description: 'Kapazitaetsplanung und Auslastung',
  },
  {
    id: 'reference-projects',
    name: 'Referenzprojekte',
    route: '/referenz-projekte',
    apiPrefix: '/api/reference-projects',
    allowedScopes: ['GLOBAL', 'TEAM'],
    defaultScope: 'GLOBAL',
    description: 'Referenzprojekte-Datenbank',
  },
  {
    id: 'kurzprofil',
    name: 'Kurzprofil',
    route: '/kurzprofil',
    apiPrefix: '/api/user-profile',
    allowedScopes: ['USER'],
    defaultScope: 'USER',
    description: 'Persoenliches Mitarbeiterprofil',
  },
  {
    id: 'employees',
    name: 'Mitarbeiter',
    route: '/admin/employees',
    apiPrefix: '/api/employees',
    allowedScopes: ['GLOBAL'],
    defaultScope: 'GLOBAL',
    description: 'Mitarbeiterverwaltung',
    adminOnly: true,
  },
] as const;

/**
 * Get a module by its ID.
 * @param id - Module ID to look up
 * @returns Module definition or undefined if not found
 */
export function getModuleById(id: string): ModuleDefinition | undefined {
  return MODULE_REGISTRY.find((m) => m.id === id);
}

/**
 * Get all registered modules.
 * @returns Array of all module definitions
 */
export function getAllModules(): readonly ModuleDefinition[] {
  return MODULE_REGISTRY;
}

/**
 * Check if a scope is valid for a given module.
 * @param moduleId - Module ID to check
 * @param scope - Scope to validate
 * @returns true if the scope is allowed for this module
 */
export function isValidScope(moduleId: string, scope: DataScope): boolean {
  const module = getModuleById(moduleId);
  if (!module) return false;
  return module.allowedScopes.includes(scope);
}

/**
 * Get the default scope for a module.
 * @param moduleId - Module ID to look up
 * @returns Default scope or undefined if module not found
 */
export function getDefaultScope(moduleId: string): DataScope | undefined {
  const module = getModuleById(moduleId);
  return module?.defaultScope;
}

/**
 * Get all valid module IDs.
 * Useful for validation.
 * @returns Array of all module IDs
 */
export function getAllModuleIds(): string[] {
  return MODULE_REGISTRY.map((m) => m.id);
}

/**
 * Check if a module ID is valid.
 * @param id - Module ID to validate
 * @returns true if the module exists
 */
export function isValidModuleId(id: string): id is ModuleId {
  return getAllModuleIds().includes(id);
}

/**
 * Get modules that are not admin-only.
 * These are the modules that can be configured per team.
 * @returns Array of non-admin module definitions
 */
export function getConfigurableModules(): readonly ModuleDefinition[] {
  return MODULE_REGISTRY.filter((m) => !m.adminOnly);
}
