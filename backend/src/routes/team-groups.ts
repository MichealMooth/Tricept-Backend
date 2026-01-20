/**
 * Teams API Routes
 *
 * Defines routes for TeamGroup and TeamMembership management.
 * Uses authorization middleware for role-based access control.
 *
 * Task Group 4.6: Create API routes with authorization
 * Task Group 1: API Route Refactoring - Routes renamed from /team-groups to /teams
 *
 * Route Summary:
 * - GET    /api/teams                 - List all teams with pagination and search (isAuthenticated)
 * - POST   /api/teams                 - Create team (isAuthenticated, isAdmin)
 * - GET    /api/teams/my-teams        - Get user's teams (isAuthenticated)
 * - GET    /api/teams/:id             - Get team details (authorize VIEWER, TEAM)
 * - PUT    /api/teams/:id             - Update team (authorize ADMIN, TEAM)
 * - PATCH  /api/teams/:id             - Partial update team / soft-delete (authorize ADMIN, TEAM)
 * - DELETE /api/teams/:id             - Hard delete team (isAuthenticated, isAdmin)
 * - GET    /api/teams/:id/members     - Get paginated member list (authorize VIEWER, TEAM)
 * - POST   /api/teams/:id/members     - Add member (authorize OWNER, TEAM)
 * - GET    /api/team-memberships/:id  - Get membership details (isAuthenticated)
 * - PUT    /api/team-memberships/:id  - Update role (authorize OWNER, TEAM)
 * - DELETE /api/team-memberships/:id  - Remove member (authorize OWNER, TEAM)
 */

import { Router } from 'express';
import * as teamGroupController from '@/controllers/team-group.controller';
import * as teamMembershipController from '@/controllers/team-membership.controller';
import { isAuthenticated, isAdmin } from '@/middleware/auth.middleware';
import { authorize } from '@/middleware/authorize.middleware';

const router: Router = Router();

// =============================================================================
// TeamGroup Routes (new /teams prefix)
// =============================================================================

/**
 * GET /api/teams
 * List all teams with pagination and search.
 * Query params: search, page, pageSize, includeInactive
 * Access: All authenticated users
 */
router.get('/teams', isAuthenticated, teamGroupController.list);

/**
 * GET /api/teams/my-teams
 * Get the authenticated user's team memberships.
 * Access: All authenticated users
 * Note: This route must come before /:id to avoid matching 'my-teams' as an ID
 */
router.get('/teams/my-teams', isAuthenticated, teamGroupController.getMyTeams);

/**
 * POST /api/teams
 * Create a new team.
 * Access: Global Admin only
 */
router.post('/teams', isAuthenticated, isAdmin, teamGroupController.create);

/**
 * GET /api/teams/:id
 * Get team details by ID.
 * Access: Team members with VIEWER role or higher
 */
router.get('/teams/:id', isAuthenticated, authorize('VIEWER', 'TEAM'), teamGroupController.getOne);

/**
 * PUT /api/teams/:id
 * Full update of team details.
 * Access: Team members with ADMIN role or higher
 */
router.put('/teams/:id', isAuthenticated, authorize('ADMIN', 'TEAM'), teamGroupController.update);

/**
 * PATCH /api/teams/:id
 * Partial update of team details (including soft-delete via isActive=false).
 * Access: Team members with ADMIN role or higher
 */
router.patch(
  '/teams/:id',
  isAuthenticated,
  authorize('ADMIN', 'TEAM'),
  teamGroupController.update
);

/**
 * DELETE /api/teams/:id
 * Hard delete a team (emergency use only).
 * Access: Global Admin only (destructive operation)
 */
router.delete('/teams/:id', isAuthenticated, isAdmin, teamGroupController.remove);

// =============================================================================
// TeamMembership Routes (nested under teams)
// =============================================================================

/**
 * GET /api/teams/:id/members
 * Get paginated list of team members with employee details.
 * Query params: search, page, pageSize
 * Access: Team members with VIEWER role or higher
 */
router.get(
  '/teams/:id/members',
  isAuthenticated,
  authorize('VIEWER', 'TEAM'),
  teamGroupController.listMembers
);

/**
 * POST /api/teams/:id/members
 * Add a member to a team.
 * Access: Team OWNERs only
 */
router.post(
  '/teams/:id/members',
  isAuthenticated,
  authorize('OWNER', 'TEAM'),
  teamMembershipController.addMember
);

// =============================================================================
// TeamMembership Routes (standalone)
// =============================================================================

/**
 * GET /api/team-memberships/:id
 * Get membership details by ID.
 * Access: All authenticated users (for now)
 */
router.get('/team-memberships/:id', isAuthenticated, teamMembershipController.getMembership);

/**
 * PUT /api/team-memberships/:id
 * Update a member's role.
 * Access: Team OWNERs only
 * Note: Authorization is checked via the membership's teamGroupId
 */
router.put('/team-memberships/:id', isAuthenticated, teamMembershipController.updateMember);

/**
 * DELETE /api/team-memberships/:id
 * Remove a member from a team.
 * Access: Team OWNERs only
 * Note: Authorization is checked via the membership's teamGroupId
 */
router.delete('/team-memberships/:id', isAuthenticated, teamMembershipController.removeMember);

// =============================================================================
// Backward Compatibility Aliases (deprecated, will be removed in future)
// =============================================================================

/**
 * @deprecated Use /api/teams instead
 * GET /api/team-groups
 */
router.get('/team-groups', isAuthenticated, teamGroupController.list);

/**
 * @deprecated Use /api/teams/my-teams instead
 * GET /api/team-groups/my-teams
 */
router.get('/team-groups/my-teams', isAuthenticated, teamGroupController.getMyTeams);

/**
 * @deprecated Use POST /api/teams instead
 * POST /api/team-groups
 */
router.post('/team-groups', isAuthenticated, isAdmin, teamGroupController.create);

/**
 * @deprecated Use /api/teams/:id instead
 * GET /api/team-groups/:id
 */
router.get(
  '/team-groups/:id',
  isAuthenticated,
  authorize('VIEWER', 'TEAM'),
  teamGroupController.getOne
);

/**
 * @deprecated Use PUT /api/teams/:id instead
 * PUT /api/team-groups/:id
 */
router.put(
  '/team-groups/:id',
  isAuthenticated,
  authorize('ADMIN', 'TEAM'),
  teamGroupController.update
);

/**
 * @deprecated Use DELETE /api/teams/:id instead
 * DELETE /api/team-groups/:id
 */
router.delete('/team-groups/:id', isAuthenticated, isAdmin, teamGroupController.remove);

/**
 * @deprecated Use POST /api/teams/:id/members instead
 * POST /api/team-groups/:id/members
 */
router.post(
  '/team-groups/:id/members',
  isAuthenticated,
  authorize('OWNER', 'TEAM'),
  teamMembershipController.addMember
);

export default router;
