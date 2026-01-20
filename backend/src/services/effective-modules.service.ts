/**
 * Effective Modules Service
 *
 * Calculates which modules a user can access based on their team memberships
 * and team-specific module configurations. Implements union rules for multi-team users.
 *
 * Task Group 4.2-4.3: Create EffectiveModulesService with multi-team union logic
 */

import { prisma } from '@/config/database';
import { getAllModules, getModuleById } from '@/config/modules.registry';
import type { ModuleDefinition, DataScope, EffectiveModule } from '@/types/modules';
import type { TeamRole } from '@/types/authorization';
import { ROLE_HIERARCHY } from '@/types/authorization';

// =============================================================================
// Types
// =============================================================================

/**
 * User's effective module with access details.
 */
export interface UserEffectiveModule {
  /** Module definition from registry */
  module: ModuleDefinition;

  /** Whether the module is accessible (enabled in at least one team) */
  isAccessible: boolean;

  /** Effective scope after applying precedence rules */
  effectiveScope: DataScope;

  /** User's highest role across all teams for this module */
  effectiveRole: TeamRole | null;

  /** Teams where this module is enabled */
  enabledTeams: Array<{
    teamGroupId: string;
    teamName: string;
    scope: DataScope;
    userRole: TeamRole;
  }>;
}

/**
 * Summary of user's effective modules.
 */
export interface EffectiveModulesSummary {
  /** All modules with user's access status */
  modules: UserEffectiveModule[];

  /** Count of accessible modules */
  accessibleCount: number;

  /** User's team memberships */
  teamMemberships: Array<{
    teamGroupId: string;
    teamName: string;
    role: TeamRole;
  }>;
}

// =============================================================================
// Private Helper Functions
// =============================================================================

/**
 * Determine scope precedence.
 * GLOBAL takes precedence over TEAM, TEAM takes precedence over USER.
 */
function getScopePrecedence(scope: DataScope): number {
  switch (scope) {
    case 'GLOBAL':
      return 3;
    case 'TEAM':
      return 2;
    case 'USER':
      return 1;
    default:
      return 0;
  }
}

/**
 * Get the most permissive scope (highest precedence).
 */
function getMostPermissiveScope(scopes: DataScope[]): DataScope {
  if (scopes.length === 0) return 'USER';

  return scopes.reduce((most, current) =>
    getScopePrecedence(current) > getScopePrecedence(most) ? current : most
  );
}

/**
 * Get the highest role from a list of roles.
 */
function getHighestRole(roles: TeamRole[]): TeamRole | null {
  if (roles.length === 0) return null;

  return roles.reduce((highest, current) =>
    ROLE_HIERARCHY[current] > ROLE_HIERARCHY[highest] ? current : highest
  );
}

// =============================================================================
// Service Functions
// =============================================================================

/**
 * Get effective modules for a user.
 * Applies union rules:
 * - Module is visible if enabled in ANY team
 * - Scope: most permissive (GLOBAL > TEAM > USER)
 * - Role: highest across all team memberships
 *
 * @param userId - Employee/User ID
 * @returns User's effective modules summary
 */
export async function getEffectiveModules(userId: string): Promise<EffectiveModulesSummary> {
  // Get user's team memberships
  const memberships = await prisma.teamMembership.findMany({
    where: {
      employeeId: userId,
      teamGroup: {
        isActive: true,
      },
    },
    include: {
      teamGroup: {
        select: { id: true, name: true },
      },
    },
  });

  // Get team IDs
  const teamIds = memberships.map((m) => m.teamGroupId);

  // Get all module configs for user's teams
  const configs = await prisma.teamModuleConfig.findMany({
    where: {
      teamGroupId: { in: teamIds },
    },
    include: {
      teamGroup: {
        select: { id: true, name: true },
      },
    },
  });

  // Build config lookup map: moduleId -> array of configs
  const configsByModule = new Map<string, typeof configs>();
  configs.forEach((config) => {
    const existing = configsByModule.get(config.moduleId) || [];
    existing.push(config);
    configsByModule.set(config.moduleId, existing);
  });

  // Build membership lookup: teamGroupId -> membership
  const membershipByTeam = new Map(memberships.map((m) => [m.teamGroupId, m]));

  // Get all modules from registry
  const allModules = getAllModules();

  // Calculate effective modules
  const effectiveModules: UserEffectiveModule[] = allModules.map((module) => {
    const moduleConfigs = configsByModule.get(module.id) || [];

    // If no configs, check if any team membership exists
    // Default behavior: modules are enabled by default for team members
    if (moduleConfigs.length === 0 && memberships.length > 0) {
      // Module is accessible with default scope for all teams user belongs to
      const enabledTeams = memberships.map((m) => ({
        teamGroupId: m.teamGroupId,
        teamName: m.teamGroup.name,
        scope: module.defaultScope,
        userRole: m.role as TeamRole,
      }));

      const roles = enabledTeams.map((t) => t.userRole);

      return {
        module,
        isAccessible: true,
        effectiveScope: module.defaultScope,
        effectiveRole: getHighestRole(roles),
        enabledTeams,
      };
    }

    // Filter to enabled configs only
    const enabledConfigs = moduleConfigs.filter((c) => c.isEnabled);

    // If no enabled configs, module is not accessible
    if (enabledConfigs.length === 0 && moduleConfigs.length > 0) {
      // Explicit disable in all configs
      return {
        module,
        isAccessible: false,
        effectiveScope: module.defaultScope,
        effectiveRole: null,
        enabledTeams: [],
      };
    }

    // Build enabled teams with scope and role
    const enabledTeams = enabledConfigs.map((config) => {
      const membership = membershipByTeam.get(config.teamGroupId);
      const scope = (config.scope as DataScope) ?? module.defaultScope;

      return {
        teamGroupId: config.teamGroupId,
        teamName: config.teamGroup.name,
        scope,
        userRole: (membership?.role as TeamRole) ?? 'USER',
      };
    });

    // Calculate effective scope (most permissive)
    const scopes = enabledTeams.map((t) => t.scope);
    const effectiveScope = getMostPermissiveScope(scopes);

    // Calculate effective role (highest)
    const roles = enabledTeams.map((t) => t.userRole);
    const effectiveRole = getHighestRole(roles);

    return {
      module,
      isAccessible: enabledTeams.length > 0,
      effectiveScope,
      effectiveRole,
      enabledTeams,
    };
  });

  // Count accessible modules
  const accessibleCount = effectiveModules.filter((m) => m.isAccessible).length;

  // Build team memberships summary
  const teamMemberships = memberships.map((m) => ({
    teamGroupId: m.teamGroupId,
    teamName: m.teamGroup.name,
    role: m.role as TeamRole,
  }));

  return {
    modules: effectiveModules,
    accessibleCount,
    teamMemberships,
  };
}

/**
 * Check if a user has access to a specific module.
 *
 * @param userId - Employee/User ID
 * @param moduleId - Module ID to check
 * @returns true if user has access, false otherwise
 */
export async function hasModuleAccess(userId: string, moduleId: string): Promise<boolean> {
  const module = getModuleById(moduleId);
  if (!module) return false;

  // Get user's team memberships
  const memberships = await prisma.teamMembership.findMany({
    where: {
      employeeId: userId,
      teamGroup: {
        isActive: true,
      },
    },
    select: { teamGroupId: true },
  });

  if (memberships.length === 0) {
    // User has no team memberships - no access to team-scoped modules
    return false;
  }

  const teamIds = memberships.map((m) => m.teamGroupId);

  // Check if module is explicitly disabled for all teams
  const disabledConfigs = await prisma.teamModuleConfig.count({
    where: {
      moduleId,
      teamGroupId: { in: teamIds },
      isEnabled: false,
    },
  });

  const enabledConfigs = await prisma.teamModuleConfig.count({
    where: {
      moduleId,
      teamGroupId: { in: teamIds },
      isEnabled: true,
    },
  });

  // If there are enabled configs, user has access
  if (enabledConfigs > 0) return true;

  // If there are only disabled configs, user doesn't have access
  if (disabledConfigs > 0 && enabledConfigs === 0) return false;

  // If no configs at all, default to accessible (module defaults)
  return true;
}

/**
 * Get the effective scope for a user on a specific module.
 *
 * @param userId - Employee/User ID
 * @param moduleId - Module ID
 * @returns Effective scope or null if no access
 */
export async function getEffectiveScope(
  userId: string,
  moduleId: string
): Promise<DataScope | null> {
  const module = getModuleById(moduleId);
  if (!module) return null;

  // Get user's team memberships
  const memberships = await prisma.teamMembership.findMany({
    where: {
      employeeId: userId,
      teamGroup: {
        isActive: true,
      },
    },
    select: { teamGroupId: true },
  });

  if (memberships.length === 0) return null;

  const teamIds = memberships.map((m) => m.teamGroupId);

  // Get module configs for user's teams
  const configs = await prisma.teamModuleConfig.findMany({
    where: {
      moduleId,
      teamGroupId: { in: teamIds },
      isEnabled: true,
    },
  });

  if (configs.length === 0) {
    // No explicit configs - use module default
    return module.defaultScope;
  }

  // Get scopes from configs
  const scopes = configs.map((c) => (c.scope as DataScope) ?? module.defaultScope);

  return getMostPermissiveScope(scopes);
}
