# Reference Projects Migration Verification Checklist

## Overview

This document provides a comprehensive checklist for verifying the successful migration of reference projects from the file-based JSON store to PostgreSQL using Prisma ORM.

**Migration Command:** `pnpm migrate:refs`

---

## Pre-Migration Checks

### 1. Environment Verification

- [ ] Verify database connection is working: `pnpm prisma db pull`
- [ ] Verify Prisma client is generated: `pnpm prisma:generate`
- [ ] Verify lookup tables are seeded: Check Role and Topic counts
- [ ] Backup current JSON file: `cp backend/var/reference-projects.json backend/var/reference-projects.pre-migration.json`

### 2. Data Inventory

Record the following counts before migration:

| Metric | Count |
|--------|-------|
| Total reference projects in JSON | |
| Projects with known employees | |
| Projects with unknown person names | |
| Unique roles used | |
| Unique topics used | |

**SQL Query to count current database state:**
```sql
SELECT 'reference_projects' as table_name, COUNT(*) as count FROM "ReferenceProject"
UNION ALL
SELECT 'roles' as table_name, COUNT(*) FROM "Role"
UNION ALL
SELECT 'topics' as table_name, COUNT(*) FROM "Topic"
UNION ALL
SELECT 'employees' as table_name, COUNT(*) FROM "Employee" WHERE "isActive" = true;
```

---

## Migration Execution

### 3. Dry-Run Validation

Run dry-run first to validate without making changes:

```bash
pnpm migrate:refs --dry-run
```

- [ ] Total records matches JSON file count
- [ ] No validation errors reported
- [ ] Employee matching results reviewed
- [ ] Role mapping successful (no missing roles)
- [ ] Topic mapping successful (no missing topics)

### 4. Full Migration

Run the actual migration:

```bash
pnpm migrate:refs
```

- [ ] Backup file created automatically
- [ ] All records processed
- [ ] No errors during migration
- [ ] Migration summary shows expected counts

---

## Post-Migration Verification

### 5. Record Count Comparison

**SQL Query to verify counts:**
```sql
-- Total reference projects
SELECT COUNT(*) as total_projects FROM "ReferenceProject";

-- Projects with employee relations
SELECT COUNT(DISTINCT "referenceProjectId") as projects_with_employees
FROM "ReferenceProjectEmployee";

-- Projects using person_legacy
SELECT COUNT(*) as projects_with_legacy
FROM "ReferenceProject"
WHERE "person_legacy" IS NOT NULL;

-- Topic relations
SELECT COUNT(*) as total_topic_relations FROM "ReferenceProjectTopic";

-- Average topics per project
SELECT AVG(topic_count) as avg_topics_per_project
FROM (
  SELECT "referenceProjectId", COUNT(*) as topic_count
  FROM "ReferenceProjectTopic"
  GROUP BY "referenceProjectId"
) subq;
```

Verification:

| Check | JSON Count | DB Count | Match |
|-------|------------|----------|-------|
| Total projects | | | [ ] |
| Projects with matched employees | | | [ ] |
| Projects with person_legacy | | | [ ] |

### 6. Sample Record Comparison

Compare at least 3 sample records between JSON and database:

**Sample 1:**
- Project ID: ________________
- [ ] project_name matches
- [ ] customer matches
- [ ] role matches
- [ ] topics match (count and values)
- [ ] person matches (or person_legacy set correctly)
- [ ] approved status matches
- [ ] timestamps preserved

**Sample 2:**
- Project ID: ________________
- [ ] project_name matches
- [ ] customer matches
- [ ] role matches
- [ ] topics match (count and values)
- [ ] person matches (or person_legacy set correctly)
- [ ] approved status matches
- [ ] timestamps preserved

**Sample 3:**
- Project ID: ________________
- [ ] project_name matches
- [ ] customer matches
- [ ] role matches
- [ ] topics match (count and values)
- [ ] person matches (or person_legacy set correctly)
- [ ] approved status matches
- [ ] timestamps preserved

### 7. Employee Match Review

Review the migration log for employee matching results:

- [ ] All expected employee matches succeeded
- [ ] person_legacy used appropriately for unmatched names
- [ ] No unexpected multiple match conflicts

**SQL Query to review person_legacy usage:**
```sql
SELECT id, project_name, person_legacy
FROM "ReferenceProject"
WHERE "person_legacy" IS NOT NULL
ORDER BY "createdAt" DESC;
```

### 8. API Verification

Test API endpoints after migration with feature flag enabled:

```bash
export USE_PRISMA_REFERENCE_PROJECTS=true
```

- [ ] GET /api/reference-projects - List returns all records
- [ ] GET /api/reference-projects?role=Projektleiter - Role filter works
- [ ] GET /api/reference-projects?topic=Migration - Topic filter works
- [ ] GET /api/reference-projects?search=<term> - Search works
- [ ] GET /api/reference-projects/:id - Individual record retrieval works
- [ ] Response format matches frontend expectations

### 9. Frontend Verification

- [ ] Reference projects list page loads correctly
- [ ] Filtering by role works
- [ ] Filtering by topic works
- [ ] Search functionality works
- [ ] Individual project view works
- [ ] Create new project works
- [ ] Update project works
- [ ] Delete project works

---

## Post-Migration SQL Validation Queries

### Comprehensive Data Integrity Check

```sql
-- Verify all projects have a valid role
SELECT COUNT(*) as projects_without_role
FROM "ReferenceProject"
WHERE "roleId" IS NULL;
-- Expected: 0

-- Verify all projects have at least 1 topic
SELECT rp.id, rp.project_name
FROM "ReferenceProject" rp
LEFT JOIN "ReferenceProjectTopic" rpt ON rp.id = rpt."referenceProjectId"
WHERE rpt."referenceProjectId" IS NULL;
-- Expected: 0 rows

-- Verify no projects have more than 6 topics
SELECT rp.id, rp.project_name, COUNT(rpt."topicId") as topic_count
FROM "ReferenceProject" rp
JOIN "ReferenceProjectTopic" rpt ON rp.id = rpt."referenceProjectId"
GROUP BY rp.id, rp.project_name
HAVING COUNT(rpt."topicId") > 6;
-- Expected: 0 rows

-- Verify employee relations point to valid employees
SELECT rpe."referenceProjectId", rpe."employeeId"
FROM "ReferenceProjectEmployee" rpe
LEFT JOIN "Employee" e ON rpe."employeeId" = e.id
WHERE e.id IS NULL;
-- Expected: 0 rows

-- Verify role relations point to valid roles
SELECT rp.id, rp."roleId"
FROM "ReferenceProject" rp
LEFT JOIN "Role" r ON rp."roleId" = r.id
WHERE r.id IS NULL;
-- Expected: 0 rows

-- Verify topic relations point to valid topics
SELECT rpt."referenceProjectId", rpt."topicId"
FROM "ReferenceProjectTopic" rpt
LEFT JOIN "Topic" t ON rpt."topicId" = t.id
WHERE t.id IS NULL;
-- Expected: 0 rows
```

### Timestamp Preservation Check

```sql
-- Verify timestamps were preserved from JSON
SELECT id, project_name, "createdAt", "updatedAt"
FROM "ReferenceProject"
ORDER BY "createdAt" DESC
LIMIT 5;
-- Verify: createdAt and updatedAt are not all the same (migration time)
```

---

## Rollback Procedure

If issues are discovered after migration:

### Immediate Rollback (Feature Flag)

1. Set feature flag to false:
   ```bash
   export USE_PRISMA_REFERENCE_PROJECTS=false
   ```

2. Restart the backend server

3. Verify file store is being used again

### Data Rollback (if needed)

1. The migration created a backup at: `backend/var/reference-projects.backup.<timestamp>.json`

2. To restore original data:
   ```bash
   cp backend/var/reference-projects.backup.<timestamp>.json backend/var/reference-projects.json
   ```

3. To clear migrated database data:
   ```sql
   -- WARNING: This will delete all reference project data from database
   DELETE FROM "ReferenceProjectEmployee";
   DELETE FROM "ReferenceProjectTopic";
   DELETE FROM "ReferenceProject";
   ```

---

## Sign-Off

| Role | Name | Date | Signature |
|------|------|------|-----------|
| Migration Executor | | | |
| Data Verification | | | |
| Frontend Testing | | | |
| Technical Lead | | | |

---

## Notes

_Record any issues, observations, or follow-up items here:_

1.
2.
3.
