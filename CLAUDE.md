# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Nodebook is a modular node-based notebook application with a PostgreSQL backend and React frontend. The project uses a monorepo structure managed by pnpm workspaces and runs entirely in Docker containers.

## Tech Stack

**Backend:**
- Express.js + TypeScript
- Drizzle ORM (type-safe PostgreSQL queries)
- Zod (validation)
- bcryptjs (password hashing)
- jsonwebtoken (JWT authentication with HTTP-only cookies)
- express-rate-limit (API rate limiting)

**Frontend:**
- React 18 + TypeScript
- Vite (build tool)
- TanStack Query (server state management)
- React Router (navigation)
- Axios (HTTP client)
- Tailwind CSS (styling)

**Database:**
- PostgreSQL 15
- UUID primary keys (immutable node IDs)
- JSONB for flexible node content
- Recursive foreign keys for node hierarchy

## Architecture

**Monorepo Structure:**
- `server/` - Express + TypeScript backend with Drizzle ORM
- `web/` - Vite + React + TypeScript frontend
- Root-level pnpm workspace coordinates both packages

**Data Flow:**
1. Frontend (`web/`) uses React Router for navigation and TanStack Query for server state
2. API client (`web/src/api.ts`) communicates with backend via axios
3. Backend (`server/`) uses Express with Drizzle ORM for type-safe PostgreSQL queries
4. Database schema managed via Drizzle migrations (`server/drizzle/`)

**Database Connection:**
- Server connects to PostgreSQL using Drizzle ORM in `server/src/services/db.ts`
- Connection string constructed from environment variables
- Database service name is `db` (Docker Compose service)
- Migrations run automatically on server startup

**Authentication:**
- JWT-based authentication with HTTP-only cookies
- Access token (7 days) + refresh token (30 days)
- Passwords hashed with bcrypt (12 rounds)
- Protected routes use `requireAuth` middleware
- CORS configured for credentials

**File Uploads:**
- Multer handles multipart form data on server
- Files stored in `./uploads/` directory (Docker volume mounted)
- Served as static files via `/uploads` route

## Development Commands

**Initial Setup:**
```bash
# Install all workspace dependencies
pnpm install -w

# Generate database migrations (run after schema changes)
cd server && pnpm run db:generate

# Start all services (db, server, web)
docker compose up --build -d

# Database migrations run automatically on server start
# Or manually: docker compose exec server pnpm run db:migrate
```

**Development:**
```bash
# Start all services with logs
pnpm run dev:all  # or docker compose up --build

# Stop and remove all containers + volumes
pnpm run down  # or docker compose down -v

# Access container shells
docker compose exec server sh
docker compose exec web sh
```

**Server Development:**
```bash
# Run server in dev mode (inside container)
cd server && pnpm run dev

# Build server
cd server && pnpm run build

# Run production build
cd server && pnpm run start
```

**Frontend Development:**
```bash
# Run Vite dev server (inside container)
cd web && pnpm run dev

# Build for production
cd web && pnpm run build

# Preview production build
cd web && pnpm run preview
```

**Code Quality:**
```bash
# Lint all code
pnpm run lint

# Format all code
pnpm run format
```

## Service Ports

- Frontend: http://localhost:5173 (Vite dev server, proxied through port 3000 in Docker)
- Backend API: http://localhost:4000/api
- PostgreSQL: localhost:5432
- Adminer (DB GUI): http://localhost:8080

## Environment Configuration

Copy `.env.example` to `.env` and configure:
- `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB` - Database credentials
- `POSTGRES_PORT` - Database port (default: 5432)
- `PORT` - Backend server port (default: 4000)
- `JWT_SECRET` - JWT signing secret (currently in .env but auth routes removed)

## Database Schema

**Core Tables:**
- `users` - User accounts (id, email, password_hash, name, timestamps)
- `nodes` - Core node entity with UUID, parent_id, name, type, color, JSONB content, metadata, position, version, timestamps
- `tags` - User-defined tags (id, user_id, name, color)
- `node_tags` - Many-to-many junction table for node-tag relationships
- `node_references` - Tracks which nodes reference/embed other nodes
- `workspaces` - Dashboard configurations (id, user_id, name, layout, is_default)

**Node System:**
- Every node has an immutable UUID as primary key
- Nodes can be nested via `parent_id` (self-referential foreign key)
- Node types: root, folder, document, paragraph, table, table-row, table-cell, calendar, event, reference, widget
- Content stored as JSONB for flexibility
- Version field for optimistic locking
- Position field maintains order within parent
- All foreign keys use CASCADE delete

**Indexes:**
- user_id, parent_id, type, position for fast queries
- Composite index on (parent_id, position) for ordering
- Email index on users table

## Key Implementation Details

**Backend Routes:**
- `/api/auth/*` - Authentication (register, login, logout, refresh, me)
- `/api/modules/*` - Legacy module routes (will be replaced with nodes API)
- `/api/health` - Health check endpoint

**Frontend Pages:**
- `/` - Welcome page
- `/modules` - Main modules management page (to be refactored)
- Auth pages (login/register) - pending implementation

**Validation:**
- All API inputs validated with Zod schemas
- Validation middleware returns detailed error messages
- Content sanitization for XSS prevention

## Important Notes

- Database migrations managed by Drizzle (run automatically on startup)
- JWT tokens stored in HTTP-only cookies (not localStorage)
- Rate limiting: 100 requests per 15 minutes per IP
- CORS configured for `http://localhost:5173` (development)
- Frontend expects API at `VITE_API_URL` env var
- All services must run in Docker for proper networking
