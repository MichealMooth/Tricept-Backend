/**
 * Team Module Configuration Service
 *
 * Provides CRUD operations for TeamModuleConfig entities using Prisma ORM.
 * Includes automatic audit trail logging for all configuration changes.
 *
 * Task Group 3.2-3.3: Create TeamModuleConfigService with audit logging
 */

import { prisma } from '@/config/database';
import type { TeamModuleConfig, ModuleConfigAudit, Prisma } from '@prisma/client';
import { getAllModules, getModuleById } from '@/config/modules.registry';
import type { ModuleDefinition, DataScope } from '@/types/modules';

// =============================================================================
// Types
// =============================================================================

/**
 * Input for upserting a TeamModuleConfig.
 */
export interface UpsertConfigInput {
  teamGroupId: string;
  moduleId: string;
  isEnabled?: boolean;
  scope?: DataScope | null;
  performedBy: string;
}

/**
 * Module with aggregated team configurations.
 */
export interface ModuleWithConfigs {
  module: ModuleDefinition;
  teamConfigs: Array<{
    teamGroupId: string;
    teamName: string;
    isEnabled: boolean;
    scope: DataScope | null;
  }>;
  enabledTeamCount: number;
  totalTeamCount: number;
}

/**
 * Team with all its module configurations.
 */
export interface TeamWithModuleConfigs {
  teamGroupId: string;
  teamName: string;
  configs: Array<{
    moduleId: string;
    moduleName: string;
    isEnabled: boolean;
    scope: DataScope | null;
    effectiveScope: DataScope;
  }>;
}

/**
 * Audit trail query parameters.
 */
export interface AuditTrailParams {
  teamGroupId?: string;
  moduleId?: string;
  fromDate?: Date;
  toDate?: Date;
  page?: number;
  pageSize?: number;
}

// =============================================================================
// Private Helper Functions
// =============================================================================

/**
 * Create an audit entry for a config change.
 */
async function createAuditEntry(
  teamGroupId: string,
  moduleId: string,
  action: 'CREATE' | 'UPDATE' | 'DELETE',
  oldValues: Record<string, unknown> | null,
  newValues: Record<string, unknown> | null,
  performedBy: string
): Promise<ModuleConfigAudit> {
  return prisma.moduleConfigAudit.create({
    data: {
      teamGroupId,
      moduleId,
      action,
      oldValues: oldValues ? JSON.stringify(oldValues) : null,
      newValues: newValues ? JSON.stringify(newValues) : null,
      performedBy,
    },
  });
}

// =============================================================================
// Service Functions
// =============================================================================

/**
 * Get all modules with their team configurations.
 * Returns all modules from registry with aggregated config data.
 * For the list view, we only return summary data (not all teams per module).
 *
 * @returns Array of modules with their team configurations
 */
export async function getModulesWithConfigs(): Promise<ModuleWithConfigs[]> {
  const modules = getAllModules();

  // Get all team groups for counting
  const teamGroups = await prisma.teamGroup.findMany({
    where: { isActive: true },
    select: { id: true, name: true },
    orderBy: { name: 'asc' },
  });

  // Get all configs
  const configs = await prisma.teamModuleConfig.findMany();

  // Build config map: moduleId -> Map<teamGroupId, config>
  const configsByModule = new Map<string, Map<string, typeof configs[0]>>();
  for (const config of configs) {
    if (!configsByModule.has(config.moduleId)) {
      configsByModule.set(config.moduleId, new Map());
    }
    configsByModule.get(config.moduleId)!.set(config.teamGroupId, config);
  }

  // Build result
  return modules.map((module) => {
    const moduleConfigMap = configsByModule.get(module.id) ?? new Map();

    // Build team configs for ALL teams (with defaults)
    const teamConfigs = teamGroups.map((team) => {
      const config = moduleConfigMap.get(team.id);
      return {
        teamGroupId: team.id,
        teamName: team.name,
        isEnabled: config?.isEnabled ?? true, // Default to enabled
        scope: (config?.scope as DataScope | null) ?? null,
      };
    });

    return {
      module,
      teamConfigs,
      enabledTeamCount: teamConfigs.filter((c) => c.isEnabled).length,
      totalTeamCount: teamGroups.length,
    };
  });
}

/**
 * Get a single module with all its team configurations.
 * Returns ALL teams with their configurations (defaulting to enabled if no config exists).
 *
 * @param moduleId - Module ID from registry
 * @returns Module with team configurations or null if not found
 */
export async function getModuleWithConfigs(moduleId: string): Promise<ModuleWithConfigs | null> {
  const module = getModuleById(moduleId);
  if (!module) {
    return null;
  }

  const teamGroups = await prisma.teamGroup.findMany({
    where: { isActive: true },
    select: { id: true, name: true },
    orderBy: { name: 'asc' },
  });

  const configs = await prisma.teamModuleConfig.findMany({
    where: { moduleId },
  });

  // Build config map for quick lookup
  const configMap = new Map(configs.map((c) => [c.teamGroupId, c]));

  // Return ALL teams with their configurations (default to enabled if no config)
  const teamConfigs = teamGroups.map((team) => {
    const config = configMap.get(team.id);
    return {
      teamGroupId: team.id,
      teamName: team.name,
      isEnabled: config?.isEnabled ?? true, // Default to enabled
      scope: (config?.scope as DataScope | null) ?? null,
    };
  });

  return {
    module,
    teamConfigs,
    enabledTeamCount: teamConfigs.filter((c) => c.isEnabled).length,
    totalTeamCount: teamGroups.length,
  };
}

/**
 * Get all module configurations for a specific team.
 *
 * @param teamGroupId - Team group ID
 * @returns Team with all module configurations
 */
export async function getTeamConfigs(teamGroupId: string): Promise<TeamWithModuleConfigs | null> {
  const teamGroup = await prisma.teamGroup.findUnique({
    where: { id: teamGroupId },
    select: { id: true, name: true },
  });

  if (!teamGroup) {
    return null;
  }

  const modules = getAllModules();
  const configs = await prisma.teamModuleConfig.findMany({
    where: { teamGroupId },
  });

  // Build config map for quick lookup
  const configMap = new Map(configs.map((c) => [c.moduleId, c]));

  return {
    teamGroupId: teamGroup.id,
    teamName: teamGroup.name,
    configs: modules.map((module) => {
      const config = configMap.get(module.id);
      const effectiveScope = config?.scope ?? module.defaultScope;

      return {
        moduleId: module.id,
        moduleName: module.name,
        isEnabled: config?.isEnabled ?? true, // Default to enabled if no config
        scope: config?.scope as DataScope | null ?? null,
        effectiveScope: effectiveScope as DataScope,
      };
    }),
  };
}

/**
 * Create or update a team module configuration.
 * Automatically creates audit trail entry.
 *
 * @param input - Configuration data
 * @returns The created/updated config
 */
export async function upsertConfig(input: UpsertConfigInput): Promise<TeamModuleConfig> {
  const { teamGroupId, moduleId, isEnabled = true, scope = null, performedBy } = input;

  // Check for existing config
  const existing = await prisma.teamModuleConfig.findUnique({
    where: {
      teamGroupId_moduleId: {
        teamGroupId,
        moduleId,
      },
    },
  });

  if (existing) {
    // Update existing config
    const oldValues = {
      isEnabled: existing.isEnabled,
      scope: existing.scope,
    };

    const updated = await prisma.teamModuleConfig.update({
      where: { id: existing.id },
      data: {
        isEnabled,
        scope,
        updatedBy: performedBy,
      },
    });

    // Create audit entry
    await createAuditEntry(teamGroupId, moduleId, 'UPDATE', oldValues, { isEnabled, scope }, performedBy);

    return updated;
  } else {
    // Create new config
    const created = await prisma.teamModuleConfig.create({
      data: {
        teamGroupId,
        moduleId,
        isEnabled,
        scope,
        createdBy: performedBy,
        updatedBy: performedBy,
      },
    });

    // Create audit entry
    await createAuditEntry(teamGroupId, moduleId, 'CREATE', null, { isEnabled, scope }, performedBy);

    return created;
  }
}

/**
 * Delete a team module configuration.
 * Automatically creates audit trail entry.
 *
 * @param teamGroupId - Team group ID
 * @param moduleId - Module ID
 * @param performedBy - User ID performing the deletion
 * @returns true if deleted, false if not found
 */
export async function deleteConfig(
  teamGroupId: string,
  moduleId: string,
  performedBy: string
): Promise<boolean> {
  const existing = await prisma.teamModuleConfig.findUnique({
    where: {
      teamGroupId_moduleId: {
        teamGroupId,
        moduleId,
      },
    },
  });

  if (!existing) {
    return false;
  }

  await prisma.teamModuleConfig.delete({
    where: { id: existing.id },
  });

  // Create audit entry
  await createAuditEntry(
    teamGroupId,
    moduleId,
    'DELETE',
    { isEnabled: existing.isEnabled, scope: existing.scope },
    null,
    performedBy
  );

  return true;
}

/**
 * Get audit trail entries with pagination and filtering.
 *
 * @param params - Query parameters
 * @returns Paginated audit entries
 */
export async function getAuditTrail(params: AuditTrailParams = {}): Promise<{
  items: ModuleConfigAudit[];
  total: number;
  page: number;
  pageSize: number;
}> {
  const page = Math.max(1, params.page ?? 1);
  const pageSize = Math.max(1, Math.min(100, params.pageSize ?? 20));
  const skip = (page - 1) * pageSize;

  // Build where clause
  const where: Prisma.ModuleConfigAuditWhereInput = {};

  if (params.teamGroupId) {
    where.teamGroupId = params.teamGroupId;
  }
  if (params.moduleId) {
    where.moduleId = params.moduleId;
  }
  if (params.fromDate || params.toDate) {
    where.performedAt = {};
    if (params.fromDate) {
      where.performedAt.gte = params.fromDate;
    }
    if (params.toDate) {
      where.performedAt.lte = params.toDate;
    }
  }

  const [total, items] = await Promise.all([
    prisma.moduleConfigAudit.count({ where }),
    prisma.moduleConfigAudit.findMany({
      where,
      skip,
      take: pageSize,
      orderBy: { performedAt: 'desc' },
    }),
  ]);

  return {
    items,
    total,
    page,
    pageSize,
  };
}

/**
 * Get the count of records affected by disabling a module for a team.
 * Used for warning users before deactivation.
 *
 * @param teamGroupId - Team group ID
 * @param moduleId - Module ID
 * @returns Count of affected records
 */
export async function getAffectedRecordCount(teamGroupId: string, moduleId: string): Promise<number> {
  // This is a simplified implementation - in reality, you'd query the specific
  // module's data tables to count TEAM-scoped records for this team
  // For now, return 0 as a placeholder
  const module = getModuleById(moduleId);
  if (!module) {
    return 0;
  }

  // Example: count strategic goals with TEAM scope for this team
  if (moduleId === 'strategic-goals') {
    return prisma.strategicGoal.count({
      where: {
        scope: 'TEAM',
        teamGroupId,
      },
    });
  }

  return 0;
}
