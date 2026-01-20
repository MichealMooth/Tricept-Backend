/**
 * Effective Modules Controller
 *
 * Handles HTTP requests for user's effective modules.
 *
 * Task Group 4.4: Create controller for effective modules
 */

import { Request, Response } from 'express';
import * as effectiveModulesService from '@/services/effective-modules.service';
import type { AuthenticatedUser } from '@/types/authorization';
import { env } from '@/config/env';

/**
 * Helper to extract authenticated user from request.
 * In test environment, allows passing userId as query parameter for testing.
 */
function getUser(req: Request): AuthenticatedUser | undefined {
  const user = (req as any).user;
  if (user) return user;

  // In test environment, allow userId query parameter for testing
  if (env.nodeEnv === 'test' && req.query.userId) {
    return {
      id: req.query.userId as string,
      email: 'test@test.com',
      firstName: 'Test',
      lastName: 'User',
      isAdmin: false,
    };
  }

  return undefined;
}

/**
 * Get effective modules for the authenticated user.
 *
 * GET /api/user/effective-modules
 */
export async function getEffectiveModules(req: Request, res: Response): Promise<Response> {
  const user = getUser(req);

  if (!user) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const result = await effectiveModulesService.getEffectiveModules(user.id);

  return res.json(result);
}

/**
 * Check if the authenticated user has access to a specific module.
 *
 * GET /api/user/effective-modules/:moduleId/access
 */
export async function checkModuleAccess(req: Request, res: Response): Promise<Response> {
  const user = getUser(req);
  const { moduleId } = req.params;

  if (!user) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const hasAccess = await effectiveModulesService.hasModuleAccess(user.id, moduleId);
  const effectiveScope = await effectiveModulesService.getEffectiveScope(user.id, moduleId);

  return res.json({
    moduleId,
    hasAccess,
    effectiveScope,
  });
}
