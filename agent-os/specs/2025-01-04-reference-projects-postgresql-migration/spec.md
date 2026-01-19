# Specification: Reference Projects PostgreSQL Migration

## Goal
Migrate reference projects from the file-based JSON store (`backend/var/reference-projects.json`) to PostgreSQL using Prisma ORM, enabling consistent data persistence in the production database with enhanced schema support for employee linking, lookup tables for roles/topics, and future Kurzprofil integration.

## User Stories
- As a system administrator, I want reference projects stored in PostgreSQL so that data is reliably persisted alongside all other application data.
- As a developer, I want to use Prisma for reference project operations so that queries, relationships, and transactions are consistent with the rest of the backend.

## Specific Requirements

**Prisma Model: ReferenceProject**
- Primary key: UUID with `@default(uuid())`, preserving existing IDs during migration
- Required fields: `project_name`, `customer`, `project_description`, `activity_description`, `duration_from`, `duration_to`, `contact_person`, `approved`
- New optional fields: `short_teaser` (VARCHAR 150, validated 100-150 chars), `short_project_description` (TEXT)
- Fallback field: `person_legacy` (nullable String) for unmatched employee references
- Foreign key: `roleId` referencing `Role` lookup table
- Timestamps: `createdAt`, `updatedAt` with `@default(now())` and `@updatedAt`

**Prisma Model: Role (Lookup Table)**
- Primary key: UUID, unique `name` field
- Seed with existing enum values: Projektleiter, IT-Projektleiter, PMO, Testmanager, Projektunterstuetzung, Business-Analyst, Scrum-Master, Tester, TPL, PO
- Admin-extensible without deploy (new roles added via DB, later Admin-UI)

**Prisma Model: Topic (Lookup Table)**
- Primary key: UUID, unique `name` field
- Seed with existing enum values: Testmanagement, Migration, Cut Over, Agile Transformation, Digitale Transformation, Prozessoptimierung, Regulatorik/Compliance, Informationssicherheit
- Admin-extensible without deploy

**Junction Table: ReferenceProjectTopic**
- Composite primary key: `referenceProjectId` + `topicId`
- Enforces Many-to-Many between ReferenceProject and Topic
- Business rule: max 6 topics per project (validated at service layer, not DB constraint)

**Junction Table: ReferenceProjectEmployee**
- Composite primary key: `referenceProjectId` + `employeeId`
- Minimal structure: FK only, no additional fields (role, involvement %, dates)
- Future extension possible but out of scope for this migration

**Migration Script Design**
- Location: `backend/src/scripts/migrate-reference-projects.ts`
- Command: `pnpm migrate:refs` with `--dry-run` flag
- Pre-migration: Automatic JSON backup to `backend/var/reference-projects.backup.json`
- Transactional batch processing with rollback on errors
- Idempotent: Skip existing records by ID (append-only, no updates from JSON)
- Preserve existing IDs and timestamps (backfill from file mtime or `now()`)

**Employee Matching Logic**
- Preprocessing: `trim()`, `toLowerCase()`, collapse redundant whitespace
- Match against `Employee.firstName + " " + Employee.lastName` (case-insensitive)
- 0 matches: Set `person_legacy`, project remains valid, log for manual review
- 1 exact match: Create `ReferenceProjectEmployee` relation
- Multiple exact matches: Throw error, log candidates, halt or skip (configurable via `--on-conflict=halt|skip`)
- NO fuzzy matching, initials matching, or heuristic similarity

**Feature Flag Implementation**
- Environment variable: `USE_PRISMA_REFERENCE_PROJECTS=true`
- Service layer checks flag to route to Prisma or File-Store
- File-Store code remains behind feature flag (not deleted) for emergency rollback
- Differentiated between deployment stages (dev, staging, production)

**API Backward Compatibility**
- JSON response format unchanged for frontend compatibility
- `person` field derived from Employee relation or `person_legacy` fallback
- Optional new filter parameters: `roleId`, `topicId` (in addition to existing string filters)
- Existing endpoints maintain same behavior: list, getById, create, update, delete

## Visual Design
No visual assets provided.

## Existing Code to Leverage

**`backend/prisma/schema.prisma` - Existing Prisma Models**
- `StrategicGoal` and `StrategicGoalRating` demonstrate lookup table + relation pattern
- `UserProfile` shows how to extend Employee with additional data and timestamps
- `SkillCategory` shows self-referencing and relationship patterns
- Follow existing UUID, timestamp, and index conventions

**`backend/src/services/reference-projects.store.ts` - Current File Store**
- Zod schemas (`RolesEnum`, `TopicsEnum`, `ReferenceProjectSchema`) provide validation patterns to adapt
- CRUD operations (`list`, `getById`, `create`, `update`, `remove`) to replicate in Prisma service
- Query/filter logic (`search`, `role`, `topic`, `page`, `pageSize`) to maintain in new service
- Existing field names and types to preserve for API compatibility

**`backend/src/services/strategic-goals.service.ts` - Service Pattern**
- Demonstrates Prisma service layer patterns with transactions (`prisma.$transaction`)
- Shows upsert pattern with `prisma.*.upsert()` for idempotent operations
- Type definitions for service inputs (`StrategicGoalInput`)
- Error handling and null coalescing patterns

**`backend/src/config/database.ts` - Prisma Client**
- Existing Prisma client initialization and connection management
- Import pattern: `import { prisma } from '@/config/database'`

**`backend/src/config/env.ts` - Environment Variables**
- Zod-based environment variable validation pattern
- Add `USE_PRISMA_REFERENCE_PROJECTS` boolean with default `false`

## Out of Scope
- Frontend redesign or UX changes (except necessary adjustments for DB switch)
- Admin UI for Roles/Topics management (only DB tables + seeds)
- Export features (PPT/CSV/Excel generation)
- Historization or Audit-Log for reference project changes
- Full-text search or ranking functionality
- CI/CD pipeline changes beyond migration necessities
- Fuzzy matching, initials matching, or heuristic employee matching
- Extended junction table fields (role per project, involvement %, assignment dates)
- Kurzprofil UI integration (schema prepared but UI deferred)
- Automated scheduled migrations or dual-write capability
