# Nodebook

Nodebook — modular node-based notebook. This repo contains:

- `server` — Node + TypeScript + Express backend (Prisma + PostgreSQL)
- `web` — Vite + React + TypeScript frontend

## Quick start (dev)
1. Copy `.env.example` to `.env` and fill in values:
   - `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`, `JWT_SECRET`

2. Start everything:
```bash
pnpm install -w
docker compose up --build -d
```
```bash
docker compose exec server npx prisma generate
docker compose exec server npx prisma db push
```

3. Create a user:
```bash
curl -X POST http://localhost:4000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"you@example.com","password":"yourpassword"}'
```

and login
```bash
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"you@example.com","password":"yourpassword"}'
```

Open the frontend at http://localhost:5173
 and authenticate (enter token in the login form or use the built-in login UI).



Server API: http://localhost:4000

Frontend: http://localhost:5173

Adminer (DB GUI): http://localhost:8080