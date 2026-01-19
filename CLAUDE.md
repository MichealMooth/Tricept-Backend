# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Tricept Skill Matrix Management System - An enterprise web application for managing employee skills with self-assessment, peer assessment, historical tracking, and gap analysis. Includes capacity planning, strategic goal tracking, and employee profile management.

**Key Features:**
- Skill assessments (self + peer) with 1-10 rating scale
- Historical skill tracking with temporal validity
- Skill matrix visualization with filtering and export
- Capacity planning and allocation tracking
- Strategic goals monitoring (traffic light ratings 1-5)
- Employee profile management (Kurzprofil) with project references
- Reference projects database
- Admin panel with database browser

## Tech Stack

**Frontend:**
- React 18 + TypeScript
- Vite (dev server + build)
- Zustand (state management)
- React Router DOM (routing)
- TanStack Query (data fetching)
- Shadcn/UI + Radix UI (components)
- Tailwind CSS (styling with Tricept corporate design)
- Recharts (data visualization)
- Zod (validation)
- Vitest (testing)

**Backend:**
- Node.js 20+ with Express.js
- TypeScript with path aliases (`@/*` → `src/*`)
- Prisma ORM with SQLite (dev) / PostgreSQL (production)
- Passport.js (authentication: local + JWT)
- Session-based auth with CSRF protection
- Winston (logging)
- Zod (validation)
- Jest (testing)

**Database:**
- SQLite for development (`backend/dev.db`)
- PostgreSQL 15 for production (Docker)
- Prisma schema: `backend/prisma/schema.prisma`

**Deployment:**
- Docker Compose with services: postgres, pgadmin, backend, frontend
- pnpm for package management

## Development Commands

### Backend (`cd backend`)

```bash
# Install dependencies
pnpm install

# Development (watch mode)
pnpm dev                    # Starts backend on http://localhost:4000

# Build
pnpm build                  # Compile TypeScript to dist/

# Production
pnpm start                  # Run compiled code from dist/

# Database
pnpm prisma:generate        # Generate Prisma client
pnpm prisma:migrate         # Run migrations
pnpm seed                   # Seed database
pnpm prisma:studio          # Open Prisma Studio GUI

# Testing
pnpm test                   # Run Jest tests
pnpm test -- <filename>     # Run specific test file

# Code Quality
pnpm lint                   # ESLint
pnpm format                 # Prettier
```

### Frontend (`cd frontend`)

```bash
# Install dependencies
pnpm install

# Development
pnpm dev                    # Starts frontend on http://localhost:3000

# Build
pnpm build                  # TypeScript check + Vite build

# Testing
pnpm test                   # Run Vitest tests
pnpm test:ui                # Run Vitest with UI
pnpm test:coverage          # Run tests with coverage

# Preview
pnpm preview                # Preview production build

# Code Quality
pnpm lint                   # ESLint
pnpm format                 # Prettier
```

### Docker (repository root)

```bash
# Start only database services
docker-compose up -d postgres pgadmin

# Start all services (including backend and frontend)
docker-compose up -d --build

# Stop all services
docker-compose down

# View logs
docker-compose logs -f backend
docker-compose logs -f frontend
```

**Service URLs:**
- Frontend: http://localhost:3000
- Backend: http://localhost:4000
- Backend Health: http://localhost:4000/api/health
- PostgreSQL: localhost:5432
- pgAdmin: http://localhost:5050 (admin@tricept.de / admin)

## Architecture

### Backend Structure

**Entry Point:** `backend/src/index.ts` → imports `backend/src/app.ts` (Express app)

**Layered Architecture:**
```
Routes → Controllers → Services → Prisma
```

**Key Patterns:**
1. **Authentication:** Session-based with Passport.js (local strategy + serialization). CSRF protection via `csurf` middleware. JWT tokens available but sessions are primary.
2. **Authorization:** Middleware checks `req.user` (from passport session). Admin routes use `isAdmin` check.
3. **Path Aliases:** Uses TypeScript path mapping (`@/*` → `src/*`, `@config/*`, etc.). Requires `tsconfig-paths/register` at runtime (see `package.json` dev script).
4. **Database Access:** All DB operations go through Prisma Client (`@prisma/client`). Connection managed in `src/config/database.ts`.
5. **Error Handling:** Global error handler middleware (`src/middleware/error-handler.ts`) catches all errors and formats responses.
6. **Validation:** Zod schemas validate request bodies before reaching controllers.
7. **Security:** Helmet, CORS, rate limiting, CSRF tokens, secure session cookies.

**Key Files:**
- `src/app.ts` - Express app setup with all middleware and routes
- `src/config/passport.ts` - Passport local strategy + session serialization
- `src/config/env.ts` - Environment variable validation (Zod)
- `src/config/database.ts` - Prisma client initialization
- `src/middleware/auth.middleware.ts` - `requireAuth`, `requireAdmin`
- `src/middleware/security.ts` - CORS, Helmet, rate limiting

**Route Pattern:** All API routes prefixed with `/api`:
- `/api/auth` - login, logout, session, CSRF token
- `/api/skills` - skill + category CRUD (admin only for mutations)
- `/api/assessments` - skill assessments (self + peer)
- `/api/matrix` - skill matrix data retrieval
- `/api/employees` - employee CRUD
- `/api/capacities` - capacity planning
- `/api/strategic-goals` - strategic goal tracking
- `/api/user-profile` - employee profile management
- `/api/reference-projects` - reference projects (in-memory store)
- `/api/db-admin` - database browser (admin only)

### Frontend Structure

**Entry Point:** `frontend/src/main.tsx` → renders `App.tsx` wrapped in providers

**Component Architecture:**
```
App.tsx (routes) → Pages → Components
```

**State Management:**
1. **Auth:** React Context (`src/hooks/useAuth.ts`) wraps entire app. Provides `user`, `login`, `logout`, `refresh`.
2. **Data Fetching:** TanStack Query for server state. Each service file exports API calls using axios instance.
3. **Forms:** React Hook Form + Zod validation
4. **UI Components:** Shadcn/UI components in `src/components/ui/` (not explicitly shown but implied by imports)

**Key Patterns:**
1. **API Client:** `src/services/api.ts` exports configured axios instance with:
   - Base URL from `VITE_API_BASE_URL` env var
   - `withCredentials: true` for session cookies
   - CSRF token interceptor (fetches `/auth/csrf` before mutating requests)
   - 401 redirect interceptor (redirects to `/login`)
2. **Protected Routes:** `<ProtectedRoute>` component checks auth and redirects to login
3. **Admin Routes:** `<AdminRoute>` component checks `isAdmin` flag
4. **Service Layer:** Each feature has a service file (e.g., `src/services/skill.service.ts`) that exports typed API functions

**Key Files:**
- `src/App.tsx` - React Router setup with all routes
- `src/hooks/useAuth.ts` - Auth context provider and hook
- `src/services/api.ts` - Axios instance with interceptors
- `src/components/ProtectedRoute.tsx` - Auth guard for routes
- `src/components/AdminRoute.tsx` - Admin guard for routes

**Page Structure:**
- `/` - Home (dashboard)
- `/login` - Login page
- `/my-skills` - Self-assessment page
- `/assess` - Peer assessment page
- `/matrix` - Skill matrix visualization
- `/employees/:id` - Employee profile view
- `/my-capacity` - Personal capacity planning
- `/capacities-overview` - Team capacity overview
- `/strategic-goals` - Strategic goals tracking
- `/kurzprofil` - Employee short profile management
- `/referenz-projekte` - Reference projects view
- `/admin/*` - Admin pages (skills, employees, tycoon game, capacities, strategic goals, reference projects, database browser)

### Database Schema

**Core Models:** (see `backend/prisma/schema.prisma`)

1. **Employee** - User accounts with auth + profile data
   - Relations: selfAssessments, givenAssessments, capacities, strategicRatings, profile
2. **Skill** - Skills organized by category
   - Relations: category, assessments
3. **SkillCategory** - Hierarchical skill categories (self-referencing)
   - Relations: parent, children, skills
4. **SkillAssessment** - Skill ratings (self or peer)
   - Fields: employeeId, skillId, assessmentType, assessorId, rating (1-10), validFrom, validTo
   - Relations: employee, assessor, skill
5. **UserCapacity** - Monthly capacity allocations
   - Fields: userId, year, month, allocations (JSON), totalPercent
6. **StrategicGoal** - Strategic goals with traffic light tracking
   - Fields: key, title, description, displayOrder, isActive
   - Relations: ratings
7. **StrategicGoalRating** - Monthly goal ratings
   - Fields: goalId, userId, year, month, rating (1-5), comment
8. **UserProfile** - Extended employee profile data (Kurzprofil)
   - Fields: userId, firstName, lastName, roleTitle, mainFocus, projectReferences (JSON), experience, certifications, tools (JSON), methods (JSON), softSkills (JSON), education, profileImageUrl

**Temporal Validity:** SkillAssessment uses `validFrom`/`validTo` for historical tracking. Current assessments have `validTo = null`.

**JSON Fields:** Some fields store JSON as strings (e.g., allocations, projectReferences, tools). Validation happens at application level (Zod).

### Authentication Flow

1. **Login:** User submits email/password → `/api/auth/login` → Passport local strategy validates → creates session → returns user object
2. **Session:** Session cookie stored in browser → sent with every request → Passport deserializes user from session → attaches to `req.user`
3. **CSRF:** Frontend fetches `/api/auth/csrf` before mutating requests → includes `x-csrf-token` header → backend validates token
4. **Logout:** `/api/auth/logout` → destroys session → clears cookie
5. **Protection:** Backend routes use `requireAuth` middleware to check `req.user`. Frontend uses `<ProtectedRoute>` to redirect if not authenticated.

### Testing

**Backend:**
- Jest with `ts-jest`
- Test files: `*.test.ts` or `*.spec.ts` (excluded from build)
- Test utilities in `src/tests/utils/` (testDb, seed, prismaTestClient)
- Run with `pnpm test` or `pnpm test -- <filename>`

**Frontend:**
- Vitest with `@testing-library/react`
- Test files: `*.test.tsx` or `*.spec.tsx`
- Setup: `src/setupTests.ts`
- Run with `pnpm test`, `pnpm test:ui`, or `pnpm test:coverage`

## Important Notes

1. **Database Provider:** Schema uses SQLite for development (`file:./dev.db`). For production, change `datasource.provider` to `postgresql` and update `DATABASE_URL`.
2. **Path Aliases:** Backend uses `@/*` path aliases. Must run with `tsx watch -r tsconfig-paths/register` (already in `package.json`). Production build uses `tsc-alias` to resolve paths.
3. **Rating Scales:**
   - Skills: 1-10 (validated by Zod, not Prisma)
   - Strategic Goals: 1-5 (1=red, 2=yellow-red, 3=yellow, 4=yellow-green, 5=green)
4. **CSRF Protection:** Disabled in test environment (`src/app.ts` checks `env.nodeEnv !== 'test'`).
5. **Reference Projects:** Currently using in-memory store (`src/services/reference-projects.store.ts`). No Prisma model yet.
6. **Excel Export:** Backend export route commented out to avoid runtime xlsx dependency. Frontend handles exports client-side.
7. **Environment Variables:** Both frontend and backend need `.env` files copied from `.env.example`.

## Development Workflow

1. **Setup:**
   ```bash
   # Backend
   cd backend
   pnpm install
   cp .env.example .env
   pnpm prisma:generate
   pnpm prisma:migrate
   pnpm seed  # Optional: seed test data

   # Frontend
   cd ../frontend
   pnpm install
   cp .env.example .env
   ```

2. **Run locally (no Docker):**
   ```bash
   # Terminal 1: Backend
   cd backend && pnpm dev

   # Terminal 2: Frontend
   cd frontend && pnpm dev
   ```

3. **Run with Docker:**
   ```bash
   # Just database
   docker-compose up -d postgres pgadmin

   # Full stack
   docker-compose up -d --build
   ```

4. **Database Changes:**
   - Edit `backend/prisma/schema.prisma`
   - Run `pnpm prisma:migrate` to create migration
   - Run `pnpm prisma:generate` to update Prisma Client types
   - Update services/controllers to use new schema

5. **Adding New Features:**
   - Backend: Route → Controller → Service → Prisma
   - Frontend: Service → Page/Component → React Query hook
   - Always add Zod validation for new API endpoints
   - Add TypeScript types in `src/types/index.ts` (frontend) or inline (backend)

## Common Pitfalls

1. **CSRF Token Missing:** If mutations fail with 403, ensure frontend's axios interceptor is fetching `/auth/csrf` and adding `x-csrf-token` header.
2. **Path Aliases Not Resolving:** Backend must run with `tsconfig-paths/register`. Production builds use `tsc-alias` after `tsc`.
3. **Session Not Persisting:** Check `withCredentials: true` in axios config and CORS `credentials: true` in backend.
4. **Prisma Client Out of Sync:** After schema changes, always run `pnpm prisma:generate` before starting dev server.
5. **Port Conflicts:** Frontend (3000), Backend (4000), PostgreSQL (5432), pgAdmin (5050). Check if ports are already in use.
6. **401 Redirects:** Frontend redirects to `/login` on 401. Ensure backend returns 401 (not 403) for unauthenticated requests.

## Security Considerations

- **Input Validation:** All user input validated with Zod schemas before reaching business logic
- **SQL Injection:** Protected by Prisma's parameterized queries
- **XSS:** React escapes output by default; be cautious with `dangerouslySetInnerHTML`
- **CSRF:** Protected by `csurf` middleware with cookie-based tokens
- **Session Security:** HttpOnly, SameSite, Secure cookies (production only)
- **Rate Limiting:** Applied globally (see `RATE_LIMIT_*` env vars)
- **Password Storage:** bcrypt hashing (handled by `auth.service.ts`)
- **Admin Actions:** Protected by `requireAdmin` middleware
