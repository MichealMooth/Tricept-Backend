# Spec Requirements: Datenhaltung & Berechtigungen fuer Tricept Core

## Initial Description

### 1. Ziel / Scope

Ist-Analyse der aktuellen Speicherlogik: Welche Daten liegen wo, wie werden sie geladen, wer kann sie sehen, wie wird geschrieben/geloggt/auditiert.

Zielbild fuer eine klare Trennung zwischen:
- Globalen (teamweiten) Stammdaten (z. B. Fragebogen-Fragen, strategische Planungspunkte)
- Geteilten Teamdaten (z. B. Referenzliste: lesbar fuer viele, ggf. eingeschraenkt editierbar)
- User-spezifischen Daten (z. B. Antworten, persoenliche Self-Reflexion, private Notizen)

Berechtigungskonzept inkl. Teamgruppen-Zuweisung pro User.
Serverseitige Datenhaltung fuer globale Inhalte (Questions etc.) in PostgreSQL (Prod) / SQLite (Dev), abrufbar via API.

### 2. Begriffe / Rollenmodell (Minimal, aber tragfaehig)

**Entitaeten:**
- User: authentifizierte Person
- TeamGroup: Gruppierung (Abteilung/Team/Projektgruppe). Ein User muss mindestens einer TeamGroup zugeordnet sein
- Resource: fachlicher Datentyp, z. B. Question, ReferenceItem, StrategicPlanItem, Answer

**Rollen (pro TeamGroup):**
- OWNER: volle Rechte, inkl. Rollen-/Gruppenverwaltung
- ADMIN: verwaltet Inhalte, nicht zwingend User/Rollen
- EDITOR: darf Team-Inhalte erstellen/aendern
- VIEWER: darf Team-Inhalte lesen
- USER: Basisrechte auf eigene Daten

**Wichtig:** Rollen sind kontextabhaengig (pro TeamGroup). Ein User kann in Team A Editor und in Team B Viewer sein.

### 3. Datenklassifikation & Zugriffsregeln

- **Globale Daten:** Read fuer alle authentifizierten User, Write nur globale Admins
- **Team-geteilte Daten:** Read fuer TeamGroup-Mitglieder, Write fuer EDITOR+
- **User-spezifische Daten:** Read/Write nur der User selbst

### 4. Empfehlung fuer Referenzliste

Hybrid-Ansatz (TeamGroup + optional org-weit publizierbar)

### 5. AuthN/AuthZ-Architektur

Session + CSRF mit Passport, serverseitige Policy Enforcement

### 6. Persistenzmodell

Neue/erweiterte Entitaeten:
- TeamGroup
- TeamMembership
- Questionnaire
- Question
- StrategicPlanItem
- ReferenceItem
- Answer

### 7. Deliverables

Audit-Checkliste fuer aktuelle Speicherlogik als Deliverable

## Requirements Discussion

### First Round Questions

**Q1:** Migration vs. Greenfield - Soll das neue TeamGroup/Role-System das bestehende isAdmin-System vollstaendig ersetzen oder ergaenzen?
**Answer:** Darauf aufbauen. isAdmin=true wird zu Global Admin (Systemrolle) und bleibt als "Break-Glass"-Fallback erhalten. Das neue TeamGroup/Role-System ergaenzt das bestehende Auth-Modell, ersetzt es nicht sofort.

**Q2:** Wie soll das bestehende department-Feld im Employee-Model genutzt werden - als Basis fuer initiale TeamGroups oder separat/flexibel (User kann mehreren Groups angehoeren)?
**Answer:** TeamGroups separat & flexibel (User kann mehreren Groups angehoeren). Optional: Initiale Seed-Migration erzeugt TeamGroups aus bestehenden department-Werten (einmalig), aber ohne harte Kopplung.

**Q3:** Wie soll mit Usern verfahren werden, die noch keiner TeamGroup zugewiesen sind? Default-Gruppe, eingeschraenkte Sicht oder Zugriffssperre?
**Answer:** Keine Auffang-Gruppe als Berechtigungs-Shortcut. Org-weite Sichtbarkeit ueber Scope/Visibility (GLOBAL/ORG_PUBLISHED) loesen.

**Q4:** Welche bestehenden Daten sollen als global, team-geteilt oder user-spezifisch klassifiziert werden?
**Answer:**
- Global (read-all, write-global-admin): Skills, SkillCategories, Roles, Topics
- Team-geteilt: ReferenceProjects (mit optional ORG_PUBLISHED)
- User-spezifisch: SkillAssessments, UserCapacity, StrategicGoalRatings, UserProfile
- Zusatz: UserProfile pruefen ob Teile teamweit sichtbar sein sollen -> splitten (PublicProfile vs PrivateProfile)

**Q5:** Sollen StrategicGoals global sein oder team-spezifisch? Wie verhaelt sich das zu den bereits existierenden StrategicGoalRatings?
**Answer:** Hybrid. StrategicGoals global moeglich + team-spezifische Goals (scope=GLOBAL|TEAM, teamGroupId nullable). Ratings per User.

**Q6:** Wie detailliert sollen Questionnaire/Question-Entitaeten im Schema-Design enthalten sein? Vollstaendige Modelle mit Versionierung oder nur Platzhalter?
**Answer:** Schema-Design enthalten (MVP-tauglich) mit Prisma-Modellen inkl. Versionierung/Statusfelder. Detail-UX/Editor spaeter.

**Q7:** Welcher Umfang fuer Audit Trail? Nur createdAt/updatedAt oder vollstaendige Change-History mit alten Werten?
**Answer:** Ist-Doku + Gap-Analyse + Minimal-Implementierung (createdAt/createdBy/updatedAt/updatedBy + zentrale Middleware). Change-History Phase 2.

**Q8:** Was soll explizit NICHT in dieser Spec enthalten sein?
**Answer:**
- SSO/IdP-Integration
- Vollstaendige Admin-UI fuer Rollenverwaltung
- Komplexe Migrationsskripte
- Feingranulare Objektfreigaben (Share-per-item)

### Existing Code to Reference

**Similar Features Identified:**
- Feature: Auth Middleware - Path: `backend/src/middleware/auth.middleware.ts`
  - Basis fuer neue authorize() Middleware mit Rollenprufung
- Feature: Zod Validation Pipelines - Path: `backend/src/` (diverse Controller/Routes)
  - Bestehende Validierungsmuster wiederverwenden
- Feature: Prisma Access Pattern - Path: `backend/src/services/`
  - Pattern fuer teamGroupId in WHERE-Klauseln
- Feature: SkillAssessments - Path: `backend/src/services/assessment.service.ts`
  - Blaupause fuer owner-only Daten (employeeId-basierte Zugriffskontrolle)

### Follow-up Questions

Keine Follow-up-Fragen erforderlich. Alle wesentlichen Anforderungen wurden in der ersten Runde geklaert.

## Visual Assets

### Files Provided:
Keine visuellen Assets bereitgestellt.

### Visual Insights:
Nicht zutreffend.

## Requirements Summary

### Functional Requirements

**TeamGroup & Role System:**
- TeamGroup-Entitaet zur Gruppierung von Usern (Abteilung/Team/Projekt)
- TeamMembership mit Rolle pro User-TeamGroup-Kombination
- Rollen: OWNER, ADMIN, EDITOR, VIEWER, USER (kontextabhaengig pro TeamGroup)
- User kann mehreren TeamGroups mit unterschiedlichen Rollen angehoeren
- Bestehende isAdmin=true bleibt als Global Admin (Break-Glass) erhalten

**Datenklassifikation:**
- GLOBAL Scope: Skills, SkillCategories, Roles, Topics (read-all, write-global-admin)
- TEAM Scope: ReferenceProjects mit optionalem ORG_PUBLISHED Flag
- USER Scope: SkillAssessments, UserCapacity, StrategicGoalRatings
- UserProfile-Splitting: Pruefen ob PublicProfile (teamweit) vs PrivateProfile sinnvoll

**StrategicGoals Hybrid-Modell:**
- StrategicGoals mit scope GLOBAL oder TEAM
- Team-Goals mit teamGroupId verknuepft
- Ratings bleiben user-spezifisch

**Questionnaire/Question Schema:**
- MVP-taugliche Prisma-Modelle
- Versionierung und Status-Felder (DRAFT, ACTIVE, ARCHIVED)
- Detail-UX/Editor spaeter

**Authorization Middleware:**
- Neue authorize() Middleware basierend auf bestehender Auth-Middleware
- Policy Enforcement serverseitig
- Scope/Visibility-basierte Zugriffssteuerung

**Audit Trail (Minimal):**
- createdAt, createdBy, updatedAt, updatedBy Felder
- Zentrale Middleware fuer automatisches Befuellen
- Change-History mit alten Werten in Phase 2

### Reusability Opportunities

- Auth Middleware als Basis fuer Rollen-Check erweitern
- Zod Validation Pattern fuer neue Entitaeten wiederverwenden
- Prisma WHERE-Klausel Pattern mit teamGroupId analog zu employeeId
- SkillAssessments als Referenz fuer owner-only Datenzugriff

### Scope Boundaries

**In Scope:**
- Ist-Analyse der aktuellen Speicher- und Berechtigungslogik
- Prisma-Schema fuer TeamGroup, TeamMembership, Role
- Prisma-Schema fuer Questionnaire, Question (MVP)
- Authorization Middleware mit Rollen-Check
- Scope/Visibility-Konzept (GLOBAL, TEAM, USER, ORG_PUBLISHED)
- Audit-Felder (createdAt/By, updatedAt/By) mit Middleware
- Seed-Migration Option: TeamGroups aus department-Werten

**Out of Scope:**
- SSO/IdP-Integration (SAML, OAuth, Azure AD, Okta)
- Vollstaendige Admin-UI fuer Rollenverwaltung
- Komplexe Datenmigrationsskripte
- Feingranulare Objektfreigaben (Share-per-item)
- Change-History mit alten Werten (Phase 2)
- Questionnaire Detail-UX/Editor

### Technical Considerations

**Integration mit bestehendem System:**
- Passport.js Session-Auth bleibt unveraendert
- CSRF-Protection bleibt aktiv
- isAdmin Field wird zu Global Admin Indikator
- Keine Breaking Changes fuer bestehende API-Endpunkte

**Datenbank:**
- SQLite (Dev) / PostgreSQL (Prod) wie bisher
- Neue Prisma-Modelle: TeamGroup, TeamMembership, Role, Questionnaire, Question
- Erweiterung bestehender Modelle um scope/visibility Felder
- Audit-Felder als optionale Erweiterung bestehender Modelle

**Referenzierte Code-Patterns:**
- `backend/src/middleware/auth.middleware.ts` - requireAuth, requireAdmin Muster
- Zod-Schemas in Controllers fuer Request-Validierung
- Prisma-Services mit employeeId-basierter Filterung als Vorlage fuer teamGroupId

**Migrationsansatz:**
- Inkrementell, nicht disruptiv
- Optional: Initiale TeamGroups aus department-Werten seeden
- Bestehende User funktionieren weiter (Global Admin Fallback)
