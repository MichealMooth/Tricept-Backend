/**
 * Team Types
 *
 * TypeScript types for Team (TeamGroup) and TeamMembership entities.
 * Matches backend API response structures from team-group.service.ts.
 */

/**
 * Team role values.
 * Matches backend TeamRole type from @/types/authorization.
 */
export type TeamRole = 'OWNER' | 'ADMIN' | 'EDITOR' | 'VIEWER' | 'USER';

/**
 * Team roles available in the admin UI.
 * Excludes USER role as per spec requirements.
 */
export const ADMIN_TEAM_ROLES: TeamRole[] = ['OWNER', 'ADMIN', 'EDITOR', 'VIEWER'];

/**
 * Base Team entity.
 * Matches TeamGroup model from Prisma schema.
 */
export interface Team {
  id: string;
  name: string;
  description: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy: string | null;
  updatedBy: string | null;
}

/**
 * Team with member count.
 * Returned by list endpoint.
 */
export interface TeamWithMemberCount extends Team {
  memberCount: number;
}

/**
 * Employee info embedded in team membership responses.
 */
export interface TeamMemberEmployee {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

/**
 * Team member with employee details.
 * Returned by members endpoint.
 */
export interface TeamMember {
  id: string;
  employeeId: string;
  role: TeamRole;
  createdAt: string;
  employee: TeamMemberEmployee;
}

/**
 * Team membership entity.
 * Represents the relationship between an employee and a team.
 */
export interface TeamMembership {
  id: string;
  employeeId: string;
  teamGroupId: string;
  role: TeamRole;
  createdAt: string;
  updatedAt: string;
  createdBy: string | null;
  updatedBy: string | null;
}

/**
 * Team with full membership details.
 * Returned by getOne endpoint with members included.
 */
export interface TeamWithMembers extends Team {
  memberships: Array<{
    id: string;
    employeeId: string;
    role: TeamRole;
    employee: TeamMemberEmployee;
  }>;
}

/**
 * Query parameters for listing teams.
 */
export interface ListTeamsParams {
  search?: string;
  page?: number;
  pageSize?: number;
  includeInactive?: boolean;
}

/**
 * Query parameters for listing team members.
 */
export interface ListTeamMembersParams {
  search?: string;
  page?: number;
  pageSize?: number;
}

/**
 * Paginated response for team list.
 */
export interface PaginatedTeamResponse {
  items: TeamWithMemberCount[];
  total: number;
  page: number;
  pageSize: number;
}

/**
 * Paginated response for team members list.
 */
export interface PaginatedMemberResponse {
  items: TeamMember[];
  total: number;
  page: number;
  pageSize: number;
}

/**
 * Input for creating a new team.
 */
export interface CreateTeamInput {
  name: string;
  description?: string | null;
}

/**
 * Input for updating a team.
 */
export interface UpdateTeamInput {
  name?: string;
  description?: string | null;
  isActive?: boolean;
}

/**
 * Input for adding a member to a team.
 */
export interface AddTeamMemberInput {
  employeeId: string;
  role: TeamRole;
}

/**
 * Input for updating a member's role.
 */
export interface UpdateMemberRoleInput {
  role: TeamRole;
}
