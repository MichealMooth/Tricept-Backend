# Task Breakdown: Datenhaltung & Berechtigungen

## Overview
Total Tasks: 6 Task Groups with 33 Sub-Tasks

This spec implements a TeamGroup-based RBAC system with data classification (GLOBAL, TEAM, USER scopes), extending the existing authentication while maintaining backward compatibility with the isAdmin model.

## Task List

### Database Layer

#### Task Group 1: Core Data Models (TeamGroup, TeamMembership, Enums)
**Dependencies:** None
**Complexity:** Medium
**Estimated Effort:** 4-6 hours

- [x] 1.0 Complete TeamGroup and TeamMembership database layer
  - [x] 1.1 Write 4-6 focused tests for TeamGroup/TeamMembership functionality
    - Test TeamGroup creation with all required fields
    - Test TeamMembership role assignment (OWNER, ADMIN, EDITOR, VIEWER, USER)
    - Test user can belong to multiple TeamGroups with different roles
    - Test cascade delete behavior for memberships when TeamGroup deleted
    - Skip exhaustive edge case testing
  - [x] 1.2 Create Prisma schema for TeamGroup model
    - Fields: id (uuid), name (String), description (String?), isActive (Boolean), createdAt, updatedAt, createdBy (String?), updatedBy (String?)
    - Add indexes on isActive for query performance
    - Follow existing model patterns from Employee, StrategicGoal
  - [x] 1.3 Create Prisma schema for TeamMembership junction model
    - Fields: id (uuid), employeeId, teamGroupId, role (TeamRole enum), createdAt, updatedAt, createdBy (String?), updatedBy (String?)
    - Composite unique constraint on [employeeId, teamGroupId]
    - Add indexes on employeeId and teamGroupId
    - Follow ReferenceProjectEmployee junction pattern
  - [x] 1.4 Create TeamRole enum in Prisma schema
    - Values: OWNER, ADMIN, EDITOR, VIEWER, USER
    - Use native enum support for type safety
    - Note: SQLite does not support native enums; using String type with application-level validation
  - [x] 1.5 Add Employee relation to TeamMembership
    - Employee has_many TeamMemberships
    - TeamMembership belongs_to Employee
    - TeamMembership belongs_to TeamGroup
  - [x] 1.6 Create and run migration
    - Generate migration: `pnpm prisma:migrate`
    - Verify migration runs successfully on SQLite
    - Regenerate Prisma client
  - [x] 1.7 Ensure Task Group 1 tests pass
    - Run ONLY the 4-6 tests written in 1.1
    - Verify all model constraints work correctly
    - Do NOT run the entire test suite

**Acceptance Criteria:**
- TeamGroup and TeamMembership models created with all fields
- TeamRole enum with 5 role values
- Employee relation properly configured
- Migration runs without errors
- 4-6 focused tests pass

---

#### Task Group 2: Extended Data Models (Scope Fields, Questionnaire, Question)
**Dependencies:** Task Group 1
**Complexity:** Medium-High
**Estimated Effort:** 5-7 hours

- [x] 2.0 Complete extended schema with scope classification and Questionnaire models
  - [x] 2.1 Write 5-7 focused tests for scope and Questionnaire functionality
    - Test StrategicGoal with GLOBAL and TEAM scope
    - Test StrategicGoal teamGroupId nullable constraint
    - Test Questionnaire creation with status (DRAFT, ACTIVE, ARCHIVED)
    - Test Question with questionType and displayOrder
    - Test Questionnaire-Question relationship
    - Skip exhaustive validation testing
  - [x] 2.2 Create DataScope enum in Prisma schema
    - Values: GLOBAL, TEAM, USER
    - Use for scope classification across models
  - [x] 2.3 Create QuestionnaireStatus enum
    - Values: DRAFT, ACTIVE, ARCHIVED
    - Use for questionnaire lifecycle management
  - [x] 2.4 Extend StrategicGoal model with scope fields
    - Add scope (DataScope) field with default GLOBAL
    - Add teamGroupId (String?) nullable field
    - Add relation to TeamGroup (optional)
    - Existing goals default to scope=GLOBAL via migration
  - [x] 2.5 Create Questionnaire model
    - Fields: id (uuid), title, description, version (Int), status (QuestionnaireStatus), scope (DataScope), teamGroupId (String?), createdAt, createdBy (String?), updatedAt, updatedBy (String?)
    - Add relation to TeamGroup (optional)
    - Add relation to Question[]
    - Follow StrategicGoal pattern
  - [x] 2.6 Create Question model
    - Fields: id (uuid), questionnaireId, questionText, questionType (String), displayOrder (Int), isRequired (Boolean), options (String @default("[]")), createdAt, updatedAt
    - Add relation to Questionnaire
    - Use JSON string pattern for options (like allocations in UserCapacity)
  - [x] 2.7 Create and run migration
    - Handle existing StrategicGoal records (default scope=GLOBAL)
    - Generate and apply migration
    - Verify backward compatibility
  - [x] 2.8 Ensure Task Group 2 tests pass
    - Run ONLY the 5-7 tests written in 2.1
    - Verify scope fields work correctly
    - Do NOT run the entire test suite

**Acceptance Criteria:**
- DataScope and QuestionnaireStatus enums created
- StrategicGoal extended with scope and teamGroupId
- Questionnaire and Question models created (MVP)
- Existing StrategicGoal data migrated to scope=GLOBAL
- 5-7 focused tests pass

---

### Authorization Layer

#### Task Group 3: Authorization Middleware and Utilities
**Dependencies:** Task Group 1
**Complexity:** High
**Estimated Effort:** 6-8 hours

- [x] 3.0 Complete authorization middleware with role/scope checking
  - [x] 3.1 Write 6-8 focused tests for authorization middleware
    - Test authorize() allows Global Admin (isAdmin=true) for all scopes
    - Test authorize() checks TeamMembership role for TEAM scope
    - Test authorize() verifies ownership for USER scope
    - Test authorize() returns 403 for insufficient permissions
    - Test authorize() works with existing isAuthenticated middleware
    - Test role hierarchy (OWNER > ADMIN > EDITOR > VIEWER > USER)
    - Skip exhaustive error message testing
  - [x] 3.2 Create authorization types and interfaces
    - Path: `backend/src/types/authorization.ts`
    - Define AuthScope type (GLOBAL, TEAM, USER)
    - Define TeamRole type matching Prisma enum
    - Define AuthorizationContext interface
    - Follow existing type patterns in project
  - [x] 3.3 Create authorize() middleware factory
    - Path: `backend/src/middleware/authorize.middleware.ts`
    - Function signature: `authorize(requiredRole?: TeamRole, scope?: AuthScope, options?: AuthOptions)`
    - Chain with existing isAuthenticated middleware
    - Preserve test environment bypass (consistent with auth.middleware.ts)
  - [x] 3.4 Implement GLOBAL scope authorization logic
    - Check isAdmin flag on req.user
    - Return 403 with clear message if not Global Admin
    - Allow read access for all authenticated users
  - [x] 3.5 Implement TEAM scope authorization logic
    - Query TeamMembership for user's role in target TeamGroup
    - Compare user's role against required role using hierarchy
    - Extract teamGroupId from request (params, body, or query)
    - Return 403 if user lacks sufficient role in TeamGroup
  - [x] 3.6 Implement USER scope authorization logic
    - Verify ownership via employeeId/userId match
    - Pattern from assessment.service.ts employeeId checks
    - Return 403 if resource ownership mismatch
  - [x] 3.7 Create TeamMembershipService for role lookups
    - Path: `backend/src/services/team-membership.service.ts`
    - getUserRoleInTeam(userId, teamGroupId): Promise<TeamRole | null>
    - getUserTeamGroups(userId): Promise<TeamMembership[]>
    - Follow assessment.service.ts patterns
  - [x] 3.8 Ensure Task Group 3 tests pass
    - Run ONLY the 6-8 tests written in 3.1
    - Verify all scope/role combinations work
    - Do NOT run the entire test suite

**Acceptance Criteria:**
- authorize() middleware factory created
- GLOBAL, TEAM, USER scope logic implemented
- TeamMembershipService for role lookups
- Integration with existing auth middleware
- Test environment bypass preserved
- 6-8 focused tests pass

---

### API Layer

#### Task Group 4: TeamGroup and TeamMembership API Endpoints
**Dependencies:** Task Group 1, Task Group 3
**Complexity:** Medium
**Estimated Effort:** 5-7 hours

- [x] 4.0 Complete TeamGroup and TeamMembership CRUD API
  - [x] 4.1 Write 5-7 focused tests for TeamGroup/Membership API
    - Test GET /api/team-groups returns user's teams
    - Test POST /api/team-groups creates team (admin only)
    - Test POST /api/team-groups/:id/members adds member (OWNER only)
    - Test PUT /api/team-memberships/:id updates role (OWNER only)
    - Test DELETE /api/team-memberships/:id removes member
    - Skip exhaustive validation error testing
  - [x] 4.2 Create Zod validation schemas
    - Path: `backend/src/validators/team-group.validator.ts`
    - CreateTeamGroupSchema: name required, description optional
    - UpdateTeamGroupSchema: name optional, description optional, isActive optional
    - CreateTeamMembershipSchema: employeeId required, role required (enum)
    - UpdateTeamMembershipSchema: role required (enum)
    - Follow existing Zod patterns in project
  - [x] 4.3 Create TeamGroupService
    - Path: `backend/src/services/team-group.service.ts`
    - create, update, delete, getById, getAll, getByUserId
    - Include audit field population (createdBy, updatedBy)
    - Follow ReferenceProject service patterns
  - [x] 4.4 Create TeamGroupController
    - Path: `backend/src/controllers/team-group.controller.ts`
    - Standard CRUD actions with Zod validation
    - Error handling with appropriate status codes
    - Follow existing controller patterns
  - [x] 4.5 Create TeamMembershipController
    - Path: `backend/src/controllers/team-membership.controller.ts`
    - addMember, updateMember, removeMember actions
    - OWNER-only for membership management
    - Follow existing controller patterns
  - [x] 4.6 Create API routes with authorization
    - Path: `backend/src/routes/team-groups.ts`
    - GET /api/team-groups - list user's teams (isAuthenticated)
    - POST /api/team-groups - create team (isAuthenticated, isAdmin)
    - GET /api/team-groups/:id - get team details (authorize VIEWER, TEAM)
    - PUT /api/team-groups/:id - update team (authorize ADMIN, TEAM)
    - POST /api/team-groups/:id/members - add member (authorize OWNER, TEAM)
    - PUT /api/team-memberships/:id - update role (authorize OWNER, TEAM)
    - DELETE /api/team-memberships/:id - remove member (authorize OWNER, TEAM)
  - [x] 4.7 Register routes in app.ts
    - Import and mount teamGroups router
    - Follow existing route registration pattern
  - [x] 4.8 Ensure Task Group 4 tests pass
    - Run ONLY the 5-7 tests written in 4.1
    - Verify CRUD operations work
    - Do NOT run the entire test suite

**Acceptance Criteria:**
- TeamGroup CRUD API endpoints working
- TeamMembership management endpoints working
- Zod validation for all inputs
- Authorization applied per endpoint
- Routes registered in app.ts
- 5-7 focused tests pass

---

#### Task Group 5: Extend Existing APIs with Scope-Based Access
**Dependencies:** Task Group 2, Task Group 3
**Complexity:** Medium
**Estimated Effort:** 4-6 hours

- [x] 5.0 Extend StrategicGoals API with team scope support
  - [x] 5.1 Write 4-6 focused tests for scoped StrategicGoals API
    - Test GET /api/strategic-goals returns GLOBAL + user's TEAM goals
    - Test POST /api/strategic-goals with scope=TEAM requires teamGroupId
    - Test TEAM-scoped goals only visible to TeamGroup members
    - Test StrategicGoalRatings remain user-scoped (owner-only)
    - Skip exhaustive filtering/pagination testing
  - [x] 5.2 Update StrategicGoal Zod schemas
    - Add scope (optional, defaults to GLOBAL)
    - Add teamGroupId (required when scope=TEAM)
    - Conditional validation: teamGroupId required if scope=TEAM
  - [x] 5.3 Update StrategicGoalService for scope handling
    - Modify getAll to filter by scope and user's TeamGroups
    - Add teamGroupId filter for TEAM-scoped queries
    - Pattern: WHERE (scope=GLOBAL) OR (scope=TEAM AND teamGroupId IN userTeamIds)
    - Keep StrategicGoalRating owner-only pattern unchanged
  - [x] 5.4 Update StrategicGoalController
    - Add scope parameter handling
    - Validate teamGroupId presence for TEAM scope
    - Return appropriate errors for scope violations
  - [x] 5.5 Update routes with authorize middleware
    - GET /api/strategic-goals - isAuthenticated (scope filtering in service)
    - POST /api/strategic-goals - authorize based on scope (GLOBAL=admin, TEAM=EDITOR)
    - PUT/DELETE - authorize based on goal's scope
  - [x] 5.6 Ensure Task Group 5 tests pass
    - Run ONLY the 4-6 tests written in 5.1
    - Verify scope-based filtering works
    - Do NOT run the entire test suite

**Acceptance Criteria:**
- StrategicGoals support GLOBAL and TEAM scope
- TEAM goals filtered by user's TeamGroup memberships
- Authorization respects scope on mutations
- Backward compatibility with existing GLOBAL goals
- 4-6 focused tests pass

---

### Audit & Integration

#### Task Group 6: Audit Trail Middleware and Integration Testing
**Dependencies:** Task Groups 1-5
**Complexity:** Low-Medium
**Estimated Effort:** 3-5 hours

- [x] 6.0 Complete audit trail and integration verification
  - [x] 6.1 Write 3-5 focused integration tests
    - Test audit fields populated on TeamGroup create/update
    - Test audit fields populated on TeamMembership create/update
    - Test end-to-end flow: create team, add member, verify role access
    - Skip exhaustive audit trail testing (Phase 2 scope)
  - [x] 6.2 Create audit middleware for auto-populating fields
    - Path: `backend/src/middleware/audit.middleware.ts`
    - Extract userId from req.user
    - Provide utility function for services to use
    - Pattern: `getAuditFields(req): { createdBy?: string, updatedBy?: string }`
  - [x] 6.3 Update services to use audit utilities
    - TeamGroupService: populate createdBy/updatedBy
    - TeamMembershipService: populate createdBy/updatedBy
    - Pattern: spread audit fields in Prisma create/update calls
  - [x] 6.4 Create optional seed script for TeamGroups from departments
    - Path: `backend/prisma/seeds/team-groups.seed.ts`
    - Extract unique departments from Employee table
    - Create TeamGroup for each department
    - Add employees to their department's TeamGroup with USER role
    - Make script optional/idempotent
  - [x] 6.5 Update seed command to include team groups
    - Modify `backend/prisma/seed.ts` to optionally run team-groups seed
    - Keep backward compatible (skip if already seeded)
  - [x] 6.6 Ensure all feature tests pass
    - Run all tests from Task Groups 1-6 (approximately 27-39 tests)
    - Verify end-to-end authorization flow works
    - Do NOT run unrelated application tests

**Acceptance Criteria:**
- Audit middleware created and integrated
- createdBy/updatedBy populated automatically
- Optional seed script for department-based TeamGroups
- All feature-specific tests pass
- No breaking changes to existing functionality

---

## Execution Order

### Phase 1: Foundation (Task Groups 1-2)
1. **Task Group 1:** Core Data Models - Creates the foundation for all authorization
2. **Task Group 2:** Extended Data Models - Adds scope classification and Questionnaire schema

### Phase 2: Authorization Engine (Task Group 3)
3. **Task Group 3:** Authorization Middleware - Core authorization logic, depends on Task Group 1

### Phase 3: API Implementation (Task Groups 4-5)
4. **Task Group 4:** TeamGroup API - CRUD endpoints for team management
5. **Task Group 5:** Scope-Extended APIs - Extend StrategicGoals with team scope

### Phase 4: Integration (Task Group 6)
6. **Task Group 6:** Audit & Integration - Final integration, audit trail, and verification

---

## Technical Notes

### Patterns to Follow
- **Auth Middleware:** Extend `backend/src/middleware/auth.middleware.ts` pattern
- **Zod Validation:** Use existing validation patterns in controllers
- **Prisma Access:** Follow `assessment.service.ts` employeeId filtering for owner-only data
- **Junction Tables:** Follow `ReferenceProjectEmployee` pattern for TeamMembership

### Key Files to Reference
- `backend/src/middleware/auth.middleware.ts` - isAuthenticated, isAdmin patterns
- `backend/src/services/assessment.service.ts` - Owner-only data access pattern
- `backend/prisma/schema.prisma` - Existing model patterns
- `backend/src/routes/assessments.ts` - Route with middleware chaining

### Breaking Change Prevention
- isAdmin=true remains Global Admin with break-glass access
- Existing API endpoints continue to work unchanged
- StrategicGoal scope defaults to GLOBAL for backward compatibility
- Users without TeamGroup memberships can still access GLOBAL scope data

### Test Strategy
- Each task group writes 4-8 focused tests
- Tests verify critical behaviors only, not exhaustive coverage
- Final integration tests verify end-to-end flows
- Total tests: approximately 27-39 tests for this feature
