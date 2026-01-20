/**
 * Team Membership Service
 *
 * Provides functions to query user roles within TeamGroups.
 * Used by authorization middleware for TEAM scope permission checks.
 */

import { prisma } from '@/config/database';
import { TeamRole } from '@/types/authorization';

/**
 * TeamMembership with related data.
 */
export interface TeamMembershipWithTeam {
  id: string;
  employeeId: string;
  teamGroupId: string;
  role: TeamRole;
  teamGroup: {
    id: string;
    name: string;
    isActive: boolean;
  };
}

/**
 * Get a user's role in a specific TeamGroup.
 *
 * @param userId - The employee/user ID
 * @param teamGroupId - The TeamGroup ID
 * @returns The user's role in the TeamGroup, or null if not a member
 */
export async function getUserRoleInTeam(
  userId: string,
  teamGroupId: string
): Promise<TeamRole | null> {
  const membership = await prisma.teamMembership.findUnique({
    where: {
      employeeId_teamGroupId: {
        employeeId: userId,
        teamGroupId: teamGroupId,
      },
    },
    select: {
      role: true,
    },
  });

  if (!membership) {
    return null;
  }

  // Validate that the role is a valid TeamRole
  const validRoles: TeamRole[] = ['OWNER', 'ADMIN', 'EDITOR', 'VIEWER', 'USER'];
  if (!validRoles.includes(membership.role as TeamRole)) {
    return null;
  }

  return membership.role as TeamRole;
}

/**
 * Get all TeamGroups a user belongs to with their roles.
 *
 * @param userId - The employee/user ID
 * @returns Array of TeamMemberships with related TeamGroup data
 */
export async function getUserTeamGroups(userId: string): Promise<TeamMembershipWithTeam[]> {
  const memberships = await prisma.teamMembership.findMany({
    where: {
      employeeId: userId,
      teamGroup: {
        isActive: true,
      },
    },
    select: {
      id: true,
      employeeId: true,
      teamGroupId: true,
      role: true,
      teamGroup: {
        select: {
          id: true,
          name: true,
          isActive: true,
        },
      },
    },
  });

  return memberships.map((m) => ({
    id: m.id,
    employeeId: m.employeeId,
    teamGroupId: m.teamGroupId,
    role: m.role as TeamRole,
    teamGroup: m.teamGroup,
  }));
}

/**
 * Get all TeamGroup IDs a user belongs to.
 * Useful for filtering data by user's teams.
 *
 * @param userId - The employee/user ID
 * @returns Array of TeamGroup IDs
 */
export async function getUserTeamGroupIds(userId: string): Promise<string[]> {
  const memberships = await prisma.teamMembership.findMany({
    where: {
      employeeId: userId,
      teamGroup: {
        isActive: true,
      },
    },
    select: {
      teamGroupId: true,
    },
  });

  return memberships.map((m) => m.teamGroupId);
}

/**
 * Check if a user is a member of a specific TeamGroup.
 *
 * @param userId - The employee/user ID
 * @param teamGroupId - The TeamGroup ID
 * @returns true if user is a member, false otherwise
 */
export async function isUserMemberOfTeam(userId: string, teamGroupId: string): Promise<boolean> {
  const count = await prisma.teamMembership.count({
    where: {
      employeeId: userId,
      teamGroupId: teamGroupId,
    },
  });

  return count > 0;
}
