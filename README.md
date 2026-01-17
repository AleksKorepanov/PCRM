# PCRM

Production-ready multi-tenant CRM starter built with Next.js, TypeScript, and Postgres.

## Prerequisites

- Node.js 18+
- Docker Desktop (or Docker Engine)

## Local setup

1. Copy environment variables:

   ```bash
   cp .env.example .env
   ```

2. Start Postgres:

   ```bash
   docker compose up -d
   ```

3. Install dependencies:

   ```bash
   npm install
   ```

4. Run the app:

   ```bash
   npm run dev
   ```

Visit `http://localhost:3000` in your browser.

## Tooling

- **Lint:** `npm run lint`
- **Format:** `npm run format`
- **Typecheck:** `npm run typecheck`
- **Test:** `npm test`

## Project structure

```
src/
  app/           Next.js App Router routes
  components/    UI primitives
  lib/           Shared utilities
  styles/        Global styles
```
