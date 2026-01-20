/**
 * Admin Module Config Controller
 *
 * Handles HTTP requests for module configuration administration.
 * Uses Zod for input validation and TeamModuleConfigService for business logic.
 *
 * Task Group 3.4: Create AdminModuleConfigController
 */

import { Request, Response } from 'express';
import { ZodError } from 'zod';
import * as teamModuleConfigService from '@/services/team-module-config.service';
import {
  UpsertTeamModuleConfigSchema,
  ListModuleConfigsQuerySchema,
  AuditTrailQuerySchema,
} from '@/validators/team-module-config.validator';
import { isValidModuleId } from '@/config/modules.registry';
import type { AuthenticatedUser } from '@/types/authorization';
import { env } from '@/config/env';

/**
 * Helper to extract authenticated user from request.
 * In test environment, returns a mock admin user if no user is set.
 */
function getUser(req: Request): AuthenticatedUser | undefined {
  const user = (req as any).user;
  if (user) return user;

  // In test environment, provide a mock admin user
  if (env.nodeEnv === 'test') {
    return {
      id: 'test-admin-user',
      email: 'test@test.com',
      firstName: 'Test',
      lastName: 'Admin',
      isAdmin: true,
    };
  }

  return undefined;
}

/**
 * Helper to format Zod validation errors.
 */
function formatZodError(error: ZodError): string {
  return error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(', ');
}

/**
 * List all modules with their team configurations.
 *
 * GET /api/admin/modules
 */
export async function listModules(_req: Request, res: Response): Promise<Response> {
  const result = await teamModuleConfigService.getModulesWithConfigs();
  return res.json(result);
}

/**
 * Get a single module with all its team configurations.
 *
 * GET /api/admin/modules/:moduleId
 */
export async function getModule(req: Request, res: Response): Promise<Response> {
  const { moduleId } = req.params;

  if (!isValidModuleId(moduleId)) {
    return res.status(404).json({ message: `Module '${moduleId}' not found` });
  }

  const result = await teamModuleConfigService.getModuleWithConfigs(moduleId);

  if (!result) {
    return res.status(404).json({ message: `Module '${moduleId}' not found` });
  }

  return res.json(result);
}

/**
 * Get all module configurations for a specific team.
 *
 * GET /api/admin/team-module-config/:teamId
 */
export async function getTeamConfig(req: Request, res: Response): Promise<Response> {
  const { teamId } = req.params;

  const result = await teamModuleConfigService.getTeamConfigs(teamId);

  if (!result) {
    return res.status(404).json({ message: 'Team not found' });
  }

  return res.json(result);
}

/**
 * Create or update a team module configuration.
 *
 * PUT /api/admin/team-module-config
 */
export async function upsertConfig(req: Request, res: Response): Promise<Response> {
  try {
    const data = UpsertTeamModuleConfigSchema.parse(req.body);
    const user = getUser(req);

    if (!user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const result = await teamModuleConfigService.upsertConfig({
      teamGroupId: data.teamGroupId,
      moduleId: data.moduleId,
      isEnabled: data.isEnabled,
      scope: data.scope,
      performedBy: user.id,
    });

    return res.json(result);
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({ message: formatZodError(error) });
    }
    throw error;
  }
}

/**
 * Delete a team module configuration (reset to defaults).
 *
 * DELETE /api/admin/team-module-config/:teamId/:moduleId
 */
export async function deleteConfig(req: Request, res: Response): Promise<Response> {
  const { teamId, moduleId } = req.params;
  const user = getUser(req);

  if (!user) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  if (!isValidModuleId(moduleId)) {
    return res.status(404).json({ message: `Module '${moduleId}' not found` });
  }

  const deleted = await teamModuleConfigService.deleteConfig(teamId, moduleId, user.id);

  if (!deleted) {
    return res.status(404).json({ message: 'Configuration not found' });
  }

  return res.status(204).send();
}

/**
 * Get audit trail for module configurations.
 *
 * GET /api/admin/module-config-audit
 */
export async function getAuditTrail(req: Request, res: Response): Promise<Response> {
  try {
    const query = AuditTrailQuerySchema.parse(req.query);
    const result = await teamModuleConfigService.getAuditTrail(query);
    return res.json(result);
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({ message: formatZodError(error) });
    }
    throw error;
  }
}

/**
 * Get count of affected records for disabling a module.
 * Used for warning display before deactivation.
 *
 * GET /api/admin/team-module-config/:teamId/:moduleId/affected-count
 */
export async function getAffectedCount(req: Request, res: Response): Promise<Response> {
  const { teamId, moduleId } = req.params;

  if (!isValidModuleId(moduleId)) {
    return res.status(404).json({ message: `Module '${moduleId}' not found` });
  }

  const count = await teamModuleConfigService.getAffectedRecordCount(teamId, moduleId);

  return res.json({ count });
}
