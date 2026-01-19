# Feature Flag Removal Checklist

## Overview

This document outlines the process for removing the `USE_PRISMA_REFERENCE_PROJECTS` feature flag after successful production migration has been confirmed stable.

**Important:** Do NOT execute this cleanup until:
1. Production migration is complete and verified
2. At least 1-2 weeks of stable operation in production
3. No rollback has been necessary
4. Stakeholders have signed off on removing the file store fallback

---

## Prerequisites

Before removing the feature flag:

- [ ] Production migration completed successfully
- [ ] All verification checklist items passed
- [ ] No issues reported with Prisma backend
- [ ] Feature flag has been set to `true` in all environments for at least 2 weeks
- [ ] No rollback events occurred
- [ ] Backup of JSON file archived to long-term storage
- [ ] Technical lead approval obtained

---

## Files to Modify

### 1. Remove File Store Service

**File:** `backend/src/services/reference-projects.store.ts`

**Action:** Delete this file entirely

**Reason:** File-based storage is no longer needed

```bash
rm backend/src/services/reference-projects.store.ts
```

---

### 2. Remove File Store Tests

**File:** `backend/src/services/reference-projects.store.test.ts`

**Action:** Delete this file if it exists

```bash
rm backend/src/services/reference-projects.store.test.ts
```

---

### 3. Simplify Facade to Direct Prisma Calls

**File:** `backend/src/services/reference-projects.facade.ts`

**Current state:** Routes between file store and Prisma based on feature flag

**Target state:** Either:
- Option A: Remove facade entirely, update controller to use Prisma service directly
- Option B: Keep facade as thin wrapper, remove feature flag logic

**Option A - Remove facade:**

1. Update `backend/src/controllers/reference-projects.controller.ts`:
   - Replace `import * as facade from '@/services/reference-projects.facade'`
   - With `import * as referenceProjectsService from '@/services/reference-projects.service'`

2. Delete `backend/src/services/reference-projects.facade.ts`

**Option B - Simplify facade:**

Replace facade content with:

```typescript
/**
 * Reference Projects Service Facade
 * Provides unified interface to Prisma service.
 * Note: File store fallback removed after successful migration.
 */
import * as prismaService from '@/services/reference-projects.service';

// Re-export types
export type {
  Query,
  CreateInput,
  UpdateInput,
  ReferenceProjectResponse,
} from '@/services/reference-projects.service';

export type ListResponse = {
  items: import('@/services/reference-projects.service').ReferenceProjectResponse[];
  total: number;
  page: number;
  pageSize: number;
};

// Direct pass-through to Prisma service
export const list = prismaService.list;
export const getById = prismaService.getById;
export const create = prismaService.create;
export const update = prismaService.update;
export const remove = prismaService.remove;

// Kept for backward compatibility - always returns true now
export function isPrismaEnabled(): boolean {
  return true;
}
```

---

### 4. Remove Feature Flag from Environment Configuration

**File:** `backend/src/config/env.ts`

**Change:**

Remove or comment out:
```typescript
// Feature flag for Reference Projects Prisma migration
// When true: Use Prisma/PostgreSQL backend for reference projects
// When false (default): Use file-based JSON store (backend/var/reference-projects.json)
usePrismaReferenceProjects: process.env.USE_PRISMA_REFERENCE_PROJECTS === 'true',
```

**Note:** If env.ts exports usePrismaReferenceProjects, search for all usages and remove them.

---

### 5. Update Environment Example

**File:** `backend/.env.example`

**Change:**

Remove or comment out:
```
# Feature Flags
# Reference Projects data source toggle:
# - false (default): Use file-based JSON store (backend/var/reference-projects.json)
# - true: Use Prisma/PostgreSQL backend (after migration with `pnpm migrate:refs`)
USE_PRISMA_REFERENCE_PROJECTS=false
```

Or replace with a note:
```
# Feature Flags
# USE_PRISMA_REFERENCE_PROJECTS - Removed: Prisma backend is now the only option
```

---

### 6. Archive and Remove JSON Data File

**File:** `backend/var/reference-projects.json`

**Actions:**

1. Archive the file to long-term storage:
   ```bash
   cp backend/var/reference-projects.json /path/to/archive/reference-projects.archived.$(date +%Y%m%d).json
   ```

2. Verify archive is accessible and valid:
   ```bash
   cat /path/to/archive/reference-projects.archived.*.json | jq '.items | length'
   ```

3. After confirming archive, remove the file:
   ```bash
   rm backend/var/reference-projects.json
   ```

4. Also remove any backup files:
   ```bash
   rm backend/var/reference-projects.backup.*.json
   ```

---

### 7. Remove RolesEnum and TopicsEnum Re-exports (Optional)

**File:** `backend/src/services/reference-projects.facade.ts`

If the facade was kept (Option B), remove:
```typescript
export { RolesEnum, TopicsEnum } from '@/services/reference-projects.store';
```

These enums may be referenced by controllers. If so, either:
- Define them in a shared types file
- Or fetch valid values from the database (Role and Topic tables)

---

### 8. Update Controller Validation (Optional Enhancement)

**File:** `backend/src/controllers/reference-projects.controller.ts`

Consider updating Zod validation schemas to:
- Dynamically fetch valid roles from the Role table
- Dynamically fetch valid topics from the Topic table

This allows admin-extensibility without code changes.

---

## Post-Cleanup Verification

After making the above changes:

- [ ] Run tests: `pnpm test -- reference-projects`
- [ ] Run linter: `pnpm lint`
- [ ] Run type check: `pnpm build`
- [ ] Start server and verify endpoints work
- [ ] Create, read, update, delete a test project via API
- [ ] Deploy to staging and verify
- [ ] Deploy to production

---

## Search for Remaining References

Before finalizing, search the codebase for any remaining references:

```bash
# Search for feature flag usage
grep -r "usePrismaReferenceProjects" --include="*.ts" backend/src/

# Search for file store imports
grep -r "reference-projects.store" --include="*.ts" backend/src/

# Search for feature flag environment variable
grep -r "USE_PRISMA_REFERENCE_PROJECTS" backend/

# Search for var directory references
grep -r "reference-projects.json" --include="*.ts" backend/src/
```

All results should be addressed before considering cleanup complete.

---

## Rollback Plan

If issues arise after cleanup:

1. **Revert code changes:** Use git to revert the cleanup commits
2. **Restore JSON file:** Restore from archive
3. **Set feature flag:** Set `USE_PRISMA_REFERENCE_PROJECTS=false`
4. **Restart server:** Deploy previous version

---

## Sign-Off

| Role | Name | Date | Signature |
|------|------|------|-----------|
| Cleanup Executor | | | |
| Code Review | | | |
| QA Verification | | | |
| Technical Lead | | | |

---

## Timeline

| Phase | Target Date | Status |
|-------|------------|--------|
| Production migration | | |
| Stability monitoring period | +2 weeks | |
| Cleanup approval | | |
| Cleanup execution | | |
| Verification complete | | |
