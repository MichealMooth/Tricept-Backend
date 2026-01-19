# Spec Requirements: Reference Projects PostgreSQL Migration

## Initial Description
Migration der Referenzprojekte von file-based Store zu PostgreSQL mit Prisma Model. Alle Daten einheitlich in der Produktionsdatenbank persistent.

**Context:** The Tricept Skill Matrix Management System currently stores reference projects in a file-based in-memory store at `backend/var/reference-projects.json`. This migration will move all data to PostgreSQL using Prisma ORM while also implementing schema enhancements for future features (Kurzprofil integration, employee linking).

## Requirements Discussion

### First Round Questions

**Q1:** Migration Strategy - Should we implement a one-time migration script or a gradual transition with dual-write capability?
**Answer:** Einmaliges, idempotentes Migrationsskript (JSON -> Prisma/DB) mit Dry-Run + Backup, danach File-Store deaktivieren.

**Implementation Details:**
- `pnpm migrate:refs --dry-run` (validates, logs deviations, stops on errors)
- Full run in transaction per batch; rollback on errors
- Preserve existing IDs, backfill timestamps (from file/mtime or now())
- Complete pre-migration backup of JSON file
- After success: Feature-Flag/Env-Switch to Prisma and remove/hide File-Store code behind feature flag

**Q2:** Schema Extensions - Should we add new fields now (short_teaser, short_project_description) or wait?
**Answer:** Jetzt vorbereiten, aber nicht-breaking gestalten (Felder optional).

**New Fields:**
- `short_teaser` (VARCHAR(150)) - optional, validation 100-150 characters
- `short_project_description` (TEXT) - optional
- No UI requirement yet; backend accepts/serves, frontend can use later

**Q3:** Employee Linking - How should we handle the person -> Employee relationship?
**Answer:** Jetzt umsetzen mit Many-to-Many plus Fallback.

**Implementation:**
- Many-to-Many `ReferenceProjectEmployee` plus optional `person_legacy` (STRING) as fallback
- Tables: `ReferenceProject`, `Employee`, `ReferenceProjectEmployee` (PK: composite), field `person_legacy` nullable
- Migration mapping: Attempt match person -> Employee (case-insensitive, trim). If found -> relation; otherwise write `person_legacy`

**Q4:** Role and Topics Fields - Should we keep as enums or move to lookup tables?
**Answer:** Hybrid, flexible & secure with lookup tables.

**Implementation:**
- Role: FK to table `Role` (single value)
- Topics: Many-to-Many via `ReferenceProjectTopic` + table `Topic` (up to 6)
- Admin extensibility without deploy: New roles/topics via DB (later Admin-UI)
- Seed existing enum values into Role and Topic tables during migration

**Q5:** ID Format - Should we preserve existing IDs or regenerate UUIDs?
**Answer:** Prisma `@default(uuid())` for new records, preserve existing IDs.

**Implementation:**
- On import, set id from JSON (Prisma allows explicit IDs)
- New records use auto-generated UUID

**Q6:** API Compatibility - Should we maintain backward compatibility?
**Answer:** JSON responses must remain compatible; new fields only optionally added.

**Implementation:**
- Frontend runs unchanged
- Internally File -> Prisma, API remains stable
- Optional: Filter/Query parameters for roleId, topicId in addition to String filters
- `person` in response continues to be output (derived from relation or person_legacy)

**Q7:** Testing & Rollback - What is the testing and rollback strategy?
**Answer:** Comprehensive testing + backup strategy.

**Tests:**
- Unit: Services/Repos (CRUD, Constraints: <=6 Topics, Required fields)
- Migration: Import against sandbox-DB; verify counts, sample diffs (JSON vs DB)
- Integration: API happy-/edge-cases (validations, filters)

**Rollback:**
- Export script DB -> `backend/var/reference-projects.backup.json` + DB backup before cut-over
- Optional: Feature-flag that briefly reactivates File-Store (only if absolutely necessary)

**Q8:** What should be explicitly out of scope?
**Answer:** Explicitly excluded:
- Frontend redesign/UX changes (except necessary adjustments for DB switch)
- New admin interfaces (e.g., Roles/Topics management) - only DB tables + seeds
- Export features (PPT/CSV/Excel)
- Historization/Audit-Log
- Full-text search/Ranking
- CI/CD changes beyond what's necessary

### Existing Code to Reference

**Similar Features Identified:**
- Feature: Existing Prisma Models - Path: `backend/prisma/schema.prisma`
  - `StrategicGoal` and `StrategicGoalRating` demonstrate lookup table + relation pattern
  - `UserProfile` shows how to extend Employee with additional data
  - `SkillCategory` shows Many-to-Many with junction tables

- Feature: Current File Store - Path: `backend/src/services/reference-projects.store.ts`
  - Current Zod schemas for validation (RolesEnum, TopicsEnum, ReferenceProjectSchema)
  - Current CRUD operations to replicate in Prisma service
  - Query/filter logic to maintain

### Follow-up Questions

**Follow-up 1:** Employee Matching Logic - What should the exact matching algorithm be, and how should we handle multiple matches or no matches?

**Answer:** Nur exakter Match (case-insensitive, trimmed) - kein Fuzzy Matching.

**Matching Algorithm:**
1. Vorverarbeitung: `trim()`, `lowercase()`, redundante Leerzeichen entfernen
2. Exakter Vergleich gegen `Employee.fullName` (oder firstName + lastName kombiniert)

**Match Results:**
- **0 Treffer** -> `person_legacy` setzen, Projekt bleibt gueltig, Relation nachpflegbar
- **1 exakter Treffer** -> Relation setzen
- **Mehrere exakte Treffer** (selten) -> Fehler werfen, mit Liste der Kandidaten loggen, Migration anhalten oder Eintrag ueberspringen (konfigurierbar)

**Explizit ausgeschlossen:**
- Fuzzy Match (Levenshtein, partial includes)
- Initials-based matching
- Heuristische Aehnlichkeitssuche

**Follow-up 2:** Feature Flag Naming - What naming convention and implementation approach for the feature flag?

**Answer:** Environment Variable `USE_PRISMA_REFERENCE_PROJECTS=true`

**Rationale:**
- Einfach und gut dokumentierbar
- Kann zwischen Deploy-Stages differenziert werden
- Verhindert unkontrollierte Live-Umschaltungen
- Kein DB-Flag fuer diesen Zweck (zu riskant fuer Datenmigration)

**Follow-up 3:** Migration bei bestehenden DB-Daten - What should happen if the database already contains records during migration?

**Answer:** Existierende Daten per ID ueberspringen - Migration ist append-only (idempotent).

**Behavior:**
- **Fall A** - Record mit ID existiert -> SKIP, Log: "Skipping existing record <id> (already present in DB)"
- **Fall B** - Record existiert mit Felddifferenzen -> auch SKIP (JSON nie als Update-Quelle)
- **Fall C** - Record nicht vorhanden -> INSERT

**Rationale:**
- DB gilt als "Source of Truth" ab Cut-over
- Kein Risiko, produktiv erfasste Daten zu ueberschreiben
- Wiederholbar ausfuehrbar

**Follow-up 4:** Junction Table (ReferenceProjectEmployee) - Should the junction table include additional fields like role or involvement percentage?

**Answer:** Fuer jetzt minimal halten - Junction Table ohne zusaetzliche Felder, nur die Relation.

**Current Structure (minimal):**
```
ReferenceProjectEmployee {
  referenceProjectId  FK
  employeeId          FK
}
```

**Rolle bleibt im ReferenceProject selbst** (wie bisher).

**Future Extension moeglich:**
```
ReferenceProjectEmployee {
  referenceProjectId  FK
  employeeId          FK
  roleId?             FK (optional)
  involvementPercent? Int (optional)
  notes?              Text (optional)
  assigned_from?      DateTime
  assigned_until?     DateTime
}
```

**Rationale:**
- Scope bleibt klein
- Keine UI-Aenderungen notwendig
- Kann jederzeit spaeter erweitert werden

## Visual Assets

### Files Provided:
No visual assets provided.

### Visual Insights:
N/A - No visual files found in the visuals folder.

## Requirements Summary

### Functional Requirements

**Core Migration:**
- Create Prisma models for ReferenceProject and related entities (Role, Topic, junction tables)
- Implement idempotent migration script with dry-run capability
- Preserve all existing data with original IDs and timestamps
- Maintain API backward compatibility

**Schema Design:**
- `ReferenceProject` model with all current fields
- `Role` lookup table (seeded with existing enum values)
- `Topic` lookup table (seeded with existing enum values)
- `ReferenceProjectTopic` junction table (Many-to-Many, max 6 topics)
- `ReferenceProjectEmployee` junction table (Many-to-Many, minimal - no extra fields)
- New optional fields: `short_teaser`, `short_project_description`
- Fallback field: `person_legacy` for unmatched employee references

**Migration Process:**
1. Pre-migration JSON backup
2. Dry-run validation
3. Transactional batch import with rollback on errors
4. Employee matching (exact match only: case-insensitive, trimmed, no fuzzy)
5. Idempotent behavior: skip existing records by ID (append-only)
6. Feature flag switch to Prisma backend
7. File-Store deactivation

**Employee Matching Rules:**
- Preprocessing: `trim()`, `lowercase()`, remove redundant whitespace
- Exact comparison against `Employee.fullName` or combined firstName + lastName
- 0 matches: Set `person_legacy`, project remains valid
- 1 exact match: Create relation
- Multiple exact matches: Throw error, log candidates, halt or skip (configurable)
- NO fuzzy matching, initials matching, or heuristic similarity

**API Requirements:**
- Maintain existing JSON response format
- Add optional roleId/topicId filter parameters
- Derive `person` field from relation or person_legacy
- No breaking changes to frontend

### Reusability Opportunities

**Components/Patterns to Reuse:**
- Prisma model patterns from existing schema (StrategicGoal, UserProfile)
- Service layer patterns from existing services
- Zod validation patterns (adapt existing schemas)
- Migration patterns from Prisma migrations

**Backend Patterns to Reference:**
- Junction table pattern from SkillCategory relationships
- Lookup table pattern from StrategicGoal
- Service layer CRUD from existing services

### Scope Boundaries

**In Scope:**
- Prisma model creation for ReferenceProject and related entities
- Role and Topic lookup tables with seed data
- Many-to-Many relations (Employee, Topics)
- Migration script with dry-run, backup, and rollback
- Optional new fields (short_teaser, short_project_description)
- Feature flag (`USE_PRISMA_REFERENCE_PROJECTS` env var) for switching between File-Store and Prisma
- Unit, migration, and integration tests
- API backward compatibility
- Idempotent migration (append-only, skip existing records)
- Minimal junction table for ReferenceProjectEmployee (FK only, no extra fields)

**Out of Scope:**
- Frontend redesign/UX changes
- Admin UI for Roles/Topics management (only DB tables + seeds)
- Export features (PPT/CSV/Excel)
- Historization/Audit-Log
- Full-text search/Ranking
- CI/CD changes beyond migration necessities
- Fuzzy matching or heuristic employee matching
- Extended junction table fields (role per project, involvement %, dates)

### Technical Considerations

**Database:**
- SQLite for development, PostgreSQL for production
- Prisma schema at `backend/prisma/schema.prisma`
- UUID primary keys with `@default(uuid())`

**Migration Script:**
- Location: `backend/src/scripts/migrate-reference-projects.ts`
- Command: `pnpm migrate:refs` with `--dry-run` option
- Transactional batch processing
- Comprehensive logging and validation
- Idempotent: Skips existing records by ID (no updates from JSON)
- Configurable behavior for multiple employee matches (halt vs skip)

**Existing Enum Values to Seed:**

Roles:
- Projektleiter
- IT-Projektleiter
- PMO
- Testmanager
- Projektunterstuetzung
- Business-Analyst
- Scrum-Master
- Tester
- TPL
- PO

Topics:
- Testmanagement
- Migration
- Cut Over
- Agile Transformation
- Digitale Transformation
- Prozessoptimierung
- Regulatorik/Compliance
- Informationssicherheit

**Feature Flag:**
- Environment variable: `USE_PRISMA_REFERENCE_PROJECTS=true`
- Simple, well-documented approach
- Can be differentiated between deployment stages
- Prevents uncontrolled live switching
- No database flag (too risky for data migration)

**Validation:**
- Maintain Zod validation at service layer
- Prisma handles database constraints
- topics array: min 1, max 6 entries
- short_teaser: 100-150 characters when provided

**Employee Matching Implementation:**
- Preprocessing: trim, lowercase, collapse whitespace
- Match against Employee.fullName or firstName + lastName
- Exact match only (no fuzzy, no initials, no heuristics)
- Log all match attempts and results
- Configurable handling for edge cases (multiple matches)

## Decisions Summary

| Decision Area | Final Decision |
|---------------|----------------|
| Migration Type | One-time, idempotent script with dry-run |
| Schema Extensions | New optional fields now (short_teaser, short_project_description) |
| Employee Linking | Many-to-Many with person_legacy fallback |
| Role/Topics | Lookup tables (not enums) |
| ID Format | Preserve existing, UUID for new |
| API Compatibility | Full backward compatibility |
| Employee Matching | Exact match only (case-insensitive, trimmed) |
| Feature Flag | Environment variable USE_PRISMA_REFERENCE_PROJECTS |
| Existing DB Records | Skip by ID (append-only, idempotent) |
| Junction Table | Minimal (FK only, no extra fields for now) |
| Multiple Employee Matches | Error + log, configurable halt/skip |
