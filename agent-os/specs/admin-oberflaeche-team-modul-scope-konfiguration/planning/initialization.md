# Initialization: Admin-Oberflaeche Team-Modul-Scope-Konfiguration

## Raw Description

### Ziel
Zentrale Admin-Oberflaeche fuer:
- Teams anlegen und verwalten
- Pro Modul konfigurieren: ob verfuegbar, fuer welche Teams sichtbar, welcher Daten-Scope

### Funktionale Anforderungen

**FR-1 Teamverwaltung (CRUD)**
- Teams anlegen, bearbeiten, deaktivieren, einsehen
- Felder: Name (eindeutig), Beschreibung (optional), Status (aktiv/inaktiv)
- Inaktive Teams nicht mehr neu zuweisbar, bestehende Zuordnungen bleiben

**FR-2 Mitarbeiter-zu-Team-Zuweisung**
- In Mitarbeiterverwaltung Team zuweisen via Dropdown (nur aktive Teams)
- Aenderungen greifen sofort

**FR-3 Modulverwaltung**
- Alle Module zentral registriert
- Jedes Modul automatisch in Admin-Oberflaeche
- Kein Modul ohne Konfigurierbarkeit

**FR-4 Modul-Aktivierung/Sichtbarkeit pro Team**
- Pro Team/Modul: aktiv oder inaktiv
- Deaktivierte Module: nicht in Navigation, serverseitig gesperrt

**FR-5 Daten-Scope-Konfiguration pro Modul**
- Scopes: GLOBAL (tricept-weit), TEAM (teambezogen), PERSONAL (userbezogen)
- Verbindlich fuer: Datenhaltung, API-Zugriff, UI-Darstellung

**FR-6 Team-abhaengige Datenanzeige**
- Team-Scope: Inhalte strikt getrennt, bei Multi-Team mit Headers
- Global-Scope: ignoriert Teamzugehoerigkeit
- Personal-Scope: nur eigene Daten

**FR-7 Vollstaendigkeit & Zwang**
- Jedes Modul muss Scope und Team-Aktivierung haben
- Kein Modul ohne Konfiguration erlaubt

### Nicht-funktionale Anforderungen
- NFR-1: Sicherheit - serverseitige Erzwingung, revisionssichere Protokollierung
- NFR-2: Wartbarkeit - zentrale Berechtigungs-/Scope-Pruefung
- NFR-3: Benutzerfreundlichkeit - klare Uebersicht pro Modul

### Out of Scope
- SSO-Anbindungen
- Feingranulare Rechte innerhalb eines Moduls
- Mandantenfaehigkeit

### Context
This builds on the recently implemented "Datenhaltung & Berechtigungen" spec which added:
- TeamGroup and TeamMembership models
- authorize() middleware with GLOBAL/TEAM/USER scopes
- TeamGroup CRUD API
