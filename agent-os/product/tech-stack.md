# Tech Stack

## Frontend

| Technology | Version | Purpose | Rationale |
|------------|---------|---------|-----------|
| React | 18.x | UI Framework | Industry standard for component-based UIs; excellent ecosystem and community support |
| TypeScript | 5.x | Type Safety | Catches errors at compile time; improves developer experience with IDE support |
| Vite | 5.x | Build Tool | Fast HMR and build times; native ESM support; simpler configuration than Webpack |
| React Router DOM | 6.x | Routing | De facto standard for React routing; declarative route definitions |
| TanStack Query | 5.x | Data Fetching | Powerful server state management; built-in caching, refetching, and optimistic updates |
| Zustand | 4.x | State Management | Lightweight alternative to Redux; simple API with minimal boilerplate |
| Axios | 1.x | HTTP Client | Consistent API across browsers; interceptor support for auth tokens |
| Shadcn/UI | latest | UI Components | Accessible, customizable components built on Radix UI primitives |
| Radix UI | latest | Headless Components | Unstyled primitives enabling full design control with accessibility built-in |
| Tailwind CSS | 3.x | Styling | Utility-first CSS enabling rapid UI development with consistent design system |
| Recharts | 2.x | Data Visualization | React-native charting library; composable chart components |
| React Hook Form | 7.x | Form Handling | Performant form validation with minimal re-renders |
| Zod | 3.x | Validation | TypeScript-first schema validation; integrates with React Hook Form |
| Vitest | 1.x | Testing | Fast unit testing; Vite-native; Jest-compatible API |
| Testing Library | 14.x | Component Testing | Best practices for testing React components; accessibility-focused queries |

## Backend

| Technology | Version | Purpose | Rationale |
|------------|---------|---------|-----------|
| Node.js | 20+ LTS | Runtime | Non-blocking I/O for scalable APIs; unified JavaScript across stack |
| Express.js | 4.x | Web Framework | Minimal, flexible framework; extensive middleware ecosystem |
| TypeScript | 5.x | Type Safety | Consistent typing with frontend; better maintainability |
| Prisma | 5.x | ORM | Type-safe database client; declarative schema; excellent migrations |
| Passport.js | 0.7.x | Authentication | Modular authentication strategies; session management support |
| bcrypt | 5.x | Password Hashing | Industry-standard secure password hashing |
| Winston | 3.x | Logging | Flexible logging with multiple transports; structured logging support |
| Helmet | 7.x | Security Headers | Security best practices for HTTP headers with minimal configuration |
| CORS | 2.x | Cross-Origin | Configurable CORS handling for API security |
| csurf | 1.x | CSRF Protection | Cookie-based CSRF token validation |
| express-rate-limit | 7.x | Rate Limiting | API abuse prevention; configurable limits |
| express-session | 1.x | Session Management | Server-side session storage for authentication state |
| Zod | 3.x | Validation | Consistent validation approach with frontend; TypeScript integration |
| Jest | 29.x | Testing | Comprehensive testing framework; snapshot testing support |
| ts-jest | 29.x | TypeScript Testing | TypeScript support for Jest without separate compilation step |

## Database

| Technology | Version | Purpose | Rationale |
|------------|---------|---------|-----------|
| SQLite | 3.x | Development Database | Zero-configuration local development; file-based simplicity |
| PostgreSQL | 15.x | Production Database | Enterprise-grade RDBMS; excellent JSON support; proven scalability |
| Prisma Schema | - | Schema Definition | Single source of truth for database structure; generates types and migrations |

## DevOps & Infrastructure

| Technology | Version | Purpose | Rationale |
|------------|---------|---------|-----------|
| Docker | 24.x | Containerization | Consistent environments across development and production |
| Docker Compose | 2.x | Multi-Container Orchestration | Simple local development with multiple services |
| pnpm | 8.x | Package Manager | Fast, disk-efficient package management; strict dependency resolution |
| ESLint | 8.x | Linting | Code quality enforcement; consistent style across team |
| Prettier | 3.x | Formatting | Automated code formatting; eliminates style debates |
| pgAdmin | 8.x | Database Administration | Web-based PostgreSQL management for development and debugging |

## Architecture Patterns

### Backend Architecture

```
Routes -> Controllers -> Services -> Prisma Client -> Database
```

- **Layered Architecture:** Clear separation of concerns between HTTP handling, business logic, and data access
- **Middleware Pipeline:** Express middleware for cross-cutting concerns (auth, validation, error handling)
- **Path Aliases:** TypeScript path mapping (`@/*` -> `src/*`) for clean imports

### Frontend Architecture

```
Pages -> Components -> Hooks -> Services -> API
```

- **Component-Based:** Reusable UI components with Shadcn/UI primitives
- **Custom Hooks:** Encapsulated logic for auth, data fetching, and form handling
- **Service Layer:** Centralized API calls with typed responses

### Data Fetching Strategy

- **TanStack Query:** Server state management with automatic caching and background refetching
- **Optimistic Updates:** Immediate UI feedback for mutations with rollback on failure
- **CSRF Protection:** Token-based protection for all mutating operations

### Security Architecture

- **Session-Based Auth:** HttpOnly cookies with SameSite protection
- **CSRF Tokens:** Double-submit cookie pattern for mutation protection
- **Input Validation:** Zod schemas at API boundaries
- **SQL Injection Prevention:** Prisma parameterized queries
- **XSS Prevention:** React's default output escaping

## Development Environment

| Tool | Purpose |
|------|---------|
| VS Code | Primary IDE with TypeScript and ESLint integration |
| Prisma Studio | Visual database browser for development |
| Docker Desktop | Local container management |
| pnpm | Package installation and script running |

## Environment Configuration

### Frontend Environment Variables

| Variable | Description |
|----------|-------------|
| `VITE_API_BASE_URL` | Backend API URL (e.g., `http://localhost:4000/api`) |

### Backend Environment Variables

| Variable | Description |
|----------|-------------|
| `NODE_ENV` | Environment mode (development/production/test) |
| `PORT` | Server port (default: 4000) |
| `DATABASE_URL` | Prisma database connection string |
| `SESSION_SECRET` | Secret for session cookie signing |
| `CORS_ORIGIN` | Allowed CORS origin(s) |
| `RATE_LIMIT_WINDOW_MS` | Rate limiting window in milliseconds |
| `RATE_LIMIT_MAX` | Maximum requests per window |

## Port Assignments

| Service | Port | Description |
|---------|------|-------------|
| Frontend | 3000 | Vite development server |
| Backend | 4000 | Express API server |
| PostgreSQL | 5432 | Database server |
| pgAdmin | 5050 | Database administration UI |
