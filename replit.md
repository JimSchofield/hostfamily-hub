# HostFamily Hub

A volunteer engagement app for host families supporting international college students.

## Features

- **Auth**: Session-based login/registration. New registrations are `pending` until a coordinator approves them.
- **Roles**: `volunteer` (default) or `coordinator`. Coordinators access the private dashboard.
- **Public Feed**: Approved volunteers can view stories and pictures shared by other families.
- **Submissions**: Volunteers can submit:
  - Stories (public)
  - Pictures (public) — via image URL or file upload (converted to base64 data URL)
  - Questions (private, to coordinator)
  - Prayer Requests (private)
  - Contact Help (private)
- **Coordinator Dashboard**: Restricted to coordinators. Has two tabs:
  - Private Requests: view all private submissions and reply to them inline
  - User Management: approve/reject pending registrations, promote users to coordinator
- **Replies**: Coordinators can reply to private posts directly in the dashboard

## Tech Stack

- **Frontend**: React + Wouter + TanStack Query + Framer Motion + shadcn/ui
- **Backend**: Express + PostgreSQL (Drizzle ORM) + express-session (connect-pg-simple)
- **Auth**: Session-based with scrypt password hashing (Node.js built-in crypto)
- **File Upload**: Multer (memory storage) → base64 data URLs stored in DB

## Key Files

- `shared/schema.ts` — Drizzle tables: users, posts, replies
- `shared/routes.ts` — API contract with Zod schemas
- `server/auth.ts` — Password hashing and auth middleware
- `server/storage.ts` — Database storage layer
- `server/routes.ts` — All API endpoints

## Default Coordinator Account

- Email: `coordinator@hostfamilyhub.com`
- Password: `coordinator123`

(Created in DB seed. Change the password in production!)

## Environment Variables

- `DATABASE_URL` — PostgreSQL connection string (auto-provisioned by Replit)
- `SESSION_SECRET` — Session secret key
