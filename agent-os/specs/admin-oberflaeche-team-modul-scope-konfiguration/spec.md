# Specification: Admin-Oberflaeche Team-Modul-Scope-Konfiguration

## Goal
Provide a central Admin UI for configuring which modules are available to which teams, and what data scope each module uses per team, enabling fine-grained module visibility and data access control across the organization.

## User Stories
- As an admin, I want to configure module visibility and scope per team so that teams only see relevant modules with appropriate data access levels
- As a user in multiple teams, I want to see all modules enabled for any of my teams and view team-scoped data separated by team sections

## Specific Requirements

**Module Registry (Code-Based)**
- Create `backend/src/config/modules.registry.ts` with hardcoded module definitions
- Each module definition includes: id, name, route, apiPrefix, allowedScopes, defaultScope, description
- Module registry is read-only at runtime; adding modules requires code deployment
- Export `MODULE_REGISTRY` array and helper functions like `getModuleById()`, `getAllModules()`
- Initial modules: strategic-goals, skills, assessments, capacities, reference-projects, kurzprofil

**TeamModuleConfig Junction Model**
- Create Prisma model linking TeamGroup to moduleId (string reference to code registry)
- Fields: id, teamGroupId, moduleId, isEnabled, scope (override), createdAt, updatedAt, createdBy, updatedBy
- Unique constraint on [teamGroupId, moduleId] to prevent duplicates
- Scope override must validate against module's allowedScopes array
- Missing config entry means module uses defaults (enabled=true, defaultScope)

**ModuleConfigAudit Model**
- Separate audit table for configuration change tracking
- Fields: id, teamGroupId, moduleId, action (CREATE/UPDATE/DELETE), oldValues, newValues (JSON), performedBy, performedAt
- Indexed on teamGroupId, moduleId, performedAt for efficient compliance queries
- Audit entries created automatically by service layer on any config change

**Admin API Endpoints**
- GET `/api/admin/modules` - List all modules from registry with aggregated team configs
- GET `/api/admin/modules/:moduleId` - Get single module details with all team configs
- GET `/api/admin/team-module-config/:teamId` - Get all module configs for a specific team
- PUT `/api/admin/team-module-config` - Upsert team/module config (body: teamGroupId, moduleId, isEnabled, scope)
- GET `/api/admin/module-config-audit` - Query audit trail with filters (teamId, moduleId, dateRange)
- All admin endpoints require isAdmin middleware

**User Effective Modules Endpoint**
- GET `/api/user/effective-modules` - Returns modules accessible to current user
- Applies union rule: module visible if enabled in ANY of user's teams
- Returns effective scope per module (GLOBAL takes precedence over TEAM)
- Response includes team breakdown for TEAM-scoped modules
- Cache result on frontend after login, invalidate on team membership changes

**Multi-Team Union Rules**
- Visibility: User sees modules enabled for ANY of their teams
- Access: Most permissive scope applies when teams have conflicting scopes
- GLOBAL scope takes precedence over TEAM scope (broader access wins)
- For TEAM-scoped data: API returns data from ALL user's teams with teamGroupId tags
- Role aggregation: Effective role per module is highest role across all team memberships

**Team-Scoped Data Display Pattern**
- Frontend components receiving TEAM-scoped data display separate sections per team
- Each section has a clear header showing team name
- Section ordering matches user's team membership order (alphabetical)
- Components use shared `TeamSectionWrapper` component for consistent styling
- When user has single team membership, section header is still shown for consistency

**Frontend Navigation Integration**
- NavBar fetches effective modules on auth state change
- Navigation items dynamically rendered from enabled modules
- Disabled modules: hidden from navigation, routes redirect to dashboard
- Admin dropdown remains separate; module config does not affect admin access
- Store effective modules in Zustand store for global access

**Module Deactivation Warning**
- When disabling a module for a team, show warning dialog with record count
- Warning text: "X Datensaetze werden fuer dieses Team unsichtbar"
- Data is NOT deleted, only hidden from team members
- Require explicit confirmation before proceeding
- Reactivation immediately restores visibility without data loss

**Scope Conflict Warning**
- When assigning different scopes to same module across teams, show info notice
- Notice explains that users in multiple teams may see expanded access
- Allow admin to proceed after acknowledging the notice
- No blocking validation; just informational warning

## Visual Design
No visual mockups provided. Follow existing admin page patterns from EmployeesPage.tsx with table-based CRUD layout.

## Existing Code to Leverage

**TeamGroup and TeamMembership Models**
- Reuse existing Prisma models from schema.prisma (lines 293-331)
- TeamGroup already has: id, name, description, isActive, audit fields
- TeamMembership provides user-to-team assignments with roles
- No schema changes needed for team management; only add new junction model

**authorize() Middleware Pattern**
- Follow existing pattern in `backend/src/middleware/authorize.middleware.ts`
- Extend with new `authorizeModule()` middleware for module-level access checks
- Reuse AuthScope type ('GLOBAL' | 'TEAM' | 'USER') from authorization.ts
- Leverage `getUserRoleInTeam()` from team-membership.service.ts

**TeamGroup Controller and Service**
- Follow patterns in `backend/src/controllers/team-group.controller.ts`
- Use Zod for request validation with formatZodError helper
- Service layer handles business logic; controller handles HTTP concerns
- Follow existing pagination pattern from getAll() function

**Admin Page Component Pattern**
- Follow EmployeesPage.tsx structure: state management, modal pattern, table layout
- Use existing form modal pattern with create/edit modes
- Consistent button styling with indigo-600 primary actions
- Table with border rounded, overflow-auto container

**NavBar Dynamic Menu Pattern**
- Extend existing dropdown pattern used for Admin, Skills, Capacity menus
- Use useRef and useEffect for click-outside handling
- Consistent menu styling: white bg, rounded-lg shadow, py-2 items

## Out of Scope
- SSO/external authentication integration
- Per-record permissions within modules (only module-level access)
- Multi-tenant (organization) separation
- Module dependencies or prerequisites
- Time-based module access scheduling
- Focus Team selector in header (Phase 2 feature)
- Cascading module configurations between teams
- Custom module icons or colors in navigation
- Module access analytics or usage tracking
- Bulk configuration import/export
