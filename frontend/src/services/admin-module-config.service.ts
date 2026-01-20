/**
 * Admin Module Configuration Service
 *
 * API client for module configuration administration endpoints.
 *
 * Task Group 5.2: Create frontend API client
 */

import { api } from './api';

// =============================================================================
// Types
// =============================================================================

export interface ModuleDefinition {
  id: string;
  name: string;
  route: string;
  apiPrefix: string;
  allowedScopes: DataScope[];
  defaultScope: DataScope;
  description?: string;
  adminOnly?: boolean;
}

export type DataScope = 'GLOBAL' | 'TEAM' | 'USER';

export interface TeamConfig {
  teamGroupId: string;
  teamName: string;
  isEnabled: boolean;
  scope: DataScope | null;
}

export interface ModuleWithConfigs {
  module: ModuleDefinition;
  teamConfigs: TeamConfig[];
  enabledTeamCount: number;
  totalTeamCount: number;
}

export interface TeamModuleConfig {
  moduleId: string;
  moduleName: string;
  isEnabled: boolean;
  scope: DataScope | null;
  effectiveScope: DataScope;
}

export interface TeamWithModuleConfigs {
  teamGroupId: string;
  teamName: string;
  configs: TeamModuleConfig[];
}

export interface AuditEntry {
  id: string;
  teamGroupId: string;
  moduleId: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE';
  oldValues: string | null;
  newValues: string | null;
  performedBy: string;
  performedAt: string;
}

export interface AuditTrailResponse {
  items: AuditEntry[];
  total: number;
  page: number;
  pageSize: number;
}

export interface UpsertConfigInput {
  teamGroupId: string;
  moduleId: string;
  isEnabled?: boolean;
  scope?: DataScope | null;
}

// =============================================================================
// API Functions
// =============================================================================

/**
 * Get all modules with their team configurations.
 */
export async function listModules(): Promise<ModuleWithConfigs[]> {
  const res = await api.get<ModuleWithConfigs[]>('/admin/modules');
  return res.data;
}

/**
 * Get a single module with all its team configurations.
 */
export async function getModule(moduleId: string): Promise<ModuleWithConfigs> {
  const res = await api.get<ModuleWithConfigs>(`/admin/modules/${moduleId}`);
  return res.data;
}

/**
 * Get all module configurations for a specific team.
 */
export async function getTeamConfig(teamId: string): Promise<TeamWithModuleConfigs> {
  const res = await api.get<TeamWithModuleConfigs>(`/admin/team-module-config/${teamId}`);
  return res.data;
}

/**
 * Create or update a team module configuration.
 */
export async function upsertConfig(input: UpsertConfigInput): Promise<void> {
  await api.put('/admin/team-module-config', input);
}

/**
 * Delete a team module configuration (reset to defaults).
 */
export async function deleteConfig(teamId: string, moduleId: string): Promise<void> {
  await api.delete(`/admin/team-module-config/${teamId}/${moduleId}`);
}

/**
 * Get count of affected records for disabling a module.
 */
export async function getAffectedCount(
  teamId: string,
  moduleId: string
): Promise<{ count: number }> {
  const res = await api.get<{ count: number }>(
    `/admin/team-module-config/${teamId}/${moduleId}/affected-count`
  );
  return res.data;
}

/**
 * Get audit trail for module configurations.
 */
export async function getAuditTrail(params?: {
  teamGroupId?: string;
  moduleId?: string;
  page?: number;
  pageSize?: number;
}): Promise<AuditTrailResponse> {
  const res = await api.get<AuditTrailResponse>('/admin/module-config-audit', { params });
  return res.data;
}
