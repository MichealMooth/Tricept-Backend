# Current Status

> Single Source of Truth für den Entwicklungsstand. Vor jeder Ausführung lesen, nach jeder Änderung aktualisieren.
---
## Meta
- **Projekt**: Tricept Skillmatrix
- **Repository**: c:/Users/mmuth/CascadeProjects/windsurf-project
- **Letzte-Aktualisierung**: 2025-10-22T12:08:39+02:00
- **Version**: 0.1.0
- **Maintainer**: Engineering / Dev Team

## Zusammenfassung (aktueller Stand)
- Backend und Frontend laufen lokal integriert (Frontend: Vite auf Port 3000, Backend: Express auf Port 4000).
- Bestehende Module (Backend): Auth, Skills, Assessments, Matrix, Employees, Capacities, Strategic Goals, User Profile, Health, DB-Admin (nur Lesezwecke).
- Bestehende Frontend-Seiten/Komponenten: Login, Navbar, Kurzprofil-Seite (`KurzprofilPage.tsx`), Assess-Page (`AssessEmployeePage.tsx`), Admin/Tycoon-Page (`admin/TycoonPage.tsx`).
- Datenbank: Standardmäßig SQLite für lokale Entwicklung; Docker-Compose bereit für Postgres/pgAdmin. Prisma-Migrationen vorhanden.
- Export-Feature ist im Backend vorbereitet, Export-Route bleibt aktuell deaktiviert (bewusst).

## Wichtige Änderungen seit letzter Ausführung
- 2025-10-22: Dev-CORS für 127.0.0.1 hinzugefügt; CSRF/Session-Cookies in Dev auf SameSite=Lax; Seed ausgeführt; kleinere Lint-/Refactorings (unbenutzte Importe entfernt); Export-Service syntaktisch gefixt, Route weiterhin deaktiviert.
- 2025-10-22: Neue Komponente `DynamicTopicsSelect` unter `frontend/src/components/DynamicTopicsSelect.tsx` erstellt inkl. `Topics`-Enum-Quelle unter `frontend/src/constants/enums.ts`. Deduplizierende Mehrfachauswahl (1–6), a11y-Ankündigungen, vorgesehene Validierung via Zod.
- 2025-10-22: Navbar-Eintrag "Referenz‑Projekte" hinzugefügt (`frontend/src/components/NavBar.tsx`), Route `"/referenz-projekte"` hinter `ProtectedRoute` eingebunden (`frontend/src/App.tsx`), neue Seite `ReferenzProjektePage` erstellt (`frontend/src/pages/ReferenzProjektePage.tsx`) und Kachel auf Startseite ergänzt (`frontend/src/pages/Home.tsx`).
- 2025-10-22: Referenz Projekte – Laufzeit in zwei Felder aufgeteilt (`duration_from`/`duration_to`). Backend: Store/Controller/Route aktualisiert. Frontend: Liste, Formulare (Create/Edit/View) und Submit angepasst.

## Aktueller Scope
- **Feature-Status:**
  - User-Login & Authentifizierung: ✅ stabil (CSRF/CORS in Dev angepasst)
  - Dashboard/Übersicht: 🟡 vorhanden/zu konsolidieren (Basis-Komponenten vorhanden)
  - Kapazitätsverwaltung: 🟡 in Umsetzung (Endpunkte vorhanden, UI-Integration fortsetzen)
  - Kurzprofil-Seite: 🟡 in Entwicklung (CRUD-Anbindung weiter ausbauen)
  - Projekt-/Admin-Module (Tycoon): 🟡 vorhanden, Feinschliff nötig
  - Rollen- & Rechte-Logik: ✅ umgesetzt (Admin-Erkennung, Session)
  - Reporting/Export: ⛔ deaktiviert (Service vorhanden, Route aus)

## Offene Aufgaben (Priorität ↓)
1. [ ] Kurzprofil-CRUD vollständig anbinden (Backend `user-profile` Routes nutzen)
2. [ ] Kapazitätsübersicht in UI integrieren (Endpunkte `capacities` anbinden)
3. [ ] Frontend-Lint/Typecheck-Setup anpassen und laufen lassen (projekt-spezifische ESLint-Konfig prüfen)
4. [ ] Backend-Lint/Types schrittweise härten (implizite any, konsistente Returns)
5. [ ] Optionale Umstellung auf Postgres lokal (`.env` DATABASE_URL, Migrationslauf)
6. [ ] Export-Route erst nach Stabilisierung typisieren/aktivieren

## Risiken & Blocker
- Unterschiedliche Origins (localhost vs. 127.0.0.1) erfordern in Dev besondere CORS/CSRF-Konfiguration.
- Node-Version lokal <20 kann Warnungen verursachen; empfohlen: Node 20+.

## Architektur / Komponenten
- **Frontend**: React 18 + TypeScript, Vite, Zustand, Shadcn/UI, Tailwind, React Router, Axios.
- **Backend**: Node 20+, Express, Prisma, Zod, Passport (Local/JWT), Helmet, CORS, CSRF.
- **Datenbank**: SQLite (Dev default) oder PostgreSQL (Docker Compose, pgAdmin enthalten).

## Relevante Endpoints (derzeit)
- `GET /api/health` — Healthcheck
- `GET /api/auth/csrf` — CSRF-Token
- `POST /api/auth/register` — Registrierung
- `POST /api/auth/login` — Login
- `POST /api/auth/logout` — Logout
- `GET /api/auth/me` — Session-User
- `GET /api/user/profile/:userId` — Benutzerprofil lesen
- `POST /api/user/profile` — Profil anlegen
- `PUT /api/user/profile/:userId` — Profil aktualisieren
- `GET /api/capacities/:userId/:year` — Kapazitäten lesen
- `POST /api/capacities/:userId/:month` — Monatseintrag speichern
- `GET /api/skills/*`, `GET /api/matrix/*`, `GET /api/assessments/*`, `GET /api/strategic-goals/*` — Domänenendpunkte (Details in Routen-Dateien)
- `GET /api/admin/db/*` — DB-Admin-Read-Only (Tabellen/Infos/Rows)

## Nächste Ausführung: Kontext-Hinweise für die KI
- **Fokus**: Kurzprofil-CRUD finalisieren und Kapazitäts-UI anbinden.
- **Akzeptanzkriterien**:
  - Navbar-Eintrag sichtbar
  - CRUD-Funktionalität für Profilfelder vollständig (Create/Read/Update)
  - Persistenz im Backend (Status-Codes/Fehlerbehandlung)
- **Bekannte Stolpersteine**:
  - CSRF-Header bei mutierenden Requests erforderlich (`x-csrf-token`)
  - Origin-Unterschiede (IDE-Proxy vs. localhost) beachten

