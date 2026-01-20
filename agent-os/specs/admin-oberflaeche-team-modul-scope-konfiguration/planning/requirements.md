# Requirements: Admin-Oberflaeche Team-Modul-Scope-Konfiguration

## Clarification Responses

### 1. Module Registry Location
**Decision:** Code-based registry (modules.registry.ts) with database for configuration only

- Module definitions (id, name, route, allowedScopes, defaultScope) are hardcoded in TypeScript
- Database stores only team-specific configuration overrides (TeamModuleConfig)
- New modules require code change + deployment
- Benefits: Type safety, compile-time checks, no orphaned configs

### 2. TeamGroup/TeamMembership Reuse
**Decision:** Reuse existing models from "Datenhaltung & Berechtigungen" spec

- TeamGroup model already has: id, name, description, isActive, createdAt/updatedAt, createdBy/updatedBy
- TeamMembership model provides user-to-team assignments with roles
- No schema changes needed for team management portion

### 3. TeamModuleConfig Junction Model
**Decision:** New junction model without hierarchy/cascade

```prisma
model TeamModuleConfig {
  id          String    @id @default(uuid())
  teamGroupId String
  moduleId    String    // References code-based module registry
  isEnabled   Boolean   @default(true)
  scope       String?   // Override scope (null = use module default)
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
  createdBy   String?
  updatedBy   String?

  teamGroup   TeamGroup @relation(fields: [teamGroupId], references: [id], onDelete: Cascade)

  @@unique([teamGroupId, moduleId])
  @@index([teamGroupId])
  @@index([moduleId])
}
```

- Flat structure, no cascading between modules
- Each team/module combination is independent
- Scope override must be within module's allowedScopes

### 4. Default Scope Handling
**Decision:** Module defines default + allowed scopes, teams can override within allowed

- Module registry defines: `defaultScope` and `allowedScopes[]`
- Example: StrategicGoals allows [GLOBAL, TEAM], default GLOBAL
- Team can override to TEAM if it's in allowedScopes
- Validation prevents invalid scope assignments
- Missing TeamModuleConfig entry = use module defaults

### 5. Enforcement Strategy
**Decision:** Dual enforcement (frontend + backend)

- **Frontend:**
  - Navigation dynamically built from enabled modules
  - Routes check module access before rendering
  - Unauthorized routes redirect to dashboard
- **Backend:**
  - Middleware validates module access on each request
  - Scope enforcement in data layer
  - 403 response for unauthorized module access

### 6. Multi-Team Support
**Decision:** Implement Multi-Team from day 1

Detailed Multi-Team requirements:

**MT-1: Visibility Union Rule**
- User sees modules enabled for ANY of their teams
- Example: User in Team A (StrategicGoals enabled) and Team B (disabled) → sees StrategicGoals

**MT-2: Access Union Rule**
- Module access granted if enabled in ANY team membership
- Most permissive scope applies when teams have different scopes

**MT-3: Scope Resolution**
- For TEAM-scoped data: Show data from all user's teams
- For conflicting scopes (TEAM vs GLOBAL): GLOBAL takes precedence
- Never reduce access, always expand

**MT-4: UI Display (Team Sections)**
- TEAM-scope data displayed in separate sections per team
- Clear visual headers: "Team Alpha", "Team Beta"
- Each section shows only that team's data
- Personal scope ignores team separation

**MT-5: Data Creation Context**
- When creating TEAM-scoped data, user must select target team
- Dropdown shows only teams where user has sufficient role
- Selected team determines data ownership

**MT-6: Switching Context (Future)**
- Optional: "Focus Team" selector in header for filtering
- MVP: Always show all teams
- Phase 2: Single-team focus mode

**MT-7: Scope Conflict Prevention**
- Validation prevents assigning conflicting scopes to same module across teams
- Either all teams use same scope, or admin gets warning
- Warning allows override with confirmation

**MT-8: Role Aggregation**
- User's effective role = highest role across all team memberships
- OWNER in Team A + VIEWER in Team B = OWNER-level access
- Applied per-module, not globally

**MT-9: Server-Side Scoping**
- All scope logic enforced server-side
- Frontend is convenience layer only
- API always validates team membership before data access

### 7. Audit Trail
**Decision:** Separate audit table for configuration changes

```prisma
model ModuleConfigAudit {
  id           String   @id @default(uuid())
  teamGroupId  String
  moduleId     String
  action       String   // CREATE, UPDATE, DELETE
  oldValues    String?  // JSON of previous state
  newValues    String?  // JSON of new state
  performedBy  String
  performedAt  DateTime @default(now())

  @@index([teamGroupId])
  @@index([moduleId])
  @@index([performedAt])
}
```

- Separate from general audit to enable specific queries
- Stores JSON diff for changes
- Query-friendly for compliance reports

### 8. Module Deactivation Behavior
**Decision:** Soft-block with warning

- Deactivating a module shows warning: "X Datensaetze werden unsichtbar"
- Data is NOT deleted, only hidden
- Admin confirmation required to proceed
- Reactivation immediately restores visibility
- API returns 403 for deactivated module requests

## Technical Architecture Summary

### Module Registry (Code-Based)
```typescript
// backend/src/config/modules.registry.ts
export interface ModuleDefinition {
  id: string;           // Unique identifier
  name: string;         // Display name
  route: string;        // Frontend route prefix
  apiPrefix: string;    // Backend API prefix
  allowedScopes: DataScope[];
  defaultScope: DataScope;
  description?: string;
}

export const MODULE_REGISTRY: ModuleDefinition[] = [
  {
    id: 'strategic-goals',
    name: 'Strategic Goals',
    route: '/strategic-goals',
    apiPrefix: '/api/strategic-goals',
    allowedScopes: ['GLOBAL', 'TEAM'],
    defaultScope: 'GLOBAL'
  },
  // ... other modules
];
```

### Data Flow
1. Admin configures team → module → scope in Admin UI
2. Configuration saved to TeamModuleConfig table
3. Frontend fetches user's effective modules on login
4. Navigation built from enabled modules
5. Each API request validated against TeamModuleConfig
6. Data filtered by effective scope

### API Endpoints Needed
- GET /api/admin/modules - List all modules with team configs
- GET /api/admin/modules/:moduleId - Get module details
- PUT /api/admin/team-module-config - Update team/module config
- GET /api/admin/team-module-config/:teamId - Get team's module configs
- GET /api/user/effective-modules - Get current user's accessible modules

## Out of Scope (Confirmed)
- SSO/external authentication integration
- Per-record permissions within modules
- Multi-tenant (organization) separation
- Module dependencies/prerequisites
- Time-based module access (scheduling)
