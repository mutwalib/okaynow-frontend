# OkayNow Frontend

Next.js App Router UI for the Massachusetts home care staffing marketplace.
Each user role gets a **separate workspace** with its own navigation and routes.

## Roles & routes

| Role | Home | Key screens |
|---|---|---|
| **Caregiver** | `/caregiver` | Open shift board, shift detail, my shifts, profile |
| **Client / Family** | `/client` | Post shifts, manage posts, care profile |
| **Facility** | `/facility` | Facility board, post coverage |

Platform owners use the independent sibling app in `../admin-frontend` on port 3001.

Public:

- `/` — marketing landing
- `/login`, `/register` — auth (role chosen at registration)
- `/dashboard` — redirects to the signed-in role home

Route groups are enforced by `proxy.ts` (cookie role) plus client `RoleGuard`.

## Stack

- Next.js 16 (App Router) + React 19 + TypeScript
- Tailwind CSS 4
- TanStack Query, React Hook Form, Zod
- JWT access/refresh against the Spring Boot API (`NEXT_PUBLIC_API_URL`)

## Setup

```bash
cd frontend
npm install
cp .env.local.example .env.local   # optional
npm run dev
```

App: [http://localhost:3000](http://localhost:3000)

Backend (default): `http://localhost:8080`

## Environment

| Variable | Default |
|---|---|
| `NEXT_PUBLIC_API_URL` | `http://localhost:8080` |
| `NEXT_PUBLIC_ADMIN_APP_URL` | `http://localhost:3001` |

## Auth notes

Phase 1 stores the JWT access/refresh tokens in `localStorage` and a role/user
cookie for middleware redirects. Prefer httpOnly cookies before production.
