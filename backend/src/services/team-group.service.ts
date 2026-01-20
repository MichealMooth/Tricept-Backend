/**
 * Team Group Service
 *
 * Provides CRUD operations for TeamGroup entities using Prisma ORM.
 * Includes audit field population (createdBy, updatedBy).
 *
 * Task Group 4.3: Create TeamGroupService
 * Task Group 1: Add search parameter and members listing
 */

import { prisma } from '@/config/database';
import type { TeamGroup, TeamMembership, Prisma } from '@prisma/client';
import type { TeamRole } from '@/types/authorization';

// =============================================================================
// Types
// =============================================================================

/**
 * Input for creating a new TeamGroup.
 */
export interface CreateTeamGroupInput {
  name: string;
  description?: string | null;
  createdBy?: string;
}

/**
 * Input for updating an existing TeamGroup.
 */
export interface UpdateTeamGroupInput {
  name?: string;
  description?: string | null;
  isActive?: boolean;
  updatedBy?: string;
}

/**
 * TeamGroup with membership count.
 */
export interface TeamGroupWithMemberCount extends TeamGroup {
  memberCount: number;
}

/**
 * TeamGroup with full membership details.
 */
export interface TeamGroupWithMembers extends TeamGroup {
  memberships: Array<{
    id: string;
    employeeId: string;
    role: string;
    employee: {
      id: string;
      firstName: string;
      lastName: string;
      email: string;
    };
  }>;
}

/**
 * Team member with employee details.
 */
export interface TeamMemberWithEmployee {
  id: string;
  employeeId: string;
  role: string;
  createdAt: Date;
  employee: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
}

/**
 * Query parameters for listing TeamGroups.
 */
export interface ListTeamGroupsParams {
  search?: string;
  includeInactive?: boolean;
  page?: number;
  pageSize?: number;
}

/**
 * Query parameters for listing team members.
 */
export interface ListTeamMembersParams {
  search?: string;
  page?: number;
  pageSize?: number;
}

// =============================================================================
// Service Functions
// =============================================================================

/**
 * Create a new TeamGroup.
 *
 * @param input - TeamGroup creation data
 * @returns The created TeamGroup
 */
export async function create(input: CreateTeamGroupInput): Promise<TeamGroup> {
  const teamGroup = await prisma.teamGroup.create({
    data: {
      name: input.name,
      description: input.description ?? null,
      isActive: true,
      createdBy: input.createdBy ?? null,
      updatedBy: input.createdBy ?? null,
    },
  });

  return teamGroup;
}

/**
 * Update an existing TeamGroup.
 *
 * @param id - TeamGroup ID
 * @param input - Update data
 * @returns The updated TeamGroup or null if not found
 */
export async function update(
  id: string,
  input: UpdateTeamGroupInput
): Promise<TeamGroup | null> {
  // Check if team group exists
  const existing = await prisma.teamGroup.findUnique({ where: { id } });
  if (!existing) {
    return null;
  }

  const updateData: Prisma.TeamGroupUpdateInput = {};

  if (input.name !== undefined) {
    updateData.name = input.name;
  }
  if (input.description !== undefined) {
    updateData.description = input.description;
  }
  if (input.isActive !== undefined) {
    updateData.isActive = input.isActive;
  }
  if (input.updatedBy !== undefined) {
    updateData.updatedBy = input.updatedBy;
  }

  const teamGroup = await prisma.teamGroup.update({
    where: { id },
    data: updateData,
  });

  return teamGroup;
}

/**
 * Delete a TeamGroup by ID.
 * Note: Due to cascade delete, all memberships will also be deleted.
 *
 * @param id - TeamGroup ID
 * @returns true if deleted, false if not found
 */
export async function remove(id: string): Promise<boolean> {
  try {
    await prisma.teamGroup.delete({ where: { id } });
    return true;
  } catch {
    // Record not found or other error
    return false;
  }
}

/**
 * Get a TeamGroup by ID.
 *
 * @param id - TeamGroup ID
 * @returns The TeamGroup or null if not found
 */
export async function getById(id: string): Promise<TeamGroup | null> {
  return prisma.teamGroup.findUnique({ where: { id } });
}

/**
 * Get a TeamGroup by ID with full membership details.
 *
 * @param id - TeamGroup ID
 * @returns The TeamGroup with members or null if not found
 */
export async function getByIdWithMembers(id: string): Promise<TeamGroupWithMembers | null> {
  const teamGroup = await prisma.teamGroup.findUnique({
    where: { id },
    include: {
      memberships: {
        include: {
          employee: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
        orderBy: { createdAt: 'asc' },
      },
    },
  });

  return teamGroup;
}

/**
 * Get all TeamGroups with pagination, filtering, and search.
 *
 * Note: For search, we use `contains` without `mode` for SQLite compatibility.
 * The search matches both uppercase and lowercase by using dual conditions.
 *
 * @param params - Query parameters
 * @returns Paginated list of TeamGroups
 */
export async function getAll(params: ListTeamGroupsParams = {}): Promise<{
  items: TeamGroupWithMemberCount[];
  total: number;
  page: number;
  pageSize: number;
}> {
  const page = Math.max(1, params.page ?? 1);
  const pageSize = Math.max(1, Math.min(100, params.pageSize ?? 20));
  const skip = (page - 1) * pageSize;

  // Build where clause
  const where: Prisma.TeamGroupWhereInput = {};

  if (!params.includeInactive) {
    where.isActive = true;
  }

  // Add search filter (SQLite-compatible case-insensitive partial match on name)
  // Use OR with lowercase and original search term for basic case-insensitivity
  if (params.search) {
    const searchLower = params.search.toLowerCase();
    const searchUpper = params.search.toUpperCase();
    const searchCapitalized =
      params.search.charAt(0).toUpperCase() + params.search.slice(1).toLowerCase();

    where.OR = [
      { name: { contains: params.search } },
      { name: { contains: searchLower } },
      { name: { contains: searchUpper } },
      { name: { contains: searchCapitalized } },
    ];
  }

  // Execute count and fetch in parallel
  const [total, teamGroups] = await Promise.all([
    prisma.teamGroup.count({ where }),
    prisma.teamGroup.findMany({
      where,
      skip,
      take: pageSize,
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: { memberships: true },
        },
      },
    }),
  ]);

  // Transform to include memberCount
  const items: TeamGroupWithMemberCount[] = teamGroups.map((tg) => ({
    id: tg.id,
    name: tg.name,
    description: tg.description,
    isActive: tg.isActive,
    createdAt: tg.createdAt,
    updatedAt: tg.updatedAt,
    createdBy: tg.createdBy,
    updatedBy: tg.updatedBy,
    memberCount: tg._count.memberships,
  }));

  return {
    items,
    total,
    page,
    pageSize,
  };
}

/**
 * Get paginated list of members for a TeamGroup with search support.
 *
 * Note: For search, we use `contains` without `mode` for SQLite compatibility.
 *
 * @param teamGroupId - TeamGroup ID
 * @param params - Query parameters (search, page, pageSize)
 * @returns Paginated list of team members with employee details, or null if team not found
 */
export async function getMembersPaginated(
  teamGroupId: string,
  params: ListTeamMembersParams = {}
): Promise<{
  items: TeamMemberWithEmployee[];
  total: number;
  page: number;
  pageSize: number;
} | null> {
  // First check if team exists
  const teamExists = await prisma.teamGroup.findUnique({
    where: { id: teamGroupId },
    select: { id: true },
  });

  if (!teamExists) {
    return null;
  }

  const page = Math.max(1, params.page ?? 1);
  const pageSize = Math.max(1, Math.min(100, params.pageSize ?? 20));
  const skip = (page - 1) * pageSize;

  // Build where clause for memberships
  const where: Prisma.TeamMembershipWhereInput = {
    teamGroupId,
  };

  // Add search filter (SQLite-compatible case-insensitive partial match on employee name or email)
  if (params.search) {
    const searchLower = params.search.toLowerCase();
    const searchUpper = params.search.toUpperCase();
    const searchCapitalized =
      params.search.charAt(0).toUpperCase() + params.search.slice(1).toLowerCase();

    where.employee = {
      OR: [
        { firstName: { contains: params.search } },
        { firstName: { contains: searchLower } },
        { firstName: { contains: searchCapitalized } },
        { lastName: { contains: params.search } },
        { lastName: { contains: searchLower } },
        { lastName: { contains: searchCapitalized } },
        { email: { contains: params.search } },
        { email: { contains: searchLower } },
        { email: { contains: searchUpper } },
      ],
    };
  }

  // Execute count and fetch in parallel
  const [total, memberships] = await Promise.all([
    prisma.teamMembership.count({ where }),
    prisma.teamMembership.findMany({
      where,
      skip,
      take: pageSize,
      orderBy: [{ role: 'asc' }, { createdAt: 'asc' }],
      include: {
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    }),
  ]);

  // Transform to match expected structure
  const items: TeamMemberWithEmployee[] = memberships.map((m) => ({
    id: m.id,
    employeeId: m.employeeId,
    role: m.role,
    createdAt: m.createdAt,
    employee: m.employee,
  }));

  return {
    items,
    total,
    page,
    pageSize,
  };
}

/**
 * Get all TeamGroups for a specific user.
 *
 * @param userId - Employee/User ID
 * @returns List of TeamGroups the user belongs to with their role
 */
export async function getByUserId(userId: string): Promise<
  Array<{
    teamGroup: TeamGroup;
    role: TeamRole;
    membershipId: string;
  }>
> {
  const memberships = await prisma.teamMembership.findMany({
    where: {
      employeeId: userId,
      teamGroup: {
        isActive: true,
      },
    },
    include: {
      teamGroup: true,
    },
    orderBy: {
      teamGroup: { name: 'asc' },
    },
  });

  return memberships.map((m) => ({
    teamGroup: m.teamGroup,
    role: m.role as TeamRole,
    membershipId: m.id,
  }));
}

// =============================================================================
// Membership Operations
// =============================================================================

/**
 * Add a member to a TeamGroup.
 *
 * @param teamGroupId - TeamGroup ID
 * @param employeeId - Employee ID to add
 * @param role - Role to assign
 * @param createdBy - ID of user creating the membership
 * @returns The created TeamMembership
 */
export async function addMember(
  teamGroupId: string,
  employeeId: string,
  role: TeamRole,
  createdBy?: string
): Promise<TeamMembership> {
  const membership = await prisma.teamMembership.create({
    data: {
      teamGroupId,
      employeeId,
      role,
      createdBy: createdBy ?? null,
      updatedBy: createdBy ?? null,
    },
  });

  return membership;
}

/**
 * Update a member's role in a TeamGroup.
 *
 * @param membershipId - TeamMembership ID
 * @param role - New role to assign
 * @param updatedBy - ID of user updating the membership
 * @returns The updated TeamMembership or null if not found
 */
export async function updateMemberRole(
  membershipId: string,
  role: TeamRole,
  updatedBy?: string
): Promise<TeamMembership | null> {
  try {
    const membership = await prisma.teamMembership.update({
      where: { id: membershipId },
      data: {
        role,
        updatedBy: updatedBy ?? null,
      },
    });
    return membership;
  } catch {
    return null;
  }
}

/**
 * Remove a member from a TeamGroup.
 *
 * @param membershipId - TeamMembership ID
 * @returns true if deleted, false if not found
 */
export async function removeMember(membershipId: string): Promise<boolean> {
  try {
    await prisma.teamMembership.delete({ where: { id: membershipId } });
    return true;
  } catch {
    return false;
  }
}

/**
 * Get a TeamMembership by ID.
 *
 * @param membershipId - TeamMembership ID
 * @returns The TeamMembership or null if not found
 */
export async function getMembershipById(membershipId: string): Promise<TeamMembership | null> {
  return prisma.teamMembership.findUnique({ where: { id: membershipId } });
}

/**
 * Get a TeamMembership by ID with team group details.
 *
 * @param membershipId - TeamMembership ID
 * @returns The TeamMembership with team group or null if not found
 */
export async function getMembershipWithTeam(
  membershipId: string
): Promise<(TeamMembership & { teamGroup: TeamGroup }) | null> {
  return prisma.teamMembership.findUnique({
    where: { id: membershipId },
    include: { teamGroup: true },
  });
}

/**
 * Check if an employee is already a member of a TeamGroup.
 *
 * @param teamGroupId - TeamGroup ID
 * @param employeeId - Employee ID
 * @returns true if already a member, false otherwise
 */
export async function isMember(teamGroupId: string, employeeId: string): Promise<boolean> {
  const count = await prisma.teamMembership.count({
    where: {
      teamGroupId,
      employeeId,
    },
  });
  return count > 0;
}
