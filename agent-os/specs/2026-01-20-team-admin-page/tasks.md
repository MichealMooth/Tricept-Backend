# Task Breakdown: Team Admin Page

## Overview
Total Tasks: 30

Die Implementierung ist in 5 Task Groups aufgeteilt, die nach Spezialisierung gruppiert und in logischer Abhaengigkeit geordnet sind.

## Task List

### Backend Layer

#### Task Group 1: API Route Refactoring und Erweiterungen
**Dependencies:** None
**Spezialisierung:** Backend-Engineer

Das Backend hat bereits vollstaendige CRUD-Operationen im `team-group.service.ts`. Diese Task Group fokussiert auf Route-Umbenennung und fehlende Endpunkte.

- [x] 1.0 Complete API route refactoring
  - [x] 1.1 Write 4-6 focused tests for API changes
    - Test GET `/api/teams` returns paginated list with memberCount
    - Test GET `/api/teams/:teamId/members` returns paginated member list
    - Test search parameter filters teams by name
    - Test includeInactive parameter includes deactivated teams
    - Test PATCH `/api/teams/:teamId` with isActive=false for soft-delete
  - [x] 1.2 Rename routes from `/api/team-groups` to `/api/teams`
    - Update `backend/src/routes/team-groups.ts` to use `/teams` prefix
    - Update route imports in `backend/src/app.ts`
    - Keep backward compatibility alias if needed (optional)
  - [x] 1.3 Add search parameter to team list endpoint
    - Add `search` query parameter to `GET /api/teams`
    - Filter by team name (case-insensitive, partial match)
    - Update `team-group.service.ts` `getAll` function
  - [x] 1.4 Create paginated members endpoint
    - Add `GET /api/teams/:teamId/members` route
    - Support query parameters: search, page, pageSize
    - Return member list with employee details (id, firstName, lastName, email, role)
    - Add controller function in `team-group.controller.ts`
  - [x] 1.5 Implement soft-delete via PATCH
    - Use `PATCH /api/teams/:teamId` with `{ isActive: false }` for deactivation
    - Keep existing DELETE for hard-delete (Global Admin emergency use)
    - Return updated team object
  - [x] 1.6 Ensure API layer tests pass
    - Run ONLY the 4-6 tests written in 1.1
    - Verify route changes work correctly
    - Do NOT run the entire test suite at this stage

**Acceptance Criteria:**
- All routes use `/api/teams` prefix
- Search and pagination work on team list
- Members endpoint returns paginated list with employee details
- Soft-delete via PATCH updates isActive flag
- The 4-6 tests written in 1.1 pass

---

### Frontend Services Layer

#### Task Group 2: Team Service und Types
**Dependencies:** Task Group 1
**Spezialisierung:** Frontend-Engineer

- [x] 2.0 Complete team service implementation
  - [x] 2.1 Write 3-4 focused tests for team service
    - Test `listTeams` returns paginated response
    - Test `getTeam` returns team with details
    - Test `getTeamMembers` returns paginated member list
    - Test `createTeam` sends correct POST request
  - [x] 2.2 Create TypeScript types for Team entities
    - Create `frontend/src/types/team.ts`
    - Define `Team`, `TeamMember`, `TeamMembership`, `TeamRole` types
    - Define API response types (PaginatedTeamResponse, PaginatedMemberResponse)
    - Reuse patterns from existing types in `frontend/src/types/index.ts`
  - [x] 2.3 Create team service module
    - Create `frontend/src/services/team.service.ts`
    - Implement `listTeams(params)` - GET /api/teams with search, page, pageSize, includeInactive
    - Implement `getTeam(teamId)` - GET /api/teams/:teamId
    - Implement `createTeam(data)` - POST /api/teams
    - Implement `updateTeam(teamId, data)` - PATCH /api/teams/:teamId
    - Implement `deactivateTeam(teamId)` - PATCH /api/teams/:teamId with isActive=false
  - [x] 2.4 Implement membership service functions
    - Implement `getTeamMembers(teamId, params)` - GET /api/teams/:teamId/members
    - Implement `addTeamMember(teamId, data)` - POST /api/teams/:teamId/members
    - Implement `updateMemberRole(membershipId, role)` - PUT /api/team-memberships/:membershipId
    - Implement `removeMember(membershipId)` - DELETE /api/team-memberships/:membershipId
  - [x] 2.5 Ensure team service tests pass
    - Run ONLY the 3-4 tests written in 2.1
    - Verify service functions work correctly
    - Do NOT run the entire test suite at this stage

**Acceptance Criteria:**
- TypeScript types cover all Team entities
- Service functions match API endpoints
- Error handling follows existing patterns (axios interceptors)
- The 3-4 tests written in 2.1 pass

---

### Frontend Components

#### Task Group 3: Team Admin Pages
**Dependencies:** Task Group 2
**Spezialisierung:** UI-Engineer

- [x] 3.0 Complete team admin pages
  - [x] 3.1 Write 4-6 focused tests for team admin pages
    - Test TeamsPage renders team list table
    - Test TeamsPage search input filters teams with debounce
    - Test TeamDetailPage renders team info and member table
    - Test TeamForm validates required fields (name)
    - Test AddMemberDialog filters employees in combobox
  - [x] 3.2 Create TeamForm component
    - Create `frontend/src/components/admin/TeamForm.tsx`
    - Fields: name (required), description (optional)
    - Use Zod schema with zodResolver
    - Follow pattern from `EmployeeForm.tsx`
    - Modal dialog structure with Cancel/Submit buttons
  - [x] 3.3 Create TeamsPage (team list)
    - Create `frontend/src/pages/admin/TeamsPage.tsx`
    - Table columns: Name, Status (aktiv/inaktiv Badge), Mitglieder (count)
    - Search input with 300ms debounce (analog EmployeesPage)
    - Filter toggle for active/inactive teams
    - "Neues Team" button opens TeamForm in create mode
    - Row actions: Bearbeiten (opens TeamForm), Deaktivieren/Aktivieren
    - Click on team name navigates to `/admin/teams/:teamId`
    - Follow layout pattern from `EmployeesPage.tsx`
  - [x] 3.4 Create TeamDetailPage
    - Create `frontend/src/pages/admin/TeamDetailPage.tsx`
    - Header: Team name, description, Status Badge
    - "Bearbeiten" button for team metadata (opens TeamForm)
    - Member table: Name, E-Mail, Rolle (dropdown), Aktionen (Entfernen)
    - "Mitglied hinzufuegen" button opens AddMemberDialog
    - Pagination for member list
    - Search within member list
  - [x] 3.5 Create AddMemberDialog component
    - Create `frontend/src/components/admin/AddMemberDialog.tsx`
    - Combobox for employee search (use existing employee service)
    - Role select: OWNER, ADMIN, EDITOR, VIEWER
    - Submit adds member and closes dialog
    - Filter out already assigned employees
  - [x] 3.6 Create RoleSelect component
    - Create `frontend/src/components/admin/RoleSelect.tsx`
    - Dropdown with roles: OWNER, ADMIN, EDITOR, VIEWER
    - onChange updates membership role via API
    - Show loading state during update
  - [x] 3.7 Add routes to App.tsx
    - Add `/admin/teams` route pointing to TeamsPage
    - Add `/admin/teams/:teamId` route pointing to TeamDetailPage
    - Wrap routes with AdminRoute component
  - [x] 3.8 Add navigation link
    - Add "Teams" link to admin navigation menu
    - Position after "Mitarbeiter" link
  - [x] 3.9 Ensure team admin page tests pass
    - Run ONLY the 4-6 tests written in 3.1
    - Verify pages render correctly
    - Do NOT run the entire test suite at this stage

**Acceptance Criteria:**
- TeamsPage lists all teams with search and filter
- TeamDetailPage shows team details and member management
- Forms validate and submit correctly
- Navigation works between list and detail pages
- The 4-6 tests written in 3.1 pass

---

### Integration Layer

#### Task Group 4: Employee Integration und Team-Anzeige
**Dependencies:** Task Group 3
**Spezialisierung:** UI-Engineer

- [x] 4.0 Complete employee integration
  - [x] 4.1 Write 3-4 focused tests for employee integration
    - Test TeamBadges component renders team tags
    - Test TeamBadges shows "+N" for overflow teams
    - Test EmployeeForm team multi-select updates memberships
    - Test EmployeesPage displays TeamBadges column
  - [x] 4.2 Create TeamBadges component
    - Create `frontend/src/components/TeamBadges.tsx`
    - Props: teams (array of { id, name })
    - Display first 2 teams as Badge tags
    - Show "+N" badge with Tooltip for additional teams
    - Non-clickable (informational only)
  - [x] 4.3 Update EmployeesPage with team column
    - Add "Teams" column after "Abteilung"
    - Fetch employee teams via extended employee API or separate call
    - Use TeamBadges component for display
    - Extend employee service to include team memberships
  - [x] 4.4 Extend EmployeeForm with team assignment
    - Add multi-select Combobox for team selection
    - Per-team role select (OWNER, ADMIN, EDITOR, VIEWER)
    - Show current team assignments in edit mode
    - Handle add/remove/update of memberships on save
    - Use same membership API as TeamDetailPage
  - [x] 4.5 Ensure employee integration tests pass
    - Run ONLY the 3-4 tests written in 4.1
    - Verify team display and assignment work
    - Do NOT run the entire test suite at this stage

**Acceptance Criteria:**
- TeamBadges displays teams with overflow handling
- EmployeesPage shows team column with badges
- EmployeeForm allows team assignment with roles
- Membership changes persist via API
- The 3-4 tests written in 4.1 pass

---

### Testing Layer

#### Task Group 5: Test Review und Gap Analysis
**Dependencies:** Task Groups 1-4
**Spezialisierung:** QA-Engineer

- [x] 5.0 Review existing tests and fill critical gaps
  - [x] 5.1 Review tests from Task Groups 1-4
    - Review 4-6 tests from Task Group 1 (API)
    - Review 3-4 tests from Task Group 2 (Services)
    - Review 4-6 tests from Task Group 3 (Pages)
    - Review 3-4 tests from Task Group 4 (Integration)
    - Total existing tests: approximately 14-20 tests
  - [x] 5.2 Analyze test coverage gaps for Team Admin feature
    - Identify critical user workflows lacking coverage
    - Focus ONLY on gaps related to Team Admin requirements
    - Prioritize end-to-end workflows over unit test gaps
    - Check authorization flows (Global Admin, Team OWNER, Team ADMIN)
  - [x] 5.3 Write up to 8 additional strategic tests
    - Add maximum 8 new tests for critical gaps
    - Priority tests:
      - E2E: Create team and add first member workflow
      - E2E: Team OWNER can manage members
      - E2E: Non-admin cannot access team admin pages
      - Integration: Member role change reflects in UI
    - Skip edge cases and accessibility tests unless business-critical
  - [x] 5.4 Run feature-specific tests only
    - Run ONLY tests related to Team Admin feature
    - Expected total: approximately 22-28 tests
    - Do NOT run the entire application test suite
    - Verify critical workflows pass

**Acceptance Criteria:**
- All feature-specific tests pass (approximately 22-28 tests)
- Critical authorization flows are covered
- No more than 8 additional tests added
- Testing focused exclusively on Team Admin feature

---

## Execution Order

Recommended implementation sequence:

1. **Task Group 1: API Route Refactoring** (Backend)
   - Foundation for all frontend work
   - Must complete before frontend can connect

2. **Task Group 2: Team Service und Types** (Frontend)
   - Depends on finalized API
   - Provides typed interface for UI components

3. **Task Group 3: Team Admin Pages** (Frontend)
   - Depends on service layer
   - Core feature implementation

4. **Task Group 4: Employee Integration** (Frontend)
   - Depends on Team Admin Pages being functional
   - Extends existing employee management

5. **Task Group 5: Test Review** (QA)
   - Depends on all implementation complete
   - Final verification and gap filling

## Technical Notes

### TanStack Query Keys
```typescript
['teams']                    // Team list
['teams', { search, page }]  // Team list with filters
['team', teamId]             // Single team
['teamMembers', teamId]      // Members of a team
['employee', employeeId]     // Invalidate on membership change
```

### Authorization Rules
| Action | Global Admin | Team OWNER | Team ADMIN | EDITOR/VIEWER |
|--------|--------------|------------|------------|---------------|
| Create Team | Yes | No | No | No |
| Deactivate Team | Yes | No | No | No |
| Edit Team Metadata | Yes | Yes | No | No |
| Add/Remove Members | Yes | Yes | Yes | No |
| Change Member Roles | Yes | Yes | Yes | No |
| View Team | Yes | Yes | Yes | Yes |

### Files to Create
- `frontend/src/types/team.ts`
- `frontend/src/services/team.service.ts`
- `frontend/src/components/admin/TeamForm.tsx`
- `frontend/src/components/admin/AddMemberDialog.tsx`
- `frontend/src/components/admin/RoleSelect.tsx`
- `frontend/src/components/TeamBadges.tsx`
- `frontend/src/pages/admin/TeamsPage.tsx`
- `frontend/src/pages/admin/TeamDetailPage.tsx`

### Files to Modify
- `backend/src/routes/team-groups.ts` - Route prefix change
- `backend/src/app.ts` - Route registration
- `backend/src/services/team-group.service.ts` - Add search parameter
- `backend/src/controllers/team-group.controller.ts` - Add members endpoint
- `frontend/src/App.tsx` - Add routes
- `frontend/src/pages/admin/EmployeesPage.tsx` - Add Teams column
- `frontend/src/components/admin/EmployeeForm.tsx` - Add team assignment
