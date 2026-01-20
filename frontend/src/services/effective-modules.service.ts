/**
 * Effective Modules Service
 *
 * API client for user's effective module access.
 *
 * Task Group 6.2: Frontend effective modules service
 */

import { api } from './api';

// =============================================================================
// Types
// =============================================================================

export type DataScope = 'GLOBAL' | 'TEAM' | 'USER';
export type TeamRole = 'OWNER' | 'ADMIN' | 'EDITOR' | 'VIEWER' | 'USER';

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

export interface EnabledTeam {
  teamGroupId: string;
  teamName: string;
  scope: DataScope;
  userRole: TeamRole;
}

export interface UserEffectiveModule {
  module: ModuleDefinition;
  isAccessible: boolean;
  effectiveScope: DataScope;
  effectiveRole: TeamRole | null;
  enabledTeams: EnabledTeam[];
}

export interface TeamMembership {
  teamGroupId: string;
  teamName: string;
  role: TeamRole;
}

export interface EffectiveModulesSummary {
  modules: UserEffectiveModule[];
  accessibleCount: number;
  teamMemberships: TeamMembership[];
}

export interface ModuleAccessInfo {
  moduleId: string;
  hasAccess: boolean;
  effectiveScope: DataScope | null;
}

// =============================================================================
// API Functions
// =============================================================================

/**
 * Get user's effective modules.
 */
export async function getEffectiveModules(): Promise<EffectiveModulesSummary> {
  const res = await api.get<EffectiveModulesSummary>('/user/effective-modules');
  return res.data;
}

/**
 * Check if user has access to a specific module.
 */
export async function checkModuleAccess(moduleId: string): Promise<ModuleAccessInfo> {
  const res = await api.get<ModuleAccessInfo>(`/user/effective-modules/${moduleId}/access`);
  return res.data;
}
