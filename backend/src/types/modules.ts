/**
 * Module Type Definitions
 *
 * Types for the code-based module registry system.
 * Modules are defined in code for type safety and compile-time checks.
 * Database stores only team-specific configuration overrides.
 */

import { AuthScope } from './authorization';

/**
 * Data scope type alias (same as AuthScope for module context).
 * - GLOBAL: Tricept-wide data, visible to all authenticated users
 * - TEAM: Team-bound data, visible only to team members
 * - USER: Personal data, visible only to owner
 */
export type DataScope = AuthScope;

/**
 * Definition of a module in the system.
 * Modules are registered in code and cannot be created at runtime.
 */
export interface ModuleDefinition {
  /** Unique identifier for the module */
  id: string;

  /** Display name shown in UI */
  name: string;

  /** Frontend route prefix (e.g., '/strategic-goals') */
  route: string;

  /** Backend API prefix (e.g., '/api/strategic-goals') */
  apiPrefix: string;

  /** Scopes this module can be configured with */
  allowedScopes: DataScope[];

  /** Default scope when no team-specific config exists */
  defaultScope: DataScope;

  /** Optional description for admin UI */
  description?: string;

  /** Whether this is an admin-only module */
  adminOnly?: boolean;
}

/**
 * Union type of all valid module IDs.
 * Update this when adding new modules to the registry.
 */
export type ModuleId =
  | 'strategic-goals'
  | 'skills'
  | 'assessments'
  | 'capacities'
  | 'reference-projects'
  | 'kurzprofil'
  | 'employees';

/**
 * User's effective access to a module after applying union rules.
 */
export interface EffectiveModule {
  /** Module definition from registry */
  module: ModuleDefinition;

  /** Whether the module is accessible (enabled in at least one team) */
  isAccessible: boolean;

  /** Effective scope after applying precedence rules (GLOBAL > TEAM) */
  effectiveScope: DataScope;

  /** Teams where this module is enabled (for TEAM scope display) */
  enabledTeams: Array<{
    teamGroupId: string;
    teamName: string;
    scope: DataScope;
  }>;
}

/**
 * Team-specific module configuration (matches Prisma model).
 */
export interface TeamModuleConfig {
  id: string;
  teamGroupId: string;
  moduleId: string;
  isEnabled: boolean;
  scope: DataScope | null;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string | null;
  updatedBy: string | null;
}

/**
 * Audit entry for module configuration changes.
 */
export interface ModuleConfigAuditEntry {
  id: string;
  teamGroupId: string;
  moduleId: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE';
  oldValues: string | null;
  newValues: string | null;
  performedBy: string;
  performedAt: Date;
}
