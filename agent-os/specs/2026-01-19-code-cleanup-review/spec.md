# Specification: Code Cleanup & Review

## Goal

Perform comprehensive code cleanup and review of the Tricept Backend to improve maintainability, security, and code quality while ensuring all existing functionality continues to work identically after changes.

## User Stories

- As a developer, I want dead code and unused features removed so that the codebase is easier to understand and maintain.
- As a developer, I want a clear test structure with co-located unit tests and separate integration/e2e tests so that I can efficiently run and maintain different test types.
- As a security-conscious organization, I want database-level constraints and proper audit logging infrastructure so that data integrity is enforced at multiple layers.

## Specific Requirements

**1. Test Structure Reorganization**
- Keep co-located unit tests in `__tests__/` folders within each module directory
- Move integration tests to `backend/src/tests/integration/`
- Move E2E tests to `backend/src/tests/e2e/`
- Update Jest configuration to recognize the new test paths
- Ensure existing tests in `backend/src/tests/` are categorized appropriately

**2. Tycoon Game Feature Removal**
- Delete `frontend/src/game/` directory (contains config.ts, logic.ts, upgrades.ts)
- Delete `frontend/src/pages/admin/TycoonPage.tsx`
- Remove `/admin/tycoon` route from `frontend/src/App.tsx`
- Remove TycoonPage import from App.tsx
- Remove Tycoon link from `frontend/src/components/NavBar.tsx`
- Search and remove any backend tycoon-related routes or services if present

**3. Temporary File Removal**
- Delete `temp_projects_block.txt` from repository root
- Search for and remove any other temporary or backup files

**4. Commented Code Removal**
- Scan entire codebase for commented-out code blocks (multi-line comments containing code)
- Remove all commented-out code sections in both frontend and backend
- Preserve legitimate documentation comments and JSDoc annotations

**5. Reference Projects Cleanup**
- Delete `backend/src/services/reference-projects.store.ts` (file-based store)
- Remove `USE_PRISMA_REFERENCE_PROJECTS` feature flag from `backend/src/config/env.ts`
- Delete `backend/src/services/reference-projects.facade.ts` (feature flag router)
- Update reference projects routes/controllers to use Prisma service directly
- Remove `backend/var/` directory if it only contains reference-projects.json
- ReferenceProject Prisma model already exists in schema.prisma (keep as-is)

**6. i18n Infrastructure (Stubs)**
- Create `frontend/src/locales/` directory structure with `de.json` as default locale
- Create `frontend/src/locales/index.ts` with central translation hook/function stub
- Extract hardcoded German UI strings from NavBar.tsx as example migration
- Create `backend/src/locales/` with `de.json` for backend messages
- Document i18n pattern in code comments for future expansion

**7. DSGVO/Audit Infrastructure (Stubs)**
- Create `backend/src/services/audit.service.ts` with basic audit logging stub
- Extend existing Winston logger (`backend/src/config/logger.ts`) with audit log transport
- Create `backend/src/middleware/audit.middleware.ts` stub for request logging
- Add documentation comments outlining DSGVO requirements (data minimization, information duties, deletion rights)
- Do NOT implement full DSGVO compliance - only document and stub

**8. Typed Role Enums/Constants**
- Create `backend/src/constants/roles.ts` with typed Role enum (ADMIN, USER, etc.)
- Create `frontend/src/constants/system-roles.ts` for system-level roles (distinct from project roles in enums.ts)
- Replace hardcoded 'ADMIN' strings in `backend/src/controllers/auth.controller.ts` with enum
- Add i18n mapping structure for role display names

**9. Database CHECK Constraints**
- Create Prisma migration adding CHECK constraint for SkillAssessment.rating (1-10)
- Create Prisma migration adding CHECK constraint for StrategicGoalRating.rating (1-5)
- Note: SQLite supports CHECK constraints; ensure migration works for dev and production
- Keep existing Zod validation (defense in depth approach)
- Update assessment controller validation from min(0) to min(1) to match constraint

**10. Security Review**
- Verify no hardcoded secrets or credentials in codebase
- Ensure all sensitive config comes from environment variables
- Review and document any security concerns found

## Existing Code to Leverage

**Winston Logger (backend/src/config/logger.ts)**
- Already configured with timestamp, JSON format for production, colorized dev format
- Extend with audit-specific transport for DSGVO logging
- Use as base for audit.service.ts implementation

**Prisma Schema (backend/prisma/schema.prisma)**
- ReferenceProject model already fully defined with Role, Topic lookup tables
- SkillAssessment and StrategicGoalRating models ready for CHECK constraints
- Use existing migration patterns for new constraint migrations

**Frontend Constants (frontend/src/constants/enums.ts)**
- Topics and Roles already defined as const arrays with TypeScript types
- Follow same pattern for system-level roles and i18n structure
- roleOptions pattern can be replicated for i18n label mapping

**Reference Projects Prisma Service (backend/src/services/reference-projects.service.ts)**
- Already implements full CRUD via Prisma
- Use directly after removing facade layer
- Feature flag comment indicates this is the intended final implementation

**Auth Middleware (backend/src/middleware/auth.middleware.ts)**
- isAdmin and isAuthenticated patterns established
- Follow same middleware pattern for audit.middleware.ts stub

## Out of Scope

- Premium feature implementation (explicitly removed from scope)
- Full i18n implementation with multiple languages (only German stubs)
- Full DSGVO compliance implementation (only infrastructure stubs)
- New feature development
- Complete refactoring of existing working functionality
- Frontend component library changes
- Database schema changes beyond CHECK constraints
- Performance optimization work
- UI/UX redesign
- Migration to PostgreSQL for development (keep SQLite for dev)
