/**
 * Effective Modules API Routes
 *
 * Defines routes for user's effective module access.
 * All routes require authentication (but not admin).
 *
 * Task Group 4.4: Create routes for effective modules
 *
 * Route Summary:
 * - GET /api/user/effective-modules              - Get user's accessible modules
 * - GET /api/user/effective-modules/:moduleId/access - Check access to specific module
 */

import { Router } from 'express';
import * as effectiveModulesController from '@/controllers/effective-modules.controller';
import { isAuthenticated } from '@/middleware/auth.middleware';

const router: Router = Router();

/**
 * GET /api/user/effective-modules
 * Get the authenticated user's effective modules.
 * Includes visibility, scope, and role information for each module.
 * Access: All authenticated users
 */
router.get('/user/effective-modules', isAuthenticated, effectiveModulesController.getEffectiveModules);

/**
 * GET /api/user/effective-modules/:moduleId/access
 * Check if the authenticated user has access to a specific module.
 * Returns access status and effective scope.
 * Access: All authenticated users
 */
router.get(
  '/user/effective-modules/:moduleId/access',
  isAuthenticated,
  effectiveModulesController.checkModuleAccess
);

export default router;
