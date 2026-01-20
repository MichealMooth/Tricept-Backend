/**
 * Admin Module Configuration API Routes
 *
 * Defines routes for module configuration administration.
 * All routes require admin authentication.
 *
 * Task Group 3.5: Create API routes for admin module configuration
 *
 * Route Summary:
 * - GET    /api/admin/modules                              - List all modules with configs
 * - GET    /api/admin/modules/:moduleId                    - Get module with all team configs
 * - GET    /api/admin/team-module-config/:teamId           - Get team's module configs
 * - PUT    /api/admin/team-module-config                   - Upsert team module config
 * - DELETE /api/admin/team-module-config/:teamId/:moduleId - Delete config (reset to default)
 * - GET    /api/admin/team-module-config/:teamId/:moduleId/affected-count - Get affected record count
 * - GET    /api/admin/module-config-audit                  - Get audit trail
 */

import { Router } from 'express';
import * as adminModuleConfigController from '@/controllers/admin-module-config.controller';
import { isAuthenticated, isAdmin } from '@/middleware/auth.middleware';

const router: Router = Router();

// All admin routes require authentication and admin role
const adminAuth = [isAuthenticated, isAdmin];

// =============================================================================
// Module Configuration Routes
// =============================================================================

/**
 * GET /api/admin/modules
 * List all modules with their team configurations.
 * Access: Global Admin only
 */
router.get('/admin/modules', ...adminAuth, adminModuleConfigController.listModules);

/**
 * GET /api/admin/modules/:moduleId
 * Get a single module with all its team configurations.
 * Access: Global Admin only
 */
router.get('/admin/modules/:moduleId', ...adminAuth, adminModuleConfigController.getModule);

/**
 * GET /api/admin/team-module-config/:teamId
 * Get all module configurations for a specific team.
 * Access: Global Admin only
 */
router.get('/admin/team-module-config/:teamId', ...adminAuth, adminModuleConfigController.getTeamConfig);

/**
 * PUT /api/admin/team-module-config
 * Create or update a team module configuration.
 * Access: Global Admin only
 */
router.put('/admin/team-module-config', ...adminAuth, adminModuleConfigController.upsertConfig);

/**
 * DELETE /api/admin/team-module-config/:teamId/:moduleId
 * Delete a team module configuration (reset to module defaults).
 * Access: Global Admin only
 */
router.delete(
  '/admin/team-module-config/:teamId/:moduleId',
  ...adminAuth,
  adminModuleConfigController.deleteConfig
);

/**
 * GET /api/admin/team-module-config/:teamId/:moduleId/affected-count
 * Get count of records affected by disabling a module for a team.
 * Used for warning display before deactivation.
 * Access: Global Admin only
 */
router.get(
  '/admin/team-module-config/:teamId/:moduleId/affected-count',
  ...adminAuth,
  adminModuleConfigController.getAffectedCount
);

/**
 * GET /api/admin/module-config-audit
 * Get audit trail for module configurations.
 * Access: Global Admin only
 */
router.get('/admin/module-config-audit', ...adminAuth, adminModuleConfigController.getAuditTrail);

export default router;
