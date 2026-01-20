# Spec Initialization

## Spec Name
Datenhaltung & Berechtigungen für Tricept Core

## Raw Idea / Description

### 1. Ziel / Scope

Ist-Analyse der aktuellen Speicherlogik: Welche Daten liegen wo, wie werden sie geladen, wer kann sie sehen, wie wird geschrieben/geloggt/auditiert.

Zielbild für eine klare Trennung zwischen:
- Globalen (teamweiten) Stammdaten (z. B. Fragebogen-Fragen, strategische Planungspunkte)
- Geteilten Teamdaten (z. B. Referenzliste: lesbar für viele, ggf. eingeschränkt editierbar)
- User-spezifischen Daten (z. B. Antworten, persönliche Self-Reflexion, private Notizen)

Berechtigungskonzept inkl. Teamgruppen-Zuweisung pro User.
Serverseitige Datenhaltung für globale Inhalte (Questions etc.) in PostgreSQL (Prod) / SQLite (Dev), abrufbar via API.

### 2. Begriffe / Rollenmodell (Minimal, aber tragfähig)

**Entitäten:**
- User: authentifizierte Person
- TeamGroup: Gruppierung (Abteilung/Team/Projektgruppe). Ein User muss mindestens einer TeamGroup zugeordnet sein
- Resource: fachlicher Datentyp, z. B. Question, ReferenceItem, StrategicPlanItem, Answer

**Rollen (pro TeamGroup):**
- OWNER: volle Rechte, inkl. Rollen-/Gruppenverwaltung
- ADMIN: verwaltet Inhalte, nicht zwingend User/Rollen
- EDITOR: darf Team-Inhalte erstellen/ändern
- VIEWER: darf Team-Inhalte lesen
- USER: Basisrechte auf eigene Daten

**Wichtig:** Rollen sind kontextabhängig (pro TeamGroup). Ein User kann in Team A Editor und in Team B Viewer sein.

### 3. Datenklassifikation & Zugriffsregeln

- **Globale Daten:** Read für alle authentifizierten User, Write nur globale Admins
- **Team-geteilte Daten:** Read für TeamGroup-Mitglieder, Write für EDITOR+
- **User-spezifische Daten:** Read/Write nur der User selbst

### 4. Empfehlung für Referenzliste

Hybrid-Ansatz (TeamGroup + optional org-weit publizierbar)

### 5. AuthN/AuthZ-Architektur

Session + CSRF mit Passport, serverseitige Policy Enforcement

### 6. Persistenzmodell

Neue/erweiterte Entitäten:
- TeamGroup
- TeamMembership
- Questionnaire
- Question
- StrategicPlanItem
- ReferenceItem
- Answer

### 7. Deliverables

Audit-Checkliste für aktuelle Speicherlogik als Deliverable

## Created
2026-01-19
