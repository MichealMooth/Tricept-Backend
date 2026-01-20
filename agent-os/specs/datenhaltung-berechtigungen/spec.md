# Specification: Datenhaltung & Berechtigungen

## Goal

Implement a flexible TeamGroup-based authorization system with role-based access control (RBAC) that extends the existing authentication, enabling data classification into Global, Team, and User scopes while maintaining backward compatibility with the current isAdmin model.

## User Stories

- As a team lead, I want to manage my team's reference projects and strategic goals so that team members can collaborate on shared data
- As an employee, I want my personal assessments, capacity data, and ratings to remain private so that only I can view and edit them
- As a global admin, I want to manage organization-wide master data (Skills, Categories) so that all teams have consistent foundational data

## Specific Requirements

**TeamGroup Entity and Membership Model**
- Create TeamGroup model with id, name, description, isActive, createdAt, updatedAt fields
- Create TeamMembership junction model linking Employee to TeamGroup with role enum (OWNER, ADMIN, EDITOR, VIEWER, USER)
- A User can belong to multiple TeamGroups with different roles in each
- Roles are context-dependent: permissions apply only within the associated TeamGroup
- No default/catch-all group; users without membership rely on GLOBAL scope visibility

**Role Hierarchy and Permissions**
- OWNER: full rights including role/membership management within the TeamGroup
- ADMIN: manage team content, cannot manage memberships
- EDITOR: create/update team-scoped content
- VIEWER: read-only access to team content
- USER: basic rights on own data only
- Global Admin (isAdmin=true) retains break-glass access to all resources

**Data Scope Classification**
- GLOBAL scope: Skills, SkillCategories, Role (lookup), Topic - readable by all authenticated users, writable by Global Admin only
- TEAM scope: ReferenceProject (with optional ORG_PUBLISHED visibility flag), team-scoped StrategicGoals
- USER scope: SkillAssessments, UserCapacity, StrategicGoalRatings, UserProfile - owner-only access
- Add scope enum field (GLOBAL, TEAM, USER) and optional teamGroupId to relevant models

**StrategicGoals Hybrid Model**
- Extend StrategicGoal with scope field (GLOBAL or TEAM) and nullable teamGroupId
- GLOBAL goals visible to all authenticated users, TEAM goals visible to TeamGroup members
- StrategicGoalRatings remain user-specific with owner-only access
- Existing goals default to scope=GLOBAL during migration

**Questionnaire and Question Schema (MVP)**
- Create Questionnaire model with id, title, description, version, status (DRAFT, ACTIVE, ARCHIVED), scope, teamGroupId, createdAt/By, updatedAt/By
- Create Question model with id, questionnaireId, questionText, questionType, displayOrder, isRequired, options (JSON), createdAt, updatedAt
- Support versioning via status field and version number
- Scope follows same GLOBAL/TEAM pattern as StrategicGoals

**Authorization Middleware (authorize function)**
- Build on existing isAuthenticated middleware pattern in auth.middleware.ts
- Create authorize(requiredRole, scope?) middleware factory
- Check user's TeamMembership role against required role for team-scoped resources
- For GLOBAL scope, check isAdmin flag; for USER scope, verify ownership via employeeId/userId
- Return 403 Forbidden with clear message on authorization failure

**Audit Trail Fields (Minimal)**
- Add createdBy (nullable String) and updatedBy (nullable String) fields to TeamGroup, TeamMembership, Questionnaire, Question
- Create centralized audit middleware to auto-populate these fields from req.user
- Extend existing createdAt/updatedAt pattern already present in models
- Full change history with old values deferred to Phase 2

## Visual Design

No visual assets provided for this specification.

## Existing Code to Leverage

**Auth Middleware (`backend/src/middleware/auth.middleware.ts`)**
- isAuthenticated middleware pattern for session validation
- isAdmin middleware for Global Admin check
- Extend pattern to create authorize() factory with role/scope parameters
- Keep test environment bypass logic for consistent testing behavior

**Assessment Service (`backend/src/services/assessment.service.ts`)**
- employeeId-based WHERE clause filtering as blueprint for owner-only data
- Pattern for checking resource ownership before returning data
- getCurrentAssessments function demonstrates scoped data retrieval
- Apply same pattern for UserCapacity, StrategicGoalRatings, UserProfile

**Prisma Schema (`backend/prisma/schema.prisma`)**
- Existing Employee model with isAdmin field to preserve
- StrategicGoal/StrategicGoalRating relationship pattern for hybrid scope extension
- Junction table patterns (ReferenceProjectTopic, ReferenceProjectEmployee) as template for TeamMembership
- Index patterns on foreign keys for query performance

**Route Patterns (`backend/src/routes/assessments.ts`)**
- Standard Express router setup with middleware chaining
- Pattern: router.method(path, isAuthenticated, controller)
- Extend to: router.method(path, isAuthenticated, authorize(EDITOR, TEAM), controller)

**Zod Validation**
- Existing Zod schemas in controllers for request body validation
- Create schemas for TeamGroup, TeamMembership, Questionnaire, Question inputs
- Validate scope enum values and role enum values at API boundary

## Out of Scope

- SSO/IdP integration (SAML, OAuth, Azure AD, Okta)
- Full Admin UI for role/membership management (API only in this spec)
- Complex data migration scripts beyond basic seed option
- Per-item sharing (feingranulare Objektfreigaben)
- Change history with old values storage (Phase 2)
- Questionnaire detail UX and visual editor
- UserProfile splitting into PublicProfile/PrivateProfile (evaluation only)
- Automatic TeamGroup creation from department field (optional seed script only)
- Rate limiting changes for new endpoints
- Frontend components for authorization (backend-only spec)
