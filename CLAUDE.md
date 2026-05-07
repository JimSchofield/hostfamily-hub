# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

Use `pnpm` for everything (per global preference).

- `pnpm dev` — start `netlify dev` on port 8888 (Vite on 5173 internally + the API function emulator).
- `pnpm dev:vite` — Vite alone, no functions. Used by `netlify dev` under the hood; rarely run directly.
- `pnpm build` — `vite build` → `dist/public/`. The API function is bundled separately by Netlify on deploy (esbuild, configured in `netlify.toml`).
- `pnpm check` — typecheck only (`tsc --noEmit`). Note: there are 4 pre-existing client errors (`submit-post-dialog.tsx`, `use-posts.ts`, `dashboard.tsx`) that pre-date the Netlify migration. The migration code is clean.
- `pnpm db:push` — apply `shared/schema.ts` to Neon via `drizzle-kit push`. No migration files; schema is the source of truth.
- `pnpm seed` — one-shot DB seed (default coordinator + sample posts). Idempotent — skips entries that already exist.

There is no test runner, linter, or formatter configured.

## Required env vars

Loaded from `.env` (gitignored). On deployed Netlify, the DB URL is auto-injected by the Netlify DB extension.

- `NETLIFY_DATABASE_URL` (or `DATABASE_URL`) — Neon Postgres connection string. Required at boot.
- `RESEND_API_KEY` — optional. If unset, email notifications are silently skipped.

There is no `SESSION_SECRET` — sessions are random IDs stored in a DB table, not signed cookies, so no secret is needed.

## Architecture

This is a Vite SPA + a single Hono-based Netlify Function. The function lives at `netlify/functions/api.ts` and handles all `/api/*` requests via a redirect in `netlify.toml`.

### Three top-level dirs

- `client/` — Vite React SPA. Vite's `root` is `client/`, build output goes to `dist/public`.
- `server/` — shared server-side modules imported by the function. **No HTTP framework here** — no Express, no app bootstrap. Just modules.
- `shared/` — code imported by both client and function:
  - `shared/schema.ts` — Drizzle table definitions + Zod insert schemas + inferred TS types. Single source of truth for the DB.
  - `shared/routes.ts` — the `api` object: every endpoint's method, path, Zod input schema, and per-status response schemas.

### Path aliases (set in `tsconfig.json` and `vite.config.ts`)

- `@/*` → `client/src/*`
- `@shared/*` → `shared/*`

The function (`netlify/functions/api.ts`) uses **relative imports** (`../../server/storage` etc.) because Netlify's esbuild bundler doesn't read the TS path map.

### Database — Neon HTTP

`server/db.ts` uses `@neondatabase/serverless` (HTTP-based) via `drizzle-orm/neon-http`. **Do not** switch to the TCP `pg` Pool — connection pooling doesn't work in serverless functions where each invocation is a fresh container.

Drizzle is pinned to a `drizzle-zod` version that emits Zod v3 schemas (`drizzle-zod@0.7.x`). Newer `drizzle-zod` versions emit Zod v4, which is API-incompatible with the rest of the project. Don't upgrade `drizzle-zod` without also migrating to Zod v4 across client and server.

### Sessions — DB-backed random IDs

`server/session.ts` owns the session lifecycle:
- **Login:** `createSession(c, userId)` generates a 32-byte random ID, inserts a row in `sessions` with 7-day expiry, and sets a `HttpOnly; SameSite=Lax` cookie.
- **Each request:** `getSessionUser(c)` reads the cookie, joins `sessions` to `users`, returns the user (or `null` if expired/missing). Role/status are read fresh on every request — coordinator promotions and rejections take effect immediately.
- **Logout:** deletes the row + clears the cookie.
- **Revocation:** `destroyAllUserSessions(userId)` is called when a coordinator changes a user's status away from `approved` (see `PATCH /api/admin/users/:id`).

Three guard helpers: `requireUser`, `requireApproved`, `requireCoordinator`. They throw `HttpError` which the Hono `onError` handler converts to a JSON response.

### Image uploads — Netlify Blobs

`server/blobs.ts` wraps Netlify Blobs:
- `uploadImage(buffer, contentType)` writes to the `post-images` store and returns `/api/images/<key>`.
- `getImage(key)` is served by the `GET /api/images/:key` route in the Hono handler.

The 6 MB limit on Function request bodies dictates the upload limit. **Do not** revert to base64-in-DB (the original Replit pattern) — that path is gone.

### Adding an endpoint

1. Add the contract to `shared/routes.ts` (path, method, input/response Zod schemas).
2. Add the route to `netlify/functions/api.ts`. Use `requireApproved`/`requireCoordinator` for guards. Validate input with `api.x.y.input.safeParse(body)`.
3. If it touches the DB, add a method to `IStorage` in `server/storage.ts` rather than putting query code in the route handler.

### Behavioral note

`GET /api/posts/:id/replies` is coordinator-only — volunteers can't see replies to their own private posts in-app (they only get the email). This is preserved as-is from the original codebase. See `~/Desktop/ODDITY.md` for background and the suggested fix.
