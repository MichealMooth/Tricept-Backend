{{ ... }}

Enterprise Web-Applikation zur Verwaltung von Mitarbeiter-Skills mit Selbst- und Fremdeinschätzung, historischem Tracking und Gap-Analyse.

## Tech Stack

- **Frontend**: React 18+ with TypeScript, Vite, Zustand, Shadcn/UI, Recharts, Tailwind CSS
- **Backend**: Node.js 20+, Express.js, Prisma, PostgreSQL
- **Styling**: Tailwind CSS with Tricept corporate Design

## Getting Started

### Prerequisites

- Node.js 20+ LTS
- pnpm
- Docker & Docker Compose (for database and dev containers)
- PostgreSQL 15+ (optional locally; Docker setup included)

### Ports

- Frontend: http://localhost:3000
- Backend: http://localhost:4000
- PostgreSQL: localhost:5432
- pgAdmin: http://localhost:5050

### Installation

1. Install dependencies
   ```bash
   # Root is optional if using only workspaces
   pnpm install --ignore-workspace-root-check || true
   
   # Backend
   cd backend
   pnpm install
   cp .env.example .env
   
   # Frontend
   cd ../frontend
   pnpm install
   cp .env.example .env
   ```

2. Start the database via Docker
   ```bash
   # From repository root
   docker-compose up -d postgres pgadmin
   ```

3. Run Prisma migrations and generate client
   ```bash
   cd backend
   pnpm prisma:generate
   pnpm prisma:migrate
   ```

4. Start backend (port 4000)
   ```bash
   cd backend
   pnpm dev
   # Health: http://localhost:4000/api/health
   ```

5. Start frontend (port 3000)
   ```bash
   cd frontend
   pnpm dev
   # App: http://localhost:3000
   ```

### Docker (optional for services)

Build and run backend and frontend in containers:
```bash
docker-compose up -d --build backend frontend
```

## Project Structure

```
tricept-skill-matrix/
├── frontend/           # React + Vite frontend application
├── backend/            # Express.js backend API (TypeScript)
├── docs/               # Project documentation
├── docker-compose.yml  # Docker configuration (frontend, backend, postgres, pgadmin)
└── README.md           # This file
```

## Acceptance Criteria Checklist

- `pnpm install` läuft ohne Fehler in Frontend und Backend (siehe `backend/package.json`, `frontend/package.json`)
- `docker-compose up` startet Services (postgres, pgadmin; optional backend, frontend)
- Frontend läuft auf http://localhost:3000
- Backend läuft auf http://localhost:4000
- PostgreSQL läuft auf localhost:5432
- README enthält vollständige Setup-Anleitung (dieses Dokument)

## Notes

- Die DB-Constraints zur Ratingskala (1–10) werden auf Applikationsebene validiert (Zod), nicht via Prisma `@min/@max`.
- Shadcn/UI und weitere UI-Bausteine können schrittweise ergänzt werden.

## License

Proprietary - Tricept GmbH
