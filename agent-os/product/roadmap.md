# Product Roadmap

## Current State (Phase 0 - Completed)

The following core features are already implemented and functional:

- [x] User authentication with session-based security and CSRF protection
- [x] Skill self-assessment with 1-10 rating scale
- [x] Peer assessment system for external skill validation
- [x] Skill matrix visualization with filtering and export
- [x] Hierarchical skill categories management
- [x] Historical skill tracking with temporal validity (validFrom/validTo)
- [x] Monthly capacity planning and allocation tracking
- [x] Strategic goals with traffic-light rating system (1-5)
- [x] Employee profiles (Kurzprofil) with experience, certifications, and project references
- [x] Reference projects database (in-memory store)
- [x] Admin panel with database browser
- [x] Role-based access control (user/admin)

---

## Phase 1 - Aktive Roadmap

### Infrastruktur & Datenpersistenz

1. [x] **Datenpersistenz sicherstellen (Reference Projects → PostgreSQL)** -- Migration der Referenzprojekte von file-based Store zu PostgreSQL mit Prisma Model. Alle Daten einheitlich in der Produktionsdatenbank persistent. `S`

2. [ ] **API Documentation and OpenAPI Spec** -- Umfassende API-Dokumentation mit OpenAPI/Swagger-Spezifikation für Integrationen und Entwickler. `S`

3. [ ] **SSO Integration** -- SAML/OAuth-Unterstützung für Enterprise Single Sign-On Provider (Azure AD, Okta) zur vereinfachten Benutzerauthentifizierung. `L`

### Skill Matrix & Assessments

4. [ ] **Team Skill Heatmap** -- Interaktive Heatmap-Visualisierung der Skill-Verteilung über Teams. Schnelles Erkennen von Kompetenz-Konzentrationen und Lücken. `M`

5. [ ] **Assessment History Timeline** -- Visuelle Timeline-Ansicht für Mitarbeiter mit Skill-Entwicklung über Zeit und Assessment-Meilensteinen. `S`

6. [ ] **Excel-Export reaktivieren** -- Excel-Export (.xlsx) für die Skill Matrix wieder aktivieren (aktuell auskommentiert wegen xlsx-Dependency). `S`

### Kapazitätsplanung

7. [ ] **Projektdaten via externe Schnittstelle** -- Anbindung an externe API (Projektverwaltungssystem) um Projekte des Mitarbeiters automatisch zu laden. Kapazitätsplanung basiert auf echten Projektdaten. `L`

8. [ ] **Kapazitäts-Warnungen bei Überbuchung** -- Visuelles Warnsystem bei Über-/Unterbuchung (>100% rot, <50% gelb). Hilft Überlastung schnell zu erkennen. `S`

### Kurzprofil & Referenzprojekte

9. [ ] **Kurzprofil-Export in PowerPoint-Vorlage** -- Admin hinterlegt PPT-Vorlage mit Platzhaltern ({{firstName}}, {{experience}}, etc.). Mitarbeiter exportieren ihr Profil als befüllte PPT. Vorlage und Profildaten nur an einer Stelle pflegen. `L`

10. [ ] **Kurzprofil mit Referenzprojekten verknüpfen + Kurztext-Felder** -- Referenzprojekte direkt im Kurzprofil verlinken statt Freitext. Neue Felder: "Kurztext für Kurzprofil" (100-150 Zeichen) und "Kurze Projektbeschreibung" für PPT-Export. `M`

11. [ ] **Referenzprojekte mit Mitarbeitern verknüpfen** -- Echte Verknüpfung zu Mitarbeiter-Accounts statt Freitext "Person". Mehrere Mitarbeiter pro Projekt möglich. `M`

### Admin & Import

12. [ ] **Bulk Import/Export** -- CSV/Excel Import für Skills und Mitarbeiter. Unterstützt initiale Datenmigration und Massenaktualisierungen. `M`

13. [ ] **Mitarbeiter-Import via Excel** -- Bulk-Import von Mitarbeitern per Excel-Datei (Name, Email, Abteilung etc.). `S`

### User Experience

14. [ ] **Dashboard mit persönlicher Übersicht** -- Startseite zeigt personalisierte Infos: offene Assessments, aktuelle Kapazität, Status der Strategic Goals auf einen Blick. `M`

15. [ ] **Dark Mode** -- Umschaltbare dunkle Farbvariante der Oberfläche. `S`

16. [ ] **Mobile-Responsive Optimization** -- UI-Komponenten für bessere Nutzbarkeit auf Tablets und Mobilgeräten optimieren. `M`

### Plattform-Transformation

17. [ ] **Rebranding & Multi-Abteilungs-Architektur** -- Umbau von "IT-Consulting Backend" zu "Tricept Backend" für alle Mitarbeiter. Neue Bereichs-Navigation:
   - **Allgemein** (alle Mitarbeiter): Kurzprofil, Kapazitätsplanung, Dashboard
   - **Consulting** (Consulting-Mitarbeiter): Meine Skills, Referenzprojekte, Strategische Ziele
   - Erweiterbar für weitere Abteilungen/Funktionen `L`

---

## Zukunftsvision (Out of Scope für aktuelle Iteration)

Die folgenden Features sind für zukünftige Entwicklung geplant, aber nicht Teil der aktuellen Roadmap:

1. [ ] **Zeitbuchung mit Outlook-Integration** -- Mitarbeiter buchen Arbeitszeiten pro Projekt. Outlook-Kalender-Integration für automatische Meeting-Zuordnung zu Projekten. Auswertungen für Projektcontrolling. `XL`

2. [ ] **Reisekostenabrechnung** -- Digitale Reisekostenabrechnung auf Basis des bestehenden Reisekostenformulars im Tricept Backend. `XL`

---

> **Größen-Legende:**
> - `S` = Small (wenige Tage)
> - `M` = Medium (1-2 Wochen)
> - `L` = Large (mehrere Wochen)
> - `XL` = Extra Large (umfangreiches Projekt)
