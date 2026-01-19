/**
 * Audit Middleware Stub
 *
 * This middleware provides request-level audit logging for DSGVO compliance.
 * It logs metadata about each request for security and compliance purposes.
 *
 * DSGVO Relevance:
 * - Tracks data access patterns
 * - Documents user activity for compliance audits
 * - Supports investigation of data breaches
 * - Provides evidence for legitimate interest processing
 *
 * NOTE: This is a STUB implementation. Enable selectively on routes that
 * process personal data. Consider privacy implications of logging.
 */

import { Request, Response, NextFunction } from 'express';
import { logAction, AuditAction } from '@/services/audit.service';

/**
 * Extract user ID from request (if authenticated).
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
