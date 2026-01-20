/**
 * Team Membership Controller
 *
 * Handles HTTP requests for TeamMembership operations (add, update, remove members).
 * Uses Zod for input validation and TeamGroupService for business logic.
 *
 * Task Group 4.5: Create TeamMembershipController
 */

import { Request, Response } from 'express';
import { ZodError } from 'zod';
import * as teamGroupService from '@/services/team-group.service';
import {
  CreateTeamMembershipSchema,
  UpdateTeamMembershipSchema,
  IdParamSchema,
} from '@/validators/team-group.validator';
import type { AuthenticatedUser } from '@/types/authorization';
import type { TeamRole } from '@/types/authorization';

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
 * Add a member to a TeamGroup.
 *
 * POST /api/team-groups/:id/members
 */
export async function addMember(req: Request, res: Response): Promise<Response> {
  try {
    const { id: teamGroupId } = IdParamSchema.parse(req.params);
    const data = CreateTeamMembershipSchema.parse(req.body);
    const user = getUser(req);

    // Check if team group exists
    const teamGroup = await teamGroupService.getById(teamGroupId);
    if (!teamGroup) {
      return res.status(404).json({ message: 'Team group not found' });
    }

    // Check if employee is already a member
    const alreadyMember = await teamGroupService.isMember(teamGroupId, data.employeeId);
    if (alreadyMember) {
      return res.status(409).json({ message: 'Employee is already a member of this team' });
    }

    const membership = await teamGroupService.addMember(
      teamGroupId,
      data.employeeId,
      data.role as TeamRole,
      user?.id
    );

    return res.status(201).json(membership);
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({ message: formatZodError(error) });
    }
    // Handle Prisma unique constraint violation
    if ((error as any)?.code === 'P2002') {
      return res.status(409).json({ message: 'Employee is already a member of this team' });
    }
    // Handle Prisma foreign key constraint violation (invalid employeeId)
    if ((error as any)?.code === 'P2003') {
      return res.status(400).json({ message: 'Invalid employee ID' });
    }
    throw error;
  }
}

/**
 * Update a member's role in a TeamGroup.
 *
 * PUT /api/team-memberships/:id
 */
export async function updateMember(req: Request, res: Response): Promise<Response> {
  try {
    const { id: membershipId } = IdParamSchema.parse(req.params);
    const data = UpdateTeamMembershipSchema.parse(req.body);
    const user = getUser(req);

    const membership = await teamGroupService.updateMemberRole(
      membershipId,
      data.role as TeamRole,
      user?.id
    );

    if (!membership) {
      return res.status(404).json({ message: 'Membership not found' });
    }

    return res.json(membership);
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({ message: formatZodError(error) });
    }
    throw error;
  }
}

/**
 * Remove a member from a TeamGroup.
 *
 * DELETE /api/team-memberships/:id
 */
export async function removeMember(req: Request, res: Response): Promise<Response> {
  try {
    const { id: membershipId } = IdParamSchema.parse(req.params);

    const deleted = await teamGroupService.removeMember(membershipId);

    if (!deleted) {
      return res.status(404).json({ message: 'Membership not found' });
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
 * Get a single membership by ID.
 *
 * GET /api/team-memberships/:id
 */
export async function getMembership(req: Request, res: Response): Promise<Response> {
  try {
    const { id: membershipId } = IdParamSchema.parse(req.params);

    const membership = await teamGroupService.getMembershipWithTeam(membershipId);

    if (!membership) {
      return res.status(404).json({ message: 'Membership not found' });
    }

    return res.json(membership);
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({ message: formatZodError(error) });
    }
    throw error;
  }
}
