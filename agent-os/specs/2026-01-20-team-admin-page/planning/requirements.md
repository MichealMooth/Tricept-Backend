# Spec Requirements: Team Admin Page

## Initial Description

Eine Adminseite zur Verwaltung von Teams, die Mitarbeitern zugeordnet werden koennen (ersetzt "Abteilung"). Die Seite soll eine vollstaendige CRUD-Funktionalitaet fuer Teams bieten sowie die Moeglichkeit, Mitarbeiter Teams zuzuweisen und deren Rollen innerhalb der Teams zu verwalten.

## Requirements Discussion

### First Round Questions

**Q1:** Soll die Team-Verwaltung als neue Seite unter `/admin/teams` erstellt werden, analog zur bestehenden Mitarbeiter-Verwaltung?
**Answer:** Ja, neue Team-Verwaltungsseite unter `/admin/teams`, analog zu EmployeesPage, SkillManagementPage etc. Ergaenzend: `/admin/teams/:teamId` als Detailroute.

**Q2:** Welcher Funktionsumfang soll auf der Team-Verwaltungsseite verfuegbar sein?
**Answer:** Split in Liste + Detail:
- `/admin/teams`: Team-Liste (Name, Status, Mitgliederanzahl), Create Team (Dialog/Drawer), Edit Team (Name/Beschreibung), Deaktivieren/Aktivieren (Soft)
- `/admin/teams/:teamId`: Mitgliederverwaltung (add/remove), Rollenverwaltung pro Mitglied (OWNER/ADMIN/EDITOR/VIEWER), (optional) Modul-Konfig pro Team als eigener Tab

Begruendung: Mitgliederverwaltung wird schnell komplex (Suche, Pagination, Rollen, Audit, Konflikte bei Multi-Team). Eine Detail-Seite haelt UX und Code wartbar.

**Q3:** Wie soll mit dem bestehenden `department`-Feld in Employee umgegangen werden?
**Answer:** Als Legacy-Feld behalten (vorerst), aber nicht mehr als Berechtigungsgrundlage nutzen. Kurzfristig: department bleibt fuer Abwaertskompatibilitaet/Reporting/Alt-UI. Mittelfristig: Deprecation + Cleanup, wenn alle Stellen auf Teams umgestellt sind. Migration: Initiale Seed-Migration department zu TeamGroups ist sinnvoll, aber als one-time mapping, nicht als Live-Sync.

**Q4:** Wie sollen Teams bei Mitarbeitern angezeigt werden (bei Multi-Team-Zugehoerigkeit)?
**Answer:** Option B (alle Teams als Tags/Liste) als Default. Bei Multi-Team ist "Primaeres Team" meist willkuerlich. UI: in Tabellen kurze Tags + Tooltip/Overflow ("+2"). Option C (kontextspezifisch) wird in v1 nicht eingefuehrt.

**Q5:** Welche Berechtigungen sollen fuer die Team-Verwaltung gelten?
**Answer:**
- Global Admin (isAdmin=true): Create/Deactivate Teams, Notfallrechte, globale Korrekturen
- Team OWNER: Mitglieder und Rollen in seinem Team verwalten, Team-Metadaten aendern (Name/Beschreibung)
- Team ADMIN: darf Mitglieder/Rollen, aber nicht deaktivieren
- Fail-safe: Team-Erstellung und Deaktivierung bleiben Global Admin-only

**Q6:** Wie sollen Mitarbeiter Teams zugewiesen werden?
**Answer:**
- Primaer: Team-Detailseite (`/admin/teams/:teamId`) fuer Membership Management (Team-centric)
- Sekundaer: EmployeeForm ergaenzt um Multi-Select Teams + Rollen (User-centric)
- Wichtig: Eine einzige Backend-API fuer Membership-Aenderungen, damit Audit/Validation konsistent bleibt

**Q7:** Was soll explizit nicht Teil dieser Spec sein (Out of Scope)?
**Answer:**
- Team-Hierarchien (Parent/Child, Vererbung, Abteilungen als Baum)
- Bulk-Import/Sync (CSV/HR-System)
- Automatische Regeln ("wenn Department X dann Team Y")
- Feingranulare Modulrechte innerhalb eines Moduls (Feldrechte, Objektfreigaben)
- Org-weite Rollenverwaltung ueber isAdmin hinaus (Phase 2)

### Existing Code to Reference

**Similar Features Identified:**

Frontend:
- Feature: Admin-Seitenlayout - Pattern wie EmployeesPage (List + actions)
- Components: Shadcn Dialog/Drawer, Form, Select/Combobox, Badge (Tags fuer Teams)
- Data Fetching: TanStack Query - bestehendes Fetch/Mutation Pattern, inkl. invalidation
- Query Keys: `['teams']`, `['team', teamId]`, `['teamMembers', teamId]`, `['employee', employeeId]`

Backend:
- Route Guards: Existing Admin Route Guards analog zu bisherigen Admin-Endpunkten (isAdmin / role checks)
- Validation: Zod Validation - gleiche Pipeline (DTOs)
- ORM Patterns: Prisma Patterns fuer TeamGroup, TeamMembership wie in der "Datenhaltung & Berechtigungen"-Spec
- Logging: Winston Logging - standardisiertes Audit Event logging

### Follow-up Questions

Keine Follow-up Fragen erforderlich - alle Details wurden umfassend beantwortet.

## Visual Assets

### Files Provided:
No visual assets provided.

### Visual Insights:
Keine visuellen Vorgaben. Die UI soll sich an bestehenden Admin-Seiten (EmployeesPage, SkillManagementPage) orientieren.

## Requirements Summary

### Functional Requirements

**Team-Listen-Seite (`/admin/teams`):**
- Anzeige aller Teams in einer Tabelle mit Name, Status (aktiv/inaktiv), Mitgliederanzahl
- Erstellen neuer Teams ueber Dialog/Drawer (Name, Beschreibung)
- Bearbeiten von Team-Metadaten (Name, Beschreibung)
- Soft-Delete: Teams deaktivieren/aktivieren (kein hartes Loeschen)
- Filterung und Sortierung der Team-Liste

**Team-Detail-Seite (`/admin/teams/:teamId`):**
- Anzeige der Team-Details (Name, Beschreibung, Status)
- Mitgliederverwaltung: Mitarbeiter hinzufuegen und entfernen
- Rollenverwaltung: Rolle pro Mitglied setzen (OWNER, ADMIN, EDITOR, VIEWER)
- Suche und Pagination fuer Mitgliederliste
- (Optional) Tab fuer Modul-Konfiguration pro Team

**Mitarbeiter-Team-Anzeige:**
- Teams als Tags in Tabellen und Listen anzeigen
- Bei mehr als 2-3 Teams: Overflow mit Tooltip ("+2")
- Multi-Select fuer Teams im EmployeeForm

**Berechtigungssystem:**
- Global Admin: Volle Rechte (Create, Deactivate, alle Teams)
- Team OWNER: Mitglieder/Rollen verwalten, Team-Metadaten aendern
- Team ADMIN: Mitglieder/Rollen verwalten (kein Deaktivieren)
- EDITOR/VIEWER: Nur Lese-/eingeschraenkte Rechte (kontextabhaengig)

### Reusability Opportunities

**Frontend-Komponenten:**
- EmployeesPage-Layout als Vorlage fuer Team-Listen-Seite
- Bestehende Shadcn/UI Komponenten (Dialog, Drawer, Form, Badge, Select/Combobox)
- TanStack Query Patterns fuer Datenabfrage und Mutations

**Backend-Patterns:**
- Bestehende Admin-Route-Guards und Middleware
- Zod-Validierungsschemas als Vorlage
- Prisma-Patterns fuer relationale Daten
- Winston-Logging fuer Audit-Events

### Scope Boundaries

**In Scope:**
- Team-CRUD (Create, Read, Update, Soft-Delete)
- Team-Mitgliederverwaltung (Add, Remove)
- Rollenverwaltung pro Team-Mitglied (OWNER, ADMIN, EDITOR, VIEWER)
- Team-Anzeige bei Mitarbeitern (Multi-Team als Tags)
- Integration in EmployeeForm (Multi-Select Teams + Rollen)
- Berechtigungspruefung (Global Admin, Team OWNER, Team ADMIN)
- Einheitliche Backend-API fuer Membership-Aenderungen

**Out of Scope:**
- Team-Hierarchien (Parent/Child, Vererbung, Abteilungen als Baum)
- Bulk-Import/Sync (CSV, HR-System-Integration)
- Automatische Regeln ("wenn Department X dann Team Y")
- Feingranulare Modulrechte innerhalb eines Moduls (Feldrechte, Objektfreigaben)
- Org-weite Rollenverwaltung ueber isAdmin hinaus (Phase 2)
- Migration des department-Feldes (bleibt vorerst als Legacy)
- Kontextspezifische Team-Anzeige (v1 zeigt immer alle Teams)

### Technical Considerations

**Datenmodell:**
- TeamGroup: id, name, description, isActive, createdAt, updatedAt
- TeamMembership: id, teamId, employeeId, role (OWNER/ADMIN/EDITOR/VIEWER), createdAt, updatedAt
- Rollen-Set in v1: OWNER, ADMIN, EDITOR, VIEWER (USER-Role entfernt)

**API-Endpunkte:**
- `GET /api/teams` - Liste aller Teams
- `POST /api/teams` - Neues Team erstellen (Global Admin only)
- `GET /api/teams/:teamId` - Team-Details
- `PATCH /api/teams/:teamId` - Team aktualisieren
- `DELETE /api/teams/:teamId` - Team deaktivieren (Soft-Delete, Global Admin only)
- `GET /api/teams/:teamId/members` - Team-Mitglieder
- `POST /api/teams/:teamId/members` - Mitglied hinzufuegen
- `PATCH /api/teams/:teamId/members/:memberId` - Rolle aendern
- `DELETE /api/teams/:teamId/members/:memberId` - Mitglied entfernen

**Berechtigungslogik:**
- Global Admin-Check ueber bestehendes `isAdmin`-Flag
- Team-spezifische Berechtigungen ueber TeamMembership.role
- Middleware fuer Team-Berechtigungspruefung

**Legacy-Kompatibilitaet:**
- department-Feld in Employee bleibt vorerst erhalten
- Keine Live-Sync zwischen department und Teams
- Initiale Migration als einmaliges Seed-Script moeglich

**Query Keys (Frontend):**
- `['teams']` - Team-Liste
- `['team', teamId]` - Einzelnes Team
- `['teamMembers', teamId]` - Mitglieder eines Teams
- `['employee', employeeId]` - Invalidierung bei Membership-Aenderungen
