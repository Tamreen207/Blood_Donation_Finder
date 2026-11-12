# LifeLink — Blood Donation & Blood Bank Finder

A full-stack web application (React + Vite frontend, Node.js/Express + MongoDB backend) for finding blood donors/blood banks, creating and tracking blood requests, and managing donor/blood-bank/admin workflows.

## Prerequisites
- Node.js 18+ (Node 20+ recommended)
- npm
- MongoDB running locally or a MongoDB URI (for full API + database features)

## Quick start (single command)
From the project root:

```bash
npm install --prefix backend && npm install --prefix frontend
npm start
```

`npm start` builds the frontend and starts the backend server, which serves the built frontend and API from the same origin.

- App/API: http://localhost:5000 (default `PORT=5000`)
- Health check: http://localhost:5000/api/health

> Ensure MongoDB is available at `MONGO_URI` in `backend/.env` before starting with database features.

## Development mode
Run backend and frontend dev servers together:

```bash
npm install --prefix backend && npm install --prefix frontend
npm run dev
```

- Frontend (Vite): http://localhost:5173
- Backend (API): http://localhost:5000
- Vite proxies `/api` to the backend in dev.

## Configuration

### Backend (`backend/.env`)
Copy from `backend/.env.example` and set real values:

- `PORT` — API port (default 5000)
- `MONGO_URI` — MongoDB connection string
- `JWT_SECRET` — **strong random secret** (required for real deployments; do not use dev defaults)
- `JWT_EXPIRES_IN` — token expiry (e.g. `7d`)
- `CLIENT_ORIGIN` — allowed CORS origin(s), comma-separated (dev: `http://localhost:5173`)

### Frontend (`frontend/.env`)
- `VITE_API_BASE_URL` — backend base URL for dev (e.g. `http://localhost:5000`). Leave empty for same-origin when served by backend.

## Seed sample data (optional)
```bash
npm run seed
```
(Review `backend/seed.js` and ensure DB connection is configured.)

## Testing

Comprehensive automated tests (Node.js built-in test runner) — **no database required** for the included unit/integration/whitebox/blackbox/system suites:

```bash
npm test            # run all suites (unit, integration, system, whitebox, blackbox)
npm run test:unit
npm run test:integration
npm run test:system
npm run test:whitebox
npm run test:blackbox
```

Suites cover:
- **Unit tests:** blood compatibility, distance, validators, JWT utils, matching/ranking, inventory status, error middleware, frontend routing/compatibility/utils.
- **Integration tests:** API health, auth validation/401 behavior, protected-route authorization, frontend route/API-contract config checks.
- **System tests:** project structure and required modules/pages/scripts.
- **White-box tests:** control-flow/branch behavior of matching and compatibility logic.
- **Black-box tests:** API contract, auth/validation errors, JSON 404s, and safe error responses.

> Full database-backed end-to-end flows (real login against DB, request persistence, inventory mutations) require a running MongoDB and seeded/configured accounts.

## Build
```bash
npm run build
```
Outputs frontend production build to `frontend/dist` (chunk-split vendors/icons).

## Key workflows (when backend+DB configured)
- Register/Login (seeker, donor, blood bank) with role-based dashboards
- Search/find blood banks and donors by blood group/location
- Create and track blood requests (emergency supported); matching/notifications via backend services
- Blood bank inventory and request handling; admin dashboard endpoints/UI (where implemented)

## Safety & compliance notes
- Do **not** display unverified/expired/fabricated stock as real availability.
- Donor medical eligibility and blood issue/compatibility confirmation (including laboratory crossmatching) must be performed by authorized blood centres and qualified professionals — the app must not auto-certify eligibility or authorize issue.
- Protect secrets/PII: use strong `JWT_SECRET`, HTTPS in production, and follow applicable data-protection/regulatory requirements before real-world deployment.

## Project structure
- `backend/` — Express API, Mongoose models, controllers, routes, services, middleware, utils
- `frontend/` — React (Vite) app, pages, components, services, utils
- `tests/` — system, white-box, black-box test suites
- `docs/` — documentation (extend as needed)
