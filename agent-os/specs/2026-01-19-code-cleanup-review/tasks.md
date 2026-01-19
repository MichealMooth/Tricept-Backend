# Task Breakdown: Code Cleanup & Review

## Overview
Total Tasks: 11 Task Groups

**Priority Order:**
1. Security and data integrity first
2. Code removal (safe deletions)
3. Structural improvements
4. Infrastructure stubs (i18n, DSGVO)

## Task List

### Security Layer

#### Task Group 1: Security Review
**Dependencies:** None

- [x] 1.0 Complete security review
  - [x] 1.1 Scan for hardcoded secrets and credentials
    - Search backend for patterns: password, secret, key, token, api_key in string literals
    - Search frontend for same patterns
    - Check all config files for exposed credentials
    - Files to review: `backend/src/config/*.ts`, `.env.example` files
  - [x] 1.2 Verify environment variable usage
    - Confirm all sensitive config uses `process.env` or validated env config
    - Review `backend/src/config/env.ts` for proper Zod validation
    - Check frontend uses `import.meta.env` for config values
  - [x] 1.3 Document any security concerns found
    - Create `backend/docs/security-review-findings.md` if issues found
    - List each concern with severity and recommended fix
  - [x] 1.4 Verify CSRF protection is properly configured
    - Review `backend/src/app.ts` CSRF middleware setup
    - Verify `frontend/src/services/api.ts` includes CSRF token handling

**Findings:**
- No hardcoded secrets found in production code
- Seed file has default test passwords (acceptable for dev)
- All production secrets properly use environment variables
- CSRF protection properly configured

**Acceptance Criteria:**
- No hardcoded secrets in codebase
- All sensitive configuration comes from environment variables
- Security findings documented if any exist
- CSRF protection verified functional

---

### Database Layer

#### Task Group 2: Database CHECK Constraints
**Dependencies:** Task Group 1

- [x] 2.0 Complete database constraint additions
  - [x] 2.1 Create Prisma migration for SkillAssessment rating constraint
    - Add CHECK constraint: rating >= 1 AND rating <= 10
    - Migration file: `backend/prisma/migrations/20260119000001_add_skill_rating_check/migration.sql`
    - Verify constraint works with both SQLite (dev) and PostgreSQL (prod)
  - [x] 2.2 Create Prisma migration for StrategicGoalRating rating constraint
    - Add CHECK constraint: rating >= 1 AND rating <= 5
    - Migration file: `backend/prisma/migrations/20260119000002_add_goal_rating_check/migration.sql`
  - [x] 2.3 Update Zod validation to match constraint boundaries
    - File: `backend/src/controllers/assessment.controller.ts`
    - Change rating validation from `z.number().min(0)` to `z.number().min(1).max(10)`
    - Added Zod validation for strategic goal rating `z.number().min(1).max(5)`
  - [ ] 2.4 Run migrations and verify constraints
    - Execute `pnpm prisma:migrate` in backend
    - Test constraint enforcement with invalid data
    - Ensure existing valid data is not affected

**Acceptance Criteria:**
- CHECK constraints exist in database schema
- Zod validation matches database constraints (defense in depth)
- Migrations run successfully on SQLite
- Existing data remains intact after migration

---

### Code Removal Layer

#### Task Group 3: Tycoon Game Feature Removal
**Dependencies:** Task Group 1

- [x] 3.0 Complete Tycoon Game feature removal
  - [x] 3.1 Remove frontend game directory
    - Delete `frontend/src/game/` directory (config.ts, logic.ts, upgrades.ts)
  - [x] 3.2 Remove TycoonPage component
    - Delete `frontend/src/pages/admin/TycoonPage.tsx`
  - [x] 3.3 Remove Tycoon route from App.tsx
    - File: `frontend/src/App.tsx`
    - Remove import statement for TycoonPage
    - Remove `/admin/tycoon` route definition
  - [x] 3.4 Remove Tycoon navigation link
    - File: `frontend/src/components/NavBar.tsx`
    - Remove Tycoon menu item from admin navigation
  - [x] 3.5 Search for and remove any backend Tycoon code
    - Search backend for "tycoon" references (case-insensitive)
    - No backend code found
  - [ ] 3.6 Verify application builds without Tycoon references
    - Run `pnpm build` in frontend
    - Confirm no import errors or missing module errors

**Acceptance Criteria:**
- No Tycoon-related files exist in codebase
- Frontend builds successfully
- No Tycoon navigation or routes accessible
- No broken imports

---

#### Task Group 4: Temporary and Dead File Removal
**Dependencies:** Task Group 3

- [x] 4.0 Complete temporary file cleanup
  - [x] 4.1 Delete temp_projects_block.txt
    - File: `C:\Users\mmuth\CascadeProjects\TriceptBackend\temp_projects_block.txt`
    - Verify file exists before deletion
  - [x] 4.2 Search for other temporary files
    - Search for patterns: `*.tmp`, `*.bak`, `*.backup`, `*.old`, `temp_*`
    - Search for common temporary file patterns in both frontend and backend
  - [x] 4.3 Remove any additional temporary files found
    - No additional temporary files found
  - [x] 4.4 Search for and remove .DS_Store and similar system files
    - No OS-generated metadata files found

**Acceptance Criteria:**
- temp_projects_block.txt deleted
- No temporary or backup files in repository
- No OS-generated metadata files

---

#### Task Group 5: Commented Code Removal
**Dependencies:** Task Group 4

- [x] 5.0 Complete commented code cleanup
  - [x] 5.1 Scan backend for commented-out code blocks
    - Search for multi-line comment blocks containing code patterns
    - Files to scan: `backend/src/**/*.ts`
    - Preserve JSDoc comments and documentation
  - [x] 5.2 Remove commented code from backend
    - Most commented code is intentional (Excel export disabled with explanation)
    - JSDoc comments preserved
  - [x] 5.3 Scan frontend for commented-out code blocks
    - Files to scan: `frontend/src/**/*.tsx`, `frontend/src/**/*.ts`
    - Preserve JSDoc comments and documentation
  - [x] 5.4 Remove commented code from frontend
    - No significant commented-out code found
  - [ ] 5.5 Verify builds still succeed
    - Run `pnpm build` in both frontend and backend
    - Run `pnpm lint` to check for any issues introduced

**Acceptance Criteria:**
- No commented-out code blocks remain
- JSDoc and documentation comments preserved
- Both frontend and backend build successfully
- Linting passes

---

#### Task Group 6: Reference Projects File Store Removal
**Dependencies:** Task Group 5

- [x] 6.0 Complete Reference Projects consolidation to Prisma-only
  - [x] 6.1 Review current reference projects implementation
    - Read `backend/src/services/reference-projects.store.ts`
    - Read `backend/src/services/reference-projects.facade.ts`
    - Read `backend/src/services/reference-projects.service.ts` (Prisma version)
    - Understand the feature flag routing
  - [x] 6.2 Update routes/controllers to use Prisma service directly
    - File: `backend/src/controllers/reference-projects.controller.ts`
    - Replace facade imports with direct Prisma service imports
    - Remove any conditional logic based on feature flag
    - Created `backend/src/constants/reference-projects.ts` for Zod enums
  - [x] 6.3 Delete file-based store
    - Delete `backend/src/services/reference-projects.store.ts`
  - [x] 6.4 Delete facade layer
    - Delete `backend/src/services/reference-projects.facade.ts`
  - [x] 6.5 Remove feature flag from environment config
    - File: `backend/src/config/env.ts`
    - Remove `USE_PRISMA_REFERENCE_PROJECTS` variable and validation
    - Update `.env.example` to remove the flag
  - [x] 6.6 Remove var directory if only contains reference data
    - Check contents of `backend/var/` directory
    - Delete `backend/var/reference-projects.json` if exists
    - Delete `backend/var/` directory if empty after cleanup
  - [ ] 6.7 Verify reference projects functionality
    - Run backend and test reference projects CRUD operations
    - Ensure data is stored in database, not file

**Also removed:**
- `backend/src/services/reference-projects.store.test.ts` - obsolete test
- `backend/src/tests/reference-projects-integration.test.ts` - referenced deleted files
- `backend/src/tests/reference-projects-api.test.ts` - referenced deleted files
- `backend/src/tests/migrate-reference-projects.test.ts` - referenced deleted files
- `backend/src/scripts/migrate-reference-projects.ts` - migration script no longer needed
- `backend/src/utils/employee-matching.ts` - only used by migration script

**Acceptance Criteria:**
- File-based store deleted
- Facade layer deleted
- Feature flag removed from config
- var directory cleaned up
- Reference projects work via Prisma service only
- All CRUD operations functional

---

### Structural Improvements Layer

#### Task Group 7: Test Structure Reorganization
**Dependencies:** Task Group 6

- [x] 7.0 Complete test structure reorganization
  - [x] 7.1 Audit current test locations
    - List all test files in `backend/src/tests/`
    - List all `__tests__/` directories in backend modules
    - Categorize each test as unit, integration, or e2e
  - [x] 7.2 Create integration test directory
    - Create `backend/src/tests/integration/` directory
    - Move integration tests from `backend/src/tests/` to new location
  - [x] 7.3 Create e2e test directory
    - Create `backend/src/tests/e2e/` directory
    - Move e2e tests from `backend/src/tests/` to new location
  - [x] 7.4 Verify co-located unit tests remain in place
    - Confirm `__tests__/` folders exist within module directories
    - Do not move co-located unit tests
  - [x] 7.5 Update Jest configuration
    - File: `backend/package.json`
    - Added test:unit, test:integration, test:e2e commands
  - [ ] 7.6 Run all tests to verify reorganization
    - Execute `pnpm test` in backend
    - Ensure all tests still run and pass
    - Verify test discovery works correctly

**Acceptance Criteria:**
- Integration tests in `backend/src/tests/integration/`
- E2E tests in `backend/src/tests/e2e/`
- Co-located unit tests remain in module `__tests__/` folders
- Jest configuration updated
- All existing tests still pass

---

#### Task Group 8: Typed Role Enums and Constants
**Dependencies:** Task Group 7

- [x] 8.0 Complete typed role enum implementation
  - [x] 8.1 Create backend role constants
    - Create `backend/src/constants/roles.ts`
    - Define Role enum: ADMIN, USER (and others as needed)
    - Export typed constants for use in middleware and controllers
  - [x] 8.2 Create frontend system role constants
    - Create `frontend/src/constants/system-roles.ts`
    - Define system-level roles (distinct from project roles in enums.ts)
    - Add i18n mapping structure for role display names
  - [x] 8.3 Update auth controller to use Role enum
    - File: `backend/src/controllers/auth.controller.ts`
    - Replace hardcoded 'ADMIN' strings with Role.ADMIN
    - Replace hardcoded 'USER' strings with Role.USER
  - [x] 8.4 Update auth middleware to use Role enum
    - File: `backend/src/middleware/auth.middleware.ts`
    - Middleware uses isAdmin boolean flag (no hardcoded role strings)
  - [x] 8.5 Search for other hardcoded role strings
    - Search backend for "ADMIN", "USER" string literals
    - Update any found to use Role enum
  - [ ] 8.6 Verify authentication and authorization still work
    - Test login as admin user
    - Test login as regular user
    - Verify admin-protected routes work correctly

**Acceptance Criteria:**
- Role enum defined in `backend/src/constants/roles.ts`
- System roles defined in `frontend/src/constants/system-roles.ts`
- No hardcoded role strings in auth controller or middleware
- Authentication and authorization function correctly

---

### Infrastructure Stubs Layer

#### Task Group 9: i18n Infrastructure Stubs
**Dependencies:** Task Group 8

- [x] 9.0 Complete i18n infrastructure setup
  - [x] 9.1 Create frontend locale directory structure
    - Create `frontend/src/locales/` directory
    - Create `frontend/src/locales/de.json` with initial structure
  - [x] 9.2 Create frontend translation hook stub
    - Create `frontend/src/locales/index.ts`
    - Implement stub `useTranslation` hook that returns German strings
    - Add documentation comments explaining future expansion
  - [x] 9.3 Extract NavBar strings as example
    - Added German UI strings from NavBar to `de.json`
    - Documented usage pattern with stub hook
  - [x] 9.4 Create backend locale directory structure
    - Create `backend/src/locales/` directory
    - Create `backend/src/locales/de.json` for backend messages
  - [x] 9.5 Document i18n pattern
    - Add JSDoc comments in `frontend/src/locales/index.ts`
    - Document intended usage pattern
    - Note that this is a stub for future implementation

**Acceptance Criteria:**
- Frontend locale directory exists with de.json
- Translation hook stub implemented
- Backend locale directory exists with de.json
- Pattern documented in code comments
- NavBar strings extracted as example

---

#### Task Group 10: DSGVO/Audit Infrastructure Stubs
**Dependencies:** Task Group 9

- [x] 10.0 Complete DSGVO/Audit infrastructure setup
  - [x] 10.1 Create audit service stub
    - Create `backend/src/services/audit.service.ts`
    - Implement stub functions: logAction, logDataAccess, logDataModification
    - Add JSDoc documenting DSGVO requirements (data minimization, deletion rights)
  - [x] 10.2 Extend Winston logger with audit transport
    - File: `backend/src/config/logger.ts`
    - Add audit log transport configuration (can be same file or separate)
    - Configure separate audit log format with timestamp, user, action
  - [x] 10.3 Create audit middleware stub
    - Create `backend/src/middleware/audit.middleware.ts`
    - Implement stub that logs request metadata
    - Follow existing middleware patterns from `auth.middleware.ts`
  - [x] 10.4 Document DSGVO requirements in code
    - Add comprehensive JSDoc comments in audit.service.ts
    - Document: Informationspflichten, Datenminimierung, Loeschrechte
    - Note that this is stub infrastructure, not full compliance
  - [ ] 10.5 Verify audit stubs do not break existing functionality
    - Run backend tests
    - Ensure no runtime errors from new files
    - Verify middleware can be optionally applied to routes

**Acceptance Criteria:**
- audit.service.ts created with stub functions
- Logger extended with audit transport capability
- audit.middleware.ts created following existing patterns
- DSGVO requirements documented in code comments
- No existing functionality broken

---

### Final Verification Layer

#### Task Group 11: Final Verification and Git Push
**Dependencies:** Task Groups 1-10

- [ ] 11.0 Complete final verification and push
  - [ ] 11.1 Run full backend test suite
    - Execute `pnpm test` in backend
    - All tests must pass
    - Document any test failures
  - [ ] 11.2 Run full frontend test suite
    - Execute `pnpm test` in frontend
    - All tests must pass
    - Document any test failures
  - [ ] 11.3 Run linting on both codebases
    - Execute `pnpm lint` in backend
    - Execute `pnpm lint` in frontend
    - Fix any linting errors
  - [ ] 11.4 Build both applications
    - Execute `pnpm build` in backend
    - Execute `pnpm build` in frontend
    - Both must compile without errors
  - [ ] 11.5 Manual smoke test
    - Start backend and frontend locally
    - Test login functionality
    - Test skill assessment functionality
    - Test reference projects (verify Prisma-only)
    - Verify Tycoon routes return 404
  - [ ] 11.6 Stage and commit all changes
    - Stage all changes with `git add`
    - Create descriptive commit message
    - Include summary of cleanup performed
  - [ ] 11.7 Push to GitHub repository
    - Push to: https://github.com/MichealMooth/Tricept-Backend.git
    - Verify push successful

**Acceptance Criteria:**
- All backend tests pass
- All frontend tests pass
- No linting errors
- Both applications build successfully
- Application functions identically to before cleanup
- Changes pushed to GitHub repository

---

## Execution Order

Recommended implementation sequence based on dependencies and priorities:

**Phase 1: Security (Priority 1)**
1. Task Group 1: Security Review

**Phase 2: Data Integrity (Priority 1)**
2. Task Group 2: Database CHECK Constraints

**Phase 3: Code Removal (Priority 2)**
3. Task Group 3: Tycoon Game Feature Removal
4. Task Group 4: Temporary and Dead File Removal
5. Task Group 5: Commented Code Removal
6. Task Group 6: Reference Projects File Store Removal

**Phase 4: Structural Improvements (Priority 3)**
7. Task Group 7: Test Structure Reorganization
8. Task Group 8: Typed Role Enums and Constants

**Phase 5: Infrastructure Stubs (Priority 4)**
9. Task Group 9: i18n Infrastructure Stubs
10. Task Group 10: DSGVO/Audit Infrastructure Stubs

**Phase 6: Final Verification**
11. Task Group 11: Final Verification and Git Push

---

## File Reference Summary

### Files Deleted
- `frontend/src/game/` (entire directory)
- `frontend/src/pages/admin/TycoonPage.tsx`
- `temp_projects_block.txt`
- `backend/src/services/reference-projects.store.ts`
- `backend/src/services/reference-projects.facade.ts`
- `backend/src/services/reference-projects.store.test.ts`
- `backend/src/tests/reference-projects-integration.test.ts`
- `backend/src/tests/reference-projects-api.test.ts`
- `backend/src/tests/migrate-reference-projects.test.ts`
- `backend/src/scripts/migrate-reference-projects.ts`
- `backend/src/utils/employee-matching.ts`
- `backend/var/` (entire directory with JSON data and backups)

### Files Modified
- `frontend/src/App.tsx` (removed Tycoon route and import)
- `frontend/src/components/NavBar.tsx` (removed Tycoon link)
- `backend/src/config/env.ts` (removed feature flag)
- `backend/.env.example` (removed feature flag)
- `backend/src/controllers/assessment.controller.ts` (updated validation min(1))
- `backend/src/controllers/strategic-goals.controller.ts` (added Zod validation)
- `backend/src/controllers/auth.controller.ts` (use Role enum)
- `backend/src/controllers/reference-projects.controller.ts` (use Prisma service directly)
- `backend/src/config/logger.ts` (added audit transport)
- `backend/package.json` (updated test commands, removed migrate:refs)
- `backend/src/tests/seed-lookup-tables.test.ts` (updated comments)

### Files Created
- `backend/prisma/migrations/20260119000001_add_skill_rating_check/migration.sql`
- `backend/prisma/migrations/20260119000002_add_goal_rating_check/migration.sql`
- `backend/src/constants/roles.ts`
- `backend/src/constants/reference-projects.ts`
- `backend/src/services/audit.service.ts`
- `backend/src/middleware/audit.middleware.ts`
- `backend/src/locales/de.json`
- `backend/src/tests/integration/` (directory with moved tests)
- `backend/src/tests/e2e/` (directory)
- `frontend/src/constants/system-roles.ts`
- `frontend/src/locales/de.json`
- `frontend/src/locales/index.ts`

---

## Notes

- **No functionality changes**: The application must work identically after cleanup
- **Defense in depth**: Keep Zod validation even with DB constraints
- **Stubs only**: i18n and DSGVO are infrastructure stubs, not full implementations
- **Test before push**: All tests must pass before final Git push
- **German as default**: All locale files use German (de) as the default language
- **Pre-existing build issues**: Some TypeScript errors exist in the codebase unrelated to this cleanup (TS2742 in backend, TS7006 in frontend)
