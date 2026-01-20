/**
 * Authorization Middleware
 *
 * Provides role-based and scope-based access control for API endpoints.
 * Extends the existing isAuthenticated middleware pattern.
 *
 * Usage:
 * ```ts
 * import { authorize } from '@/middleware/authorize.middleware';
 *
 * // GLOBAL scope - admin only for write, all authenticated for read
 * router.get('/skills', isAuthenticated, authorize('USER', 'GLOBAL', { allowReadForAll: true }), getSkills);
 * router.post('/skills', isAuthenticated, authorize('USER', 'GLOBAL'), createSkill);
 *
 * // TEAM scope - requires role in the target team
 * router.get('/team-goals/:teamGroupId', isAuthenticated, authorize('VIEWER', 'TEAM'), getTeamGoals);
 * router.post('/team-goals/:teamGroupId', isAuthenticated, authorize('EDITOR', 'TEAM'), createTeamGoal);
 *
 * // USER scope - owner only
 * router.get('/my-assessments/:userId', isAuthenticated, authorize('USER', 'USER'), getMyAssessments);
 * ```
 */

import { Request, Response, NextFunction } from 'express';
import { env } from '@/config/env';
import {
  AuthScope,
  TeamRole,
  AuthOptions,
  AuthenticatedUser,
  hasRequiredRole,
} from '@/types/authorization';
import { getUserRoleInTeam } from '@/services/team-membership.service';

/**
 * Default options for authorize middleware.
 */
const DEFAULT_OPTIONS: AuthOptions = {
  teamGroupIdField: 'teamGroupId',
  userIdField: 'userId',
  allowReadForAll: false,
};

/**
 * Check if HTTP method is a read operation.
 */
function isReadMethod(method: string): boolean {
  const readMethods = ['GET', 'HEAD', 'OPTIONS'];
  return readMethods.includes(method.toUpperCase());
}

/**
 * Extract a value from request in order: params, body, query.
 */
function extractFromRequest(req: Request, fieldName: string): string | undefined {
  // Check params first
  if (req.params && req.params[fieldName]) {
    return req.params[fieldName];
  }

  // Check body second
  if (req.body && req.body[fieldName]) {
    return req.body[fieldName];
  }

  // Check query third
  if (req.query && req.query[fieldName]) {
    const value = req.query[fieldName];
    return typeof value === 'string' ? value : undefined;
  }

  return undefined;
}

/**
 * Extract teamGroupId from request using configured field name.
 * Also checks for 'id' in params if teamGroupIdField is 'teamGroupId' (common pattern).
 */
function extractTeamGroupId(req: Request, options: AuthOptions): string | undefined {
  const fieldName = options.teamGroupIdField || 'teamGroupId';

  // Try the configured field name
  let teamGroupId = extractFromRequest(req, fieldName);

  // If not found and using default field, also try 'id' in params
  if (!teamGroupId && fieldName === 'teamGroupId' && req.params?.id) {
    teamGroupId = req.params.id;
  }

  return teamGroupId;
}

/**
 * Extract target userId from request using configured field name.
 * Checks both 'userId' and 'employeeId' by default.
 */
function extractTargetUserId(req: Request, options: AuthOptions): string | undefined {
  const fieldName = options.userIdField || 'userId';

  // Try the configured field name
  let userId = extractFromRequest(req, fieldName);

  // If not found, also try 'employeeId'
  if (!userId) {
    userId = extractFromRequest(req, 'employeeId');
  }

  // If not found, also try 'id' in params (common for /my-resource/:id patterns)
  if (!userId && req.params?.id) {
    userId = req.params.id;
  }

  return userId;
}

/**
 * Authorization middleware factory.
 *
 * Creates middleware that checks if the authenticated user has the required role
 * for the requested scope.
 *
 * @param requiredRole - Minimum role required for access (default: 'USER')
 * @param scope - Data scope to check against (default: 'GLOBAL')
 * @param options - Additional options for extracting context from request
 * @returns Express middleware function
 */
export function authorize(
  requiredRole: TeamRole = 'USER',
  scope: AuthScope = 'GLOBAL',
  options: AuthOptions = {}
) {
  const mergedOptions = { ...DEFAULT_OPTIONS, ...options };

  return async (req: Request, res: Response, next: NextFunction) => {
    // In test environment, bypass authorization to allow Supertest without session
    if (env.nodeEnv === 'test') {
      return next();
    }

    const user = (req as any).user as AuthenticatedUser | undefined;

    // Check if user is authenticated (should have been checked by isAuthenticated already)
    if (!user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const isRead = isReadMethod(req.method);

    // Global Admin (isAdmin=true) has break-glass access to all resources
    if (user.isAdmin) {
      return next();
    }

    // Handle scope-specific authorization
    switch (scope) {
      case 'GLOBAL':
        return handleGlobalScope(res, next, isRead, mergedOptions);

      case 'TEAM':
        return handleTeamScope(req, res, next, user, requiredRole, mergedOptions);

      case 'USER':
        return handleUserScope(req, res, next, user, mergedOptions);

      default:
        return res.status(500).json({ message: 'Invalid authorization scope' });
    }
  };
}

/**
 * Handle GLOBAL scope authorization.
 *
 * - Read access: allowed for all authenticated users (if allowReadForAll is true)
 * - Write access: requires Global Admin (isAdmin=true)
 */
async function handleGlobalScope(
  res: Response,
  next: NextFunction,
  isRead: boolean,
  options: AuthOptions
): Promise<void> {
  // Allow read access for all authenticated users if configured
  if (isRead && options.allowReadForAll) {
    return next();
  }

  // For write operations (or if allowReadForAll is false), require Global Admin
  // Since we already checked isAdmin above and returned next(), reaching here means not admin
  return res.status(403).json({
    message: 'Forbidden: Global Admin access required for this operation',
  }) as unknown as void;
}

/**
 * Handle TEAM scope authorization.
 *
 * - Checks user's TeamMembership role in the target TeamGroup
 * - Compares against required role using hierarchy
 */
async function handleTeamScope(
  req: Request,
  res: Response,
  next: NextFunction,
  user: AuthenticatedUser,
  requiredRole: TeamRole,
  options: AuthOptions
): Promise<void> {
  const teamGroupId = extractTeamGroupId(req, options);

  if (!teamGroupId) {
    return res.status(400).json({
      message: 'Bad Request: teamGroupId is required for team-scoped resources',
    }) as unknown as void;
  }

  // Get user's role in the TeamGroup
  const userRole = await getUserRoleInTeam(user.id, teamGroupId);

  if (!userRole) {
    return res.status(403).json({
      message: 'Forbidden: You are not a member of this team',
    }) as unknown as void;
  }

  // Check if user's role meets the required role
  if (!hasRequiredRole(userRole, requiredRole)) {
    return res.status(403).json({
      message: `Forbidden: ${requiredRole} role or higher required, you have ${userRole}`,
    }) as unknown as void;
  }

  // User has sufficient role in the team
  return next();
}

/**
 * Handle USER scope authorization.
 *
 * - Verifies ownership via userId/employeeId match
 * - Only the owner can access their own data
 */
async function handleUserScope(
  req: Request,
  res: Response,
  next: NextFunction,
  user: AuthenticatedUser,
  options: AuthOptions
): Promise<void> {
  const targetUserId = extractTargetUserId(req, options);

  if (!targetUserId) {
    return res.status(400).json({
      message: 'Bad Request: userId or employeeId is required for user-scoped resources',
    }) as unknown as void;
  }

  // Check ownership - the requesting user must be the owner of the resource
  if (user.id !== targetUserId) {
    return res.status(403).json({
      message: 'Forbidden: You can only access your own data',
    }) as unknown as void;
  }

  // User owns this resource
  return next();
}

/**
 * Convenience middleware that combines isAuthenticated and authorize.
 * Useful for routes that need both checks in one middleware.
 */
export function requireAuth(
  requiredRole: TeamRole = 'USER',
  scope: AuthScope = 'GLOBAL',
  options: AuthOptions = {}
) {
  const authorizeMiddleware = authorize(requiredRole, scope, options);

  return async (req: Request, res: Response, next: NextFunction) => {
    // In test environment, bypass auth to allow Supertest without session
    if (env.nodeEnv === 'test') {
      return next();
    }

    // Check authentication first
    if (!req.isAuthenticated || !req.isAuthenticated()) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    // Then check authorization
    return authorizeMiddleware(req, res, next);
  };
}
