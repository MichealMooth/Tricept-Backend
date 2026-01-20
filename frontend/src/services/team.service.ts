/**
 * Team Service
 *
 * API service for Team (TeamGroup) and TeamMembership management.
 * Implements CRUD operations for teams and membership management.
 *
 * Task Group 2: Team Service und Types
 */

import { api } from './api';
import type {
  Team,
  TeamWithMemberCount,
  TeamMember,
  TeamMembership,
  ListTeamsParams,
  ListTeamMembersParams,
  PaginatedTeamResponse,
  PaginatedMemberResponse,
  CreateTeamInput,
  UpdateTeamInput,
  AddTeamMemberInput,
  TeamRole,
} from '@/types/team';

/**
 * Helper to get CSRF token for mutating requests.
 * Note: The axios interceptor in api.ts handles this automatically,
 * but we keep this for explicit control when needed.
 */
async function getCsrfToken(): Promise<string> {
  const res = await api.get('/auth/csrf');
  return res.data?.csrfToken;
}

// =============================================================================
// Team CRUD Operations
// =============================================================================

/**
 * List all teams with pagination and search.
 *
 * @param params - Query parameters (search, page, pageSize, includeInactive)
 * @returns Paginated list of teams with member counts
 */
export async function listTeams(params?: ListTeamsParams): Promise<PaginatedTeamResponse> {
  const { data } = await api.get<PaginatedTeamResponse>('/teams', { params });
  return data;
}

/**
 * Get a single team by ID.
 *
 * @param teamId - Team ID
 * @returns Team details
 */
export async function getTeam(teamId: string): Promise<Team> {
  const { data } = await api.get<Team>(`/teams/${teamId}`);
  return data;
}

/**
 * Create a new team.
 * Requires Global Admin privileges.
 *
 * @param input - Team creation data (name, description)
 * @returns Created team
 */
export async function createTeam(input: CreateTeamInput): Promise<Team> {
  const csrf = await getCsrfToken();
  const { data } = await api.post<Team>('/teams', input, {
    headers: { 'x-csrf-token': csrf },
  });
  return data;
}

/**
 * Update an existing team.
 * Requires Team ADMIN role or higher.
 *
 * @param teamId - Team ID
 * @param input - Update data (name, description, isActive)
 * @returns Updated team
 */
export async function updateTeam(teamId: string, input: UpdateTeamInput): Promise<Team> {
  const csrf = await getCsrfToken();
  const { data } = await api.patch<Team>(`/teams/${teamId}`, input, {
    headers: { 'x-csrf-token': csrf },
  });
  return data;
}

/**
 * Deactivate a team (soft-delete).
 * Sets isActive to false instead of hard-deleting.
 * Requires Team ADMIN role or higher.
 *
 * @param teamId - Team ID
 * @returns Updated team with isActive=false
 */
export async function deactivateTeam(teamId: string): Promise<Team> {
  return updateTeam(teamId, { isActive: false });
}

/**
 * Activate a previously deactivated team.
 * Sets isActive to true.
 * Requires Team ADMIN role or higher.
 *
 * @param teamId - Team ID
 * @returns Updated team with isActive=true
 */
export async function activateTeam(teamId: string): Promise<Team> {
  return updateTeam(teamId, { isActive: true });
}

// =============================================================================
// Team Membership Operations
// =============================================================================

/**
 * Get paginated list of team members.
 *
 * @param teamId - Team ID
 * @param params - Query parameters (search, page, pageSize)
 * @returns Paginated list of team members with employee details
 */
export async function getTeamMembers(
  teamId: string,
  params?: ListTeamMembersParams
): Promise<PaginatedMemberResponse> {
  const { data } = await api.get<PaginatedMemberResponse>(`/teams/${teamId}/members`, { params });
  return data;
}

/**
 * Add a member to a team.
 * Requires Team OWNER role.
 *
 * @param teamId - Team ID
 * @param input - Member data (employeeId, role)
 * @returns Created membership
 */
export async function addTeamMember(
  teamId: string,
  input: AddTeamMemberInput
): Promise<TeamMembership> {
  const csrf = await getCsrfToken();
  const { data } = await api.post<TeamMembership>(`/teams/${teamId}/members`, input, {
    headers: { 'x-csrf-token': csrf },
  });
  return data;
}

/**
 * Update a member's role in a team.
 * Requires Team OWNER role.
 *
 * @param membershipId - Membership ID
 * @param role - New role to assign
 * @returns Updated membership
 */
export async function updateMemberRole(
  membershipId: string,
  role: TeamRole
): Promise<TeamMembership> {
  const csrf = await getCsrfToken();
  const { data } = await api.put<TeamMembership>(
    `/team-memberships/${membershipId}`,
    { role },
    { headers: { 'x-csrf-token': csrf } }
  );
  return data;
}

/**
 * Remove a member from a team.
 * Requires Team OWNER role.
 *
 * @param membershipId - Membership ID
 */
export async function removeMember(membershipId: string): Promise<void> {
  const csrf = await getCsrfToken();
  await api.delete(`/team-memberships/${membershipId}`, {
    headers: { 'x-csrf-token': csrf },
  });
}

/**
 * Get membership details by ID.
 *
 * @param membershipId - Membership ID
 * @returns Membership details
 */
export async function getMembership(membershipId: string): Promise<TeamMembership> {
  const { data } = await api.get<TeamMembership>(`/team-memberships/${membershipId}`);
  return data;
}

// =============================================================================
// User's Team Memberships
// =============================================================================

/**
 * Get the authenticated user's team memberships.
 *
 * @returns List of user's teams with their roles
 */
export async function getMyTeams(): Promise<
  Array<{
    teamGroup: Team;
    role: TeamRole;
    membershipId: string;
  }>
> {
  const { data } = await api.get<
    Array<{
      teamGroup: Team;
      role: TeamRole;
      membershipId: string;
    }>
  >('/teams/my-teams');
  return data;
}
