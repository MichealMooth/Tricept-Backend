/**
 * Authorization Types and Interfaces
 *
 * Defines types for the TeamGroup-based RBAC system with data classification.
 * These types match the Prisma schema enums (validated at application layer since SQLite
 * does not support native enums).
 */

/**
 * Data scope classification for resources.
 * - GLOBAL: readable by all authenticated users, writable by Global Admin only
 * - TEAM: visible to TeamGroup members only
 * - USER: owner-only access
 */
export type AuthScope = 'GLOBAL' | 'TEAM' | 'USER';

/**
 * Role within a TeamGroup.
 * Hierarchy: OWNER > ADMIN > EDITOR > VIEWER > USER
 * - OWNER: full rights including role/membership management within the TeamGroup
 * - ADMIN: manage team content, cannot manage memberships
 * - EDITOR: create/update team-scoped content
 * - VIEWER: read-only access to team content
 * - USER: basic rights on own data only
 */
export type TeamRole = 'OWNER' | 'ADMIN' | 'EDITOR' | 'VIEWER' | 'USER';

/**
 * Role hierarchy for permission comparison.
 * Higher number = more permissions.
 */
export const ROLE_HIERARCHY: Record<TeamRole, number> = {
  OWNER: 5,
  ADMIN: 4,
  EDITOR: 3,
  VIEWER: 2,
  USER: 1,
};

/**
 * Check if a user's role meets or exceeds the required role.
 * @param userRole - The user's role in the TeamGroup
 * @param requiredRole - The minimum required role
 * @returns true if userRole >= requiredRole in hierarchy
 */
export function hasRequiredRole(userRole: TeamRole, requiredRole: TeamRole): boolean {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[requiredRole];
}

/**
 * Options for the authorize middleware.
 */
export interface AuthOptions {
  /**
   * Field name to extract teamGroupId from request.
   * Checked in order: params, body, query.
   * Default: 'teamGroupId'
   */
  teamGroupIdField?: string;

  /**
   * Field name to extract userId/employeeId for USER scope ownership check.
   * Checked in order: params, body, query.
   * Default: 'userId' or 'employeeId'
   */
  userIdField?: string;

  /**
   * Allow read operations for all authenticated users.
   * When true and request method is GET, skip role check.
   * Default: false
   */
  allowReadForAll?: boolean;
}

/**
 * Authorization context built from request and user data.
 */
export interface AuthorizationContext {
  /** The authenticated user */
  user: AuthenticatedUser;

  /** Extracted teamGroupId from request (for TEAM scope) */
  teamGroupId?: string;

  /** Extracted target userId from request (for USER scope) */
  targetUserId?: string;

  /** HTTP method of the request */
  method: string;

  /** Whether this is a read operation (GET, HEAD, OPTIONS) */
  isReadOperation: boolean;
}

/**
 * Authenticated user shape from req.user.
 * Matches the Employee model fields used for authorization.
 */
export interface AuthenticatedUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  isAdmin: boolean;
}
