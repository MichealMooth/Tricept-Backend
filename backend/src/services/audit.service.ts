/**
 * Audit Service Stub
 *
 * This service provides infrastructure for audit logging in compliance with
 * DSGVO (Datenschutz-Grundverordnung / GDPR) requirements.
 *
 * DSGVO Requirements Overview:
 * ----------------------------
 *
 * 1. Informationspflichten (Art. 13, 14 DSGVO)
 *    - Documentation of what personal data is processed
 *    - Purpose of processing
 *    - Legal basis for processing
 *    - Data retention periods
 *
 * 2. Datenminimierung (Art. 5 Abs. 1 lit. c DSGVO)
 *    - Only collect data that is necessary for the stated purpose
 *    - Avoid collecting excessive personal information
 *    - Regular review of data necessity
 *
 * 3. Loeschrechte / Recht auf Vergessenwerden (Art. 17 DSGVO)
 *    - Users can request deletion of their personal data
 *    - Deletion must be complete across all systems
 *    - Documented audit trail of deletion requests
 *
 * 4. Auskunftsrecht (Art. 15 DSGVO)
 *    - Users can request information about their stored data
 *    - Must provide copy of processed data on request
 *
 * 5. Rechenschaftspflicht (Art. 5 Abs. 2 DSGVO)
 *    - Must be able to demonstrate compliance
 *    - Audit logs serve as evidence of compliant processing
 *
 * NOTE: This is a STUB implementation. Full DSGVO compliance requires:
 * - Legal review of data processing activities
 * - Privacy impact assessments
 * - Data protection officer involvement (if required)
 * - User consent management
 * - Data export functionality
 * - Automated data retention/deletion policies
 */

import { logger } from '@/config/logger';

/**
 * Audit action types for tracking user activities.
 */
export enum AuditAction {
  // Authentication
  LOGIN = 'LOGIN',
  LOGOUT = 'LOGOUT',
  LOGIN_FAILED = 'LOGIN_FAILED',

  // Data access
  READ = 'READ',
  SEARCH = 'SEARCH',
  EXPORT = 'EXPORT',

  // Data modification
  CREATE = 'CREATE',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',

  // DSGVO-specific actions
  DATA_EXPORT_REQUEST = 'DATA_EXPORT_REQUEST',
  DATA_DELETION_REQUEST = 'DATA_DELETION_REQUEST',
  CONSENT_GIVEN = 'CONSENT_GIVEN',
  CONSENT_WITHDRAWN = 'CONSENT_WITHDRAWN',
}

/**
 * Audit log entry structure.
 */
export interface AuditLogEntry {
  timestamp: string;
  userId?: string;
  action: AuditAction;
  resource: string;
  resourceId?: string;
  details?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Log a user action for audit purposes.
 *
 * STUB: Currently logs to Winston logger with 'audit' level.
 * In production, this should write to a dedicated audit log storage
 * (database table, separate log file, or audit service).
 *
 * @param entry - Audit log entry data
 */
export function logAction(entry: AuditLogEntry): void {
  logger.info('[AUDIT]', {
    ...entry,
    timestamp: entry.timestamp || new Date().toISOString(),
    type: 'audit',
  });
}

/**
 * Log data access for DSGVO compliance tracking.
 *
 * @param userId - ID of user accessing the data
 * @param resource - Type of resource being accessed
 * @param resourceId - Optional ID of specific resource
 * @param details - Additional context
 */
export function logDataAccess(
  userId: string,
  resource: string,
  resourceId?: string,
  details?: Record<string, unknown>
): void {
  logAction({
    timestamp: new Date().toISOString(),
    userId,
    action: AuditAction.READ,
    resource,
    resourceId,
    details,
  });
}

/**
 * Log data modification for DSGVO compliance tracking.
 *
 * @param userId - ID of user modifying the data
 * @param action - Type of modification (CREATE, UPDATE, DELETE)
 * @param resource - Type of resource being modified
 * @param resourceId - ID of specific resource
 * @param details - Additional context (e.g., changed fields)
 */
export function logDataModification(
  userId: string,
  action: AuditAction.CREATE | AuditAction.UPDATE | AuditAction.DELETE,
  resource: string,
  resourceId: string,
  details?: Record<string, unknown>
): void {
  logAction({
    timestamp: new Date().toISOString(),
    userId,
    action,
    resource,
    resourceId,
    details,
  });
}

/**
 * Log a DSGVO data subject request.
 *
 * @param userId - ID of user making the request
 * @param requestType - Type of DSGVO request
 * @param details - Additional context
 */
export function logDsgvoRequest(
  userId: string,
  requestType: AuditAction.DATA_EXPORT_REQUEST | AuditAction.DATA_DELETION_REQUEST,
  details?: Record<string, unknown>
): void {
  logAction({
    timestamp: new Date().toISOString(),
    userId,
    action: requestType,
    resource: 'USER_DATA',
    resourceId: userId,
    details,
  });
}
