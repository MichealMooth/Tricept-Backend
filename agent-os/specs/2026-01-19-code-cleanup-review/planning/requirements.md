# Spec Requirements: Code Cleanup & Review fuer Tricept Backend

## Initial Description

Der Benutzer moechte eine umfassende Code-Bereinigung und Review des Tricept Backend durchfuehren mit folgenden Zielen:

1. Code-Bereinigung von unnoetigem/ueberarbeitetem Code
2. Multi-Agent Code-Review durchfuehren
3. Scope-Abgleich und Aktualitaetspruefung
4. Trennung von Produktions- und Test-Code
5. State-Management pruefen und festigen (von erstem Start mit Sprache und DSGVO)
6. Kein Klartext im Code (Sicherheit)
7. Moderne Coding-Standards einhalten
8. Bestehende Funktionalitaeten nicht komplett neu schreiben, aber problematisches melden
9. App soll danach genauso funktionieren, aber besser strukturiert und modular sein
10. Git-Push zu: https://github.com/MichealMooth/Tricept-Backend.git

## Requirements Discussion

### First Round Questions

**Q1:** Test-Struktur - Sollen Tests co-located (neben Source-Files) oder separat in einem `__tests__` Ordner organisiert werden?
**Answer:** Co-located Tests beibehalten mit `__tests__/` Ordner pro Modul. Integrations-/E2E-Tests separat in `src/tests/integration`, `src/tests/e2e`.

**Q2:** Welche Features oder Code-Bereiche sollen entfernt werden?
**Answer:** Tycoon Game Feature und `temp_projects_block.txt` komplett entfernen.

**Q3:** Wie soll mit dem Reference Projects Feature umgegangen werden (aktuell in-memory/file-store)?
**Answer:** File-Store vollstaendig entfernen, Feature-Flag zurueckbauen, nur Prisma/DB als Single Source of Truth.

**Q4:** Wie soll mit totem/auskommentiertem Code umgegangen werden?
**Answer:** Auskommentierten Code vollstaendig entfernen - kein "Code-Friedhof".

**Q5:** Wie soll i18n (Internationalisierung) und DSGVO-Mechanismen behandelt werden?
**Answer:** Fehlende Mechanismen dokumentieren und minimales Grundgeruest anlegen (Stubs): i18n-Struktur, zentrale Uebersetzungsfunktion/Hooks. DSGVO: Informationspflichten, Datenminimierung, Audit-Logging.

**Q6:** Wie sollen hardcodierte Strings und Rollen behandelt werden?
**Answer:** Hardcodierte UI-Strings in Lokalisierungsdateien, Rollen als typisierte Enums/Konstanten (z.B. `Role.PROJECT_LEAD`) mit i18n-Mapping.

**Q7:** Sollen DB-Level-Constraints fuer Ratings ergaenzt werden?
**Answer:** Ja, CHECK constraints auf DB-Level ergaenzen zusaetzlich zu Zod-Validierung.

**Q8:** Was hat Prioritaet bei der Bereinigung?
**Answer:** Security und Datenintegritaet zuerst.

**Q9:** Gibt es explizit ausgeschlossene Bereiche?
**Answer:** Nein, umfassendes Review - nichts explizit ausgeschlossen.

**Q10:** Premium-Feature Behandlung?
**Answer:** Premium-Feature wurde vom Scope entfernt.

### Existing Code to Reference

**Aehnliche Features identifiziert:**
- Feature: Reference Projects - Path: `backend/src/services/reference-projects.store.ts` (zu entfernen)
- Feature: Reference Projects DB - Path: `backend/prisma/schema.prisma` (ReferenceProject Model bereits vorhanden)
- Feature: Tycoon Game - Path: `backend/src/routes/` und `frontend/src/pages/admin/` (zu entfernen)
- Bestehende Test-Struktur: `backend/src/tests/` fuer Utilities

### Follow-up Questions

Keine Follow-up Fragen erforderlich - alle Requirements wurden klar spezifiziert.

## Visual Assets

### Files Provided:
Keine visuellen Assets bereitgestellt.

### Visual Insights:
Nicht anwendbar - Code Cleanup/Review Spec ohne UI-Mockups.

## Requirements Summary

### Functional Requirements

**1. Test-Code Strukturierung**
- Co-located Unit-Tests in `__tests__/` Ordner pro Modul beibehalten
- Integrationstests in `src/tests/integration/` konsolidieren
- E2E-Tests in `src/tests/e2e/` konsolidieren
- Klare Trennung zwischen Unit-, Integrations- und E2E-Tests

**2. Code-Entfernung**
- Tycoon Game Feature komplett entfernen (Routes, Controllers, Services, Frontend Pages)
- `temp_projects_block.txt` Datei entfernen
- Alle auskommentierten Code-Bloecke entfernen
- Reference Projects File-Store entfernen (`reference-projects.store.ts`)
- Feature-Flags fuer File-Store zurueckbauen

**3. Reference Projects Konsolidierung**
- Nur Prisma/PostgreSQL als Single Source of Truth
- Alle Zugriffe ueber Prisma Client
- In-memory/File-basierte Speicherung entfernen

**4. i18n Grundgeruest**
- i18n-Verzeichnisstruktur anlegen (`frontend/src/locales/`, `backend/src/locales/`)
- Zentrale Uebersetzungsfunktion/Hook als Stub implementieren
- Hardcodierte UI-Strings identifizieren und in Lokalisierungsdateien verschieben
- Deutsche Sprache als Standard

**5. DSGVO Grundgeruest**
- Stubs fuer Informationspflichten (Privacy Policy, Cookie Consent)
- Datenminimierungsprinzip dokumentieren
- Audit-Logging Grundstruktur anlegen (wer hat wann was geaendert)

**6. Typisierung und Konstanten**
- Rollen als typisierte Enums/Konstanten (`Role.ADMIN`, `Role.USER`, `Role.PROJECT_LEAD`, etc.)
- i18n-Mapping fuer Rollen-Labels
- Konsistente Verwendung im gesamten Codebase

**7. Datenbank-Constraints**
- CHECK constraints fuer Skill-Ratings (1-10)
- CHECK constraints fuer Strategic Goal Ratings (1-5)
- Migration erstellen fuer neue Constraints
- Bestehende Zod-Validierung beibehalten (Defense in Depth)

### Reusability Opportunities

- Bestehende Prisma Models fuer Reference Projects als Vorlage
- Aktuelle Zod-Validierungsschemas als Muster fuer neue Validierungen
- Bestehende Middleware-Patterns fuer neue Funktionalitaet
- Winston Logger bereits vorhanden fuer Audit-Logging Erweiterung

### Scope Boundaries

**In Scope:**
- Entfernung von Tycoon Game Feature
- Entfernung von temp_projects_block.txt
- Entfernung aller auskommentierten Code-Bloecke
- Reference Projects File-Store entfernen
- Test-Struktur konsolidieren
- i18n Grundgeruest (Stubs) anlegen
- DSGVO Grundgeruest (Stubs) anlegen
- Typisierte Enums fuer Rollen
- DB-Level CHECK Constraints fuer Ratings
- Hardcodierte Strings in Lokalisierungsdateien

**Out of Scope:**
- Premium-Feature (explizit entfernt)
- Vollstaendige i18n-Implementierung (nur Grundgeruest/Stubs)
- Vollstaendige DSGVO-Compliance (nur Grundgeruest/Stubs)
- Neue Features hinzufuegen
- Komplettes Refactoring bestehender Funktionalitaet

### Technical Considerations

**Prioritaet:**
1. Security (keine Klartext-Geheimnisse, sichere Konfiguration)
2. Datenintegritaet (DB Constraints, Validierung)
3. Code-Bereinigung (toten Code entfernen)
4. Strukturierung (Tests, Lokalisierung)

**Integration Points:**
- Prisma Schema Migrationen fuer CHECK Constraints
- Bestehende Auth-Middleware bleibt unveraendert
- Bestehende API-Endpunkte bleiben funktional

**Technology Constraints:**
- TypeScript 5.x fuer alle neuen Code-Aenderungen
- Prisma fuer alle DB-Operationen
- Zod fuer Runtime-Validierung (zusaetzlich zu DB Constraints)
- Express Middleware Pattern beibehalten

**Git Repository:**
- Push zu: https://github.com/MichealMooth/Tricept-Backend.git
- Nach Abschluss aller Aenderungen

### Erfolgs-Kriterien

1. Anwendung funktioniert nach Cleanup identisch (alle Tests bestehen)
2. Kein auskommentierter Code mehr vorhanden
3. Tycoon Game Feature vollstaendig entfernt
4. Reference Projects nur noch ueber Prisma/DB
5. Test-Struktur klar organisiert
6. i18n und DSGVO Stubs vorhanden und dokumentiert
7. Rollen als typisierte Enums
8. DB Constraints fuer Ratings aktiv
9. Erfolgreicher Push zu GitHub
