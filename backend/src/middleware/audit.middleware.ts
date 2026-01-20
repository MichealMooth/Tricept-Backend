/**
 * Audit Middleware
 *
 * This middleware provides two types of audit functionality:
 *
 * 1. Request-level audit logging for DSGVO compliance (existing)
 *    - Logs metadata about each request for security and compliance purposes
 *
 * 2. Audit field utilities for database records (Task Group 6.2)
 *    - Provides utility functions for auto-populating createdBy/updatedBy fields
 *    - Used by services to track who created/modified records
 *
 * DSGVO Relevance:
 * - Tracks data access patterns
 * - Documents user activity for compliance audits
 * - Supports investigation of data breaches
 * - Provides evidence for legitimate interest processing
 */

import { Request, Response, NextFunction } from 'express';
import { logAction, AuditAction } from '@/services/audit.service';
import { AuthenticatedUser } from '@/types/authorization';

// =============================================================================
// Types for Audit Field Utilities
// =============================================================================

/**
 * Audit fields shape for creating new records.
 */
export interface CreateAuditFields {
  createdBy: string | null;
  updatedBy: string | null;
}

/**
 * Audit fields shape for updating existing records.
 */
export interface UpdateAuditFields {
  updatedBy: string | null;
}

/**
 * Extended Request type with audit context.
 */
export interface AuditRequest extends Request {
  auditUserId?: string;
}

// =============================================================================
// Audit Field Utility Functions (Task Group 6.2)
// =============================================================================

/**
 * Extract the user ID from the authenticated user in the request.
 *
 * @param req - Express request object
 * @returns The user ID if authenticated, null otherwise
 */
export function getAuditUserId(req: Request): string | null {
  const user = (req as any).user as AuthenticatedUser | undefined;
  return user?.id ?? null;
}

/**
 * Get audit fields for creating a new record.
 * Both createdBy and updatedBy are set to the current user's ID.
 *
 * @param req - Express request object
 * @returns Object with createdBy and updatedBy fields
 *
 * @example
 * ```ts
 * import { getCreateAuditFields } from '@/middleware/audit.middleware';
 *
 * async function createTeamGroup(req: Request, input: CreateTeamGroupInput) {
 *   const auditFields = getCreateAuditFields(req);
 *   return prisma.teamGroup.create({
 *     data: {
 *       name: input.name,
 *       ...auditFields,
 *     },
 *   });
 * }
 * ```
 */
export function getCreateAuditFields(req: Request): CreateAuditFields {
  const userId = getAuditUserId(req);
  return {
    createdBy: userId,
    updatedBy: userId,
  };
}

/**
 * Get audit fields for updating an existing record.
 * Only updatedBy is set to the current user's ID.
 *
 * @param req - Express request object
 * @returns Object with updatedBy field
 *
 * @example
 * ```ts
 * import { getUpdateAuditFields } from '@/middleware/audit.middleware';
 *
 * async function updateTeamGroup(req: Request, id: string, input: UpdateTeamGroupInput) {
 *   const auditFields = getUpdateAuditFields(req);
 *   return prisma.teamGroup.update({
 *     where: { id },
 *     data: {
 *       name: input.name,
 *       ...auditFields,
 *     },
 *   });
 * }
 * ```
 */
export function getUpdateAuditFields(req: Request): UpdateAuditFields {
  const userId = getAuditUserId(req);
  return {
    updatedBy: userId,
  };
}

/**
 * Combined audit fields utility.
 * Returns appropriate audit fields based on whether it's a create or update operation.
 *
 * @param req - Express request object
 * @param operation - 'create' for new records, 'update' for existing records
 * @returns Audit fields appropriate for the operation
 *
 * @example
 * ```ts
 * import { getAuditFields } from '@/middleware/audit.middleware';
 *
 * // For create operations
 * const createFields = getAuditFields(req, 'create');
 * // { createdBy: 'user-id', updatedBy: 'user-id' }
 *
 * // For update operations
 * const updateFields = getAuditFields(req, 'update');
 * // { updatedBy: 'user-id' }
 * ```
 */
export function getAuditFields(
  req: Request,
  operation: 'create'
): CreateAuditFields;
export function getAuditFields(
  req: Request,
  operation: 'update'
): UpdateAuditFields;
export function getAuditFields(
  req: Request,
  operation: 'create' | 'update'
): CreateAuditFields | UpdateAuditFields {
  if (operation === 'create') {
    return getCreateAuditFields(req);
  }
  return getUpdateAuditFields(req);
}

/**
 * Middleware that attaches the audit user ID to the request object.
 * This can be used in routes where you want the audit context available
 * throughout the request lifecycle.
 *
 * @example
 * ```ts
 * import { attachAuditContext } from '@/middleware/audit.middleware';
 *
 * router.post('/team-groups', isAuthenticated, attachAuditContext, createTeamGroup);
 * ```
 */
export function attachAuditContext(
  req: AuditRequest,
  _res: Response,
  next: NextFunction
): void {
  req.auditUserId = getAuditUserId(req) ?? undefined;
  next();
}

// =============================================================================
// Request Audit Logging (DSGVO Compliance)
// =============================================================================

/**
 * Extract user ID from request (if authenticated).
 * Note: This is the internal version used by audit logging.
 */
function getUserId(req: Request): string | undefined {
  const user = (req as any).user;
  return user?.id;
}

/**
 * Extract IP address from request.
 */
function getIpAddress(req: Request): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string') {
    return forwarded.split(',')[0].trim();
  }
  return req.ip || req.socket.remoteAddress || 'unknown';
}

/**
 * Map HTTP method to audit action.
 */
function methodToAction(method: string): AuditAction {
  switch (method.toUpperCase()) {
    case 'POST':
      return AuditAction.CREATE;
    case 'PUT':
    case 'PATCH':
      return AuditAction.UPDATE;
    case 'DELETE':
      return AuditAction.DELETE;
    default:
      return AuditAction.READ;
  }
}

/**
 * Audit middleware for logging request metadata.
 *
 * STUB: Can be applied selectively to routes that process personal data.
 *
 * Usage:
 * ```ts
 * import { auditMiddleware } from '@/middleware/audit.middleware';
 *
 * // Apply to specific route
 * router.get('/employees/:id', auditMiddleware('Employee'), getEmployee);
 *
 * // Apply to all routes in router
 * router.use(auditMiddleware('ReferenceProjects'));
 * ```
 *
 * @param resource - Name of the resource being accessed
 * @returns Express middleware function
 */
export function auditMiddleware(resource: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    // Log at the end of the request
    res.on('finish', () => {
      // Only log successful requests (2xx, 3xx) to reduce noise
      if (res.statusCode >= 200 && res.statusCode < 400) {
        logAction({
          timestamp: new Date().toISOString(),
          userId: getUserId(req),
          action: methodToAction(req.method),
          resource,
          resourceId: req.params.id,
          details: {
            method: req.method,
            path: req.path,
            statusCode: res.statusCode,
            query: Object.keys(req.query).length > 0 ? req.query : undefined,
          },
          ipAddress: getIpAddress(req),
          userAgent: req.headers['user-agent'],
        });
      }
    });

    next();
  };
}

/**
 * Simplified audit middleware that only logs the request path.
 * Use for routes that don't need detailed audit logging.
 */
export function simpleAuditMiddleware(req: Request, res: Response, next: NextFunction) {
  res.on('finish', () => {
    if (res.statusCode >= 200 && res.statusCode < 400) {
      logAction({
        timestamp: new Date().toISOString(),
        userId: getUserId(req),
        action: methodToAction(req.method),
        resource: req.baseUrl || req.path,
        ipAddress: getIpAddress(req),
      });
    }
  });

  next();
}
