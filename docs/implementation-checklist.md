# Implementation Checklist - Next Phase (Footer Sections + Auth + Database)

## Objective

Expand the product from the current "Meu Canvas" implementation to a complete app with all footer sections:

- Dashboard
- Meu Canvas
- Novo Canvas
- Minha Conta

This phase includes backend adoption, authentication, and database persistence.

Monorepo baseline adopted:

- `apps/web` for frontend
- `apps/api` for backend
- `packages/*` for shared modules

## Execution Plan

### 1. Initial Technical Decisions

1. Choose backend strategy:
   - Supabase (recommended for speed)
   - Custom backend (Node/Nest + Postgres + JWT)
2. Define authentication approach.
3. Confirm multi-canvas model per user.
4. Update product scope in `docs/PRD.md`.

### 2. App Architecture

1. Add routing (`react-router-dom`) with:
   - `/dashboard`
   - `/canvas/:id`
   - `/canvas/new`
   - `/account`
   - `/auth/*`
2. Make footer navigation functional.
3. Create app layout and route guards.
4. Organize code by feature/service boundaries.

### 3. Data + Authentication Foundation

1. Create base schema:
   - `profiles`
   - `canvases`
   - `canvas_versions` (optional)
   - `block_scores`
   - `evidences`
2. Implement auth flows:
   - signup
   - login
   - logout
   - password reset
3. Implement access control (user sees only own data).
4. Build data access layer (read/write services).

### 4. Footer Sections Delivery

1. Dashboard:
   - list canvases
   - quick status and score summary
   - recent activity
2. Meu Canvas:
   - connect current page to database CRUD
3. Novo Canvas:
   - create blank canvas
   - optional duplicate from existing
4. Minha Conta:
   - profile data
   - preferences (theme)
   - security basics

### 5. Reliability and Security

1. Keep quality gates active:
   - lint
   - unit/integration tests
   - build
   - e2e
2. Add e2e coverage for all footer sections.
3. Validate auth and access protections.
4. Add error handling and empty/loading states.

### 6. Production Readiness

1. Configure environments (dev/staging/prod).
2. Secure secrets and env vars.
3. Define backup/recovery for database.
4. Add monitoring/logging baseline.
5. Run release checklist before deployment.

---

## Action Checklist (Sequential)

### Phase 0 - Decisions

- [x] Choose backend (Supabase or custom backend)
- [x] Choose auth implementation details
- [ ] Confirm user-to-canvas ownership model
- [ ] Update `docs/PRD.md` with expanded scope

### Phase 1 - Routing and Navigation

- [x] Install and configure `react-router-dom`
- [x] Implement route structure for all footer sections
- [x] Connect footer buttons to real routes
- [x] Add protected route logic for authenticated areas

### Phase 2 - Backend + Auth

- [ ] Provision database project/environment
- [x] Create schema and migrations
- [x] Implement signup/login/logout/reset flows
- [x] Implement authorization policies
- [x] Add typed API/data service layer

### Phase 3 - Feature Implementation

- [ ] Migrate "Meu Canvas" persistence from local-only to remote
- [ ] Implement "Novo Canvas" page and creation flow
- [ ] Implement "Dashboard" page with canvas overview
- [ ] Implement "Minha Conta" page

### Phase 4 - Data Migration and UX Robustness

- [x] Add localStorage -> database migration strategy
- [ ] Implement loading, empty, and error states
- [ ] Validate responsive behavior for new pages
- [ ] Ensure accessibility basics in new views

### Phase 5 - Quality and Release

- [ ] Add/expand tests for new flows
- [ ] Ensure CI pipeline passes fully
- [ ] Validate security rules in practice
- [ ] Run final release checklist

## Done Criteria for This Plan

- All 4 footer sections are functional and connected
- Auth works end-to-end
- Data is persisted in database with proper access controls
- Quality gates pass (`lint`, `test`, `build`, `e2e`)
