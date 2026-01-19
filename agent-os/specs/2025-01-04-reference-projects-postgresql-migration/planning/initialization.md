# Spec Initialization

## Feature Name
Datenpersistenz sicherstellen (Reference Projects -> PostgreSQL)

## Description from Roadmap
Migration der Referenzprojekte von file-based Store zu PostgreSQL mit Prisma Model. Alle Daten einheitlich in der Produktionsdatenbank persistent.

## Context from Existing Codebase

### Current Implementation
The Tricept Skill Matrix Management System currently stores reference projects in a file-based in-memory store:
- Location: `backend/var/reference-projects.json`
- Store implementation: `backend/src/services/reference-projects.store.ts`

### Current Reference Project Data Structure (from Zod schema)
```typescript
{
  id: string
  person: string                    // Free text - person's name
  project_name: string
  customer: string
  project_description: string
  role: RolesEnum                   // Enum: Projektleiter, IT-Projektleiter, PMO, Testmanager, etc.
  activity_description: string
  duration_from: string
  duration_to: string
  contact_person: string
  approved: boolean
  topics: TopicsEnum[]              // Array (1-6): Testmanagement, Migration, Cut Over, etc.
  created_at: string
  updated_at: string
}
```

### Existing Roles Enum
- Projektleiter, IT-Projektleiter, PMO, Testmanager, Projektunterstuetzung
- Business-Analyst, Scrum-Master, Tester, TPL, PO

### Existing Topics Enum
- Testmanagement, Migration, Cut Over, Agile Transformation
- Digitale Transformation, Prozessoptimierung, Regulatorik/Compliance, Informationssicherheit

### Database Stack
- SQLite for development (`backend/dev.db`)
- PostgreSQL 15 for production (Docker)
- Schema at: `backend/prisma/schema.prisma`
- ORM: Prisma 5.x

## Related Roadmap Items
1. **Item 10:** "Kurzprofil mit Referenzprojekten verknuepfen + Kurztext-Felder" - New fields: "Kurztext fuer Kurzprofil" (100-150 chars) and "Kurze Projektbeschreibung" for PPT-Export
2. **Item 11:** "Referenzprojekte mit Mitarbeitern verknuepfen" - Real link to Employee accounts instead of free text "Person". Multiple employees per project possible.

## Goal
Create a Prisma model for ReferenceProject and migrate from file-based storage to database storage, ensuring all existing data is preserved and the application continues to work seamlessly.

## Size Estimate
S (Small - wenige Tage)
