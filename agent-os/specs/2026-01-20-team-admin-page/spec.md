# Specification: Team Admin Page

## Goal

Eine vollstaendige Admin-Oberflaeche zur Verwaltung von Teams (TeamGroups) mit CRUD-Funktionalitaet, Mitgliederverwaltung und Rollenzuweisung, die das bestehende department-Feld als Gruppierungslogik ersetzt.

## User Stories

- Als Global Admin moechte ich Teams erstellen, bearbeiten und deaktivieren, um die Organisationsstruktur abzubilden
- Als Team Owner moechte ich Mitarbeiter meinem Team hinzufuegen und deren Rollen verwalten, um Zugriffsrechte zu steuern

## Specific Requirements

**Team-Listen-Seite (`/admin/teams`)**
- Tabellarische Anzeige aller Teams mit Spalten: Name, Status (aktiv/inaktiv), Mitgliederanzahl
- Suchfeld mit Debounce (300ms) analog zu EmployeesPage
- "Neues Team"-Button oeffnet Dialog/Drawer mit Formular (Name, Beschreibung)
- Inline-Aktionen pro Zeile: Bearbeiten, Deaktivieren/Aktivieren
- Klick auf Team-Name navigiert zur Detail-Seite
- Filter fuer aktive/inaktive Teams
- Pagination mit page/pageSize Query-Parametern

**Team-Detail-Seite (`/admin/teams/:teamId`)**
- Header mit Team-Name, Beschreibung und Status-Badge
- Bearbeiten-Button fuer Team-Metadaten (Dialog)
- Mitgliederliste als Tabelle: Name, E-Mail, Rolle, Aktionen
- "Mitglied hinzufuegen"-Button mit Combobox zur Mitarbeiter-Suche
- Rollen-Dropdown pro Mitglied (OWNER, ADMIN, EDITOR, VIEWER)
- Entfernen-Aktion pro Mitglied mit Bestaetigung
- Pagination und Suche innerhalb der Mitgliederliste

**Team-Anzeige in Mitarbeiterliste**
- Teams als Badge-Tags in der EmployeesPage-Tabelle anzeigen
- Bei mehr als 2 Teams: "+N" Badge mit Tooltip fuer weitere Teams
- Team-Tags sind nicht klickbar (nur informativ)

**EmployeeForm Team-Integration**
- Multi-Select Combobox fuer Team-Zuordnung im EmployeeForm
- Pro Team eine Rollen-Auswahl (OWNER, ADMIN, EDITOR, VIEWER)
- Aenderungen werden ueber dieselbe Membership-API persistiert

**Berechtigungssystem**
- Global Admin (isAdmin=true): Create Team, Deactivate Team, alle Teams sichtbar
- Team OWNER: Mitglieder hinzufuegen/entfernen, Rollen aendern, Team-Metadaten bearbeiten
- Team ADMIN: Mitglieder hinzufuegen/entfernen, Rollen aendern (kein Deaktivieren)
- EDITOR/VIEWER: Keine Verwaltungsrechte, nur Lese-Zugriff

**API-Erweiterungen**
- `GET /api/teams/:teamId/members` - Paginierte Mitgliederliste mit Suche
- Bestehende `/api/team-groups` Routen umbenennen zu `/api/teams` fuer konsistente Benennung
- Query-Parameter: search, page, pageSize, includeInactive
- Soft-Delete statt Hard-Delete: PATCH auf isActive statt DELETE

**Frontend State Management**
- TanStack Query Keys: `['teams']`, `['team', teamId]`, `['teamMembers', teamId]`
- Optimistic Updates bei Membership-Aenderungen
- Query Invalidation bei Create/Update/Delete

## Visual Design

Keine visuellen Vorgaben. Die UI orientiert sich an bestehenden Admin-Seiten (EmployeesPage, SkillManagementPage).

## Existing Code to Leverage

**EmployeesPage.tsx (frontend/src/pages/admin/EmployeesPage.tsx)**
- Tabellenstruktur mit Search-Input und Create-Button als Vorlage
- Modal-State-Pattern (null | { mode: 'create' } | { mode: 'edit', item }) wiederverwenden
- Inline-Aktionen-Pattern (Bearbeiten, Archivieren) uebernehmen

**EmployeeForm.tsx (frontend/src/components/admin/EmployeeForm.tsx)**
- Zod-Schema mit zodResolver als Pattern fuer TeamForm
- Modal-Dialog-Struktur mit Cancel/Submit-Buttons
- useForm-Hook-Integration als Vorlage

**team-groups.ts (backend/src/routes/team-groups.ts)**
- Komplette Route-Struktur bereits vorhanden (list, create, getOne, update, delete, members)
- Authorization-Middleware-Pattern (isAuthenticated, isAdmin, authorize) wiederverwenden
- Route-Umbenennung von `/team-groups` zu `/teams` erforderlich

**team-group.service.ts (backend/src/services/team-group.service.ts)**
- CRUD-Operationen bereits implementiert (create, update, remove, getAll, getById)
- Membership-Operationen vorhanden (addMember, updateMemberRole, removeMember)
- Paginierung-Pattern (page, pageSize, skip) bereits implementiert

**TeamGroup/TeamMembership Models (backend/prisma/schema.prisma)**
- TeamGroup mit id, name, description, isActive, audit-Feldern
- TeamMembership mit role (OWNER, ADMIN, EDITOR, VIEWER, USER), composite unique constraint
- Cascade-Delete fuer Memberships konfiguriert

## Out of Scope

- Team-Hierarchien (Parent/Child-Beziehungen, Abteilungen als Baum)
- Bulk-Import/Sync von Teams (CSV, HR-System-Integration)
- Automatische Regeln ("wenn Department X dann Team Y")
- Feingranulare Modulrechte innerhalb eines Moduls (Feldrechte, Objektfreigaben)
- Org-weite Rollenverwaltung ueber isAdmin hinaus (Phase 2)
- Migration des department-Feldes (bleibt vorerst als Legacy-Feld)
- Kontextspezifische Team-Anzeige (immer alle Teams eines Mitarbeiters zeigen)
- Modul-Konfiguration Tab auf Team-Detail-Seite (bereits in separater Spec)
- USER-Rolle in der Team-Verwaltungs-UI (nur OWNER, ADMIN, EDITOR, VIEWER)
- Audit-Log-Ansicht fuer Team-Aenderungen
