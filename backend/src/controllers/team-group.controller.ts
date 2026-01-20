/**
 * Team Group Controller
 *
 * Handles HTTP requests for TeamGroup CRUD operations.
 * Uses Zod for input validation and TeamGroupService for business logic.
 *
 * Task Group 4.4: Create TeamGroupController
 * Task Group 1: Add listMembers endpoint and search support
 */

import { Request, Response } from 'express';
import { ZodError } from 'zod';
import * as teamGroupService from '@/services/team-group.service';
import {
  CreateTeamGroupSchema,
  UpdateTeamGroupSchema,
  ListTeamGroupsQuerySchema,
  ListTeamMembersQuerySchema,
  IdParamSchema,
} from '@/validators/team-group.validator';
import type { AuthenticatedUser } from '@/types/authorization';

/**
 * Helper to extract authenticated user from request.
 */
function getUser(req: Request): AuthenticatedUser | undefined {
  return (req as any).user;
}

/**
 * Helper to format Zod validation errors.
 */
function formatZodError(error: ZodError): string {
  return error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(', ');
}

/**
 * List all TeamGroups with pagination and search.
 *
 * GET /api/teams
 * Query params: search, page, pageSize, includeInactive
 */
export async function list(req: Request, res: Response): Promise<Response> {
  try {
    const query = ListTeamGroupsQuerySchema.parse(req.query);
    const result = await teamGroupService.getAll(query);
    return res.json(result);
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({ message: formatZodError(error) });
    }
    throw error;
  }
}

/**
 * Get a single TeamGroup by ID.
 *
 * GET /api/teams/:id
 */
export async function getOne(req: Request, res: Response): Promise<Response> {
  try {
    const { id } = IdParamSchema.parse(req.params);
    const teamGroup = await teamGroupService.getByIdWithMembers(id);

    if (!teamGroup) {
      return res.status(404).json({ message: 'Team group not found' });
    }

    return res.json(teamGroup);
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({ message: formatZodError(error) });
    }
    throw error;
  }
}

/**
 * Create a new TeamGroup.
 *
 * POST /api/teams
 */
export async function create(req: Request, res: Response): Promise<Response> {
  try {
    const data = CreateTeamGroupSchema.parse(req.body);
    const user = getUser(req);

    const teamGroup = await teamGroupService.create({
      name: data.name,
      description: data.description,
      createdBy: user?.id,
    });

    return res.status(201).json(teamGroup);
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({ message: formatZodError(error) });
    }
    throw error;
  }
}

/**
 * Update an existing TeamGroup (full or partial update).
 *
 * PUT /api/teams/:id
 * PATCH /api/teams/:id (for soft-delete via isActive=false)
 */
export async function update(req: Request, res: Response): Promise<Response> {
  try {
    const { id } = IdParamSchema.parse(req.params);
    const data = UpdateTeamGroupSchema.parse(req.body);
    const user = getUser(req);

    const teamGroup = await teamGroupService.update(id, {
      ...data,
      updatedBy: user?.id,
    });

    if (!teamGroup) {
      return res.status(404).json({ message: 'Team group not found' });
    }

    return res.json(teamGroup);
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({ message: formatZodError(error) });
    }
    throw error;
  }
}

/**
 * Delete a TeamGroup (hard delete).
 *
 * DELETE /api/teams/:id
 */
export async function remove(req: Request, res: Response): Promise<Response> {
  try {
    const { id } = IdParamSchema.parse(req.params);
    const deleted = await teamGroupService.remove(id);

    if (!deleted) {
      return res.status(404).json({ message: 'Team group not found' });
    }

    return res.status(204).send();
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({ message: formatZodError(error) });
    }
    throw error;
  }
}

/**
 * Get user's TeamGroups (teams they belong to).
 *
 * GET /api/teams/my-teams
 */
export async function getMyTeams(req: Request, res: Response): Promise<Response> {
  const user = getUser(req);

  if (!user) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const teams = await teamGroupService.getByUserId(user.id);
  return res.json(teams);
}

/**
 * Get paginated list of members for a TeamGroup.
 *
 * GET /api/teams/:id/members
 * Query params: search, page, pageSize
 */
export async function listMembers(req: Request, res: Response): Promise<Response> {
  try {
    const { id } = IdParamSchema.parse(req.params);
    const query = ListTeamMembersQuerySchema.parse(req.query);

    const result = await teamGroupService.getMembersPaginated(id, query);

    if (!result) {
      return res.status(404).json({ message: 'Team group not found' });
    }

    return res.json(result);
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({ message: formatZodError(error) });
    }
    throw error;
  }
}
