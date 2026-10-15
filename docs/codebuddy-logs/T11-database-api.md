# CodeBuddy CLI session: T11-database-api

- Started: 2026-10-15 11:55:59
- Model: balanced-model
- Command: codebuddy -p -y --model balanced-model --max-turns 150 --output-format json

## Prompt

Read SPEC.md, README.md and .codebuddy/rules/project.md. This session adds a server database and family sharing. It is session 1 of 2: build the database layer and the server API only. Do NOT change the pages yet (session 2 will connect the UI).

Context: today all data lives in the browser's localStorage, so a family member on another phone cannot see anything. We now use Neon Postgres. DATABASE_URL is already set in .env.local and in Vercel (never print it, never commit it).

Requirements:
1. Driver: add "@neondatabase/serverless" (HTTP driver, works on Vercel). No ORM. Put the client in lib/db.ts (server-only; import "server-only" or guard so it never ends up in client bundles).

2. Schema in db/schema.sql (idempotent: CREATE TABLE IF NOT EXISTS) and a migration script scripts/db-migrate.ts run by "npm run db:migrate" (node scripts/db-migrate.ts; read DATABASE_URL from process.env, load .env.local with a tiny parser if not set; no new dependency for that). Tables (all with household_id foreign keys and ON DELETE CASCADE):
   - households (id uuid pk default gen_random_uuid(), display_name text, language text, bp_target_systolic int null, bp_target_diastolic int null, is_demo boolean default false, created_at timestamptz default now())
   - devices (id uuid pk, household_id, role text check in ('caregiver','senior'), token_hash text unique not null, label text, created_at, last_seen_at)
   - pairing_codes (code_hash text pk, household_id, role text, expires_at timestamptz, used_at timestamptz null, created_by_device uuid)
   - medicines (id uuid pk, household_id, drug_name, strength, dose_per_time, times_per_day int, time_slots text[], food text, special_instructions text[], quantity_dispensed int, dispensed_date date null, added_on date, thumbnail text, unclear_fields text[], updated_at timestamptz, deleted_at timestamptz null)
   - dose_logs (id uuid pk, household_id, medicine_id, date date, slot text, taken_at timestamptz, UNIQUE(medicine_id, date, slot))
   - missed_reasons (id uuid pk, household_id, medicine_id, reason text, missed_count int, recorded_on date)
   - bp_readings (id uuid pk, household_id, date date, time text, systolic int, diastolic int, pulse int null, created_at)
   - questions (id uuid pk, household_id, kind text check in ('redirected','custom'), medicine_id uuid null, drug_name text null, text text, asked_on date, done boolean default false)
   Add indexes on household_id (and household_id, date where useful). Store only a nickname in display_name; never store the full label photo, only the small thumbnail.

3. Auth without passwords (lib/auth.ts):
   - Device token = 32 random bytes, base64url. Store only SHA-256(token) in devices.token_hash. Clients send "Authorization: Bearer <token>".
   - requireDevice(request) returns { deviceId, householdId, role } or a 401 JSON response. Update last_seen_at at most once per hour.
   - Pairing: a caregiver creates a code for role 'senior' or 'caregiver'. Return two forms: a 6-digit numeric code and a join URL with a long random code (/join?c=<long>). Store only hashes. Expire after 24 h, single use. Rate-limit join attempts per IP in memory (e.g. 10 per 10 minutes) and always use constant-time comparison.

4. API routes (app/api/v1/...), all JSON, all scoped to the caller's household, all inputs validated with zod, never return other households' data, never return stack traces:
   - POST /api/v1/households  { displayName, language } -> creates household + caregiver device, returns { token, household }
   - POST /api/v1/pairing-codes  (caregiver only) { role } -> { shortCode, joinUrl, expiresAt }
   - POST /api/v1/join  { code } (short or long) -> { token, role, household }
   - GET  /api/v1/state -> everything the UI needs in one call: household, medicines (not deleted), dose logs of the last 30 days, missed reasons of the last 30 days, bp readings of the last 30 days, questions, devices (id, role, label, last_seen_at)
   - Medicines: POST /api/v1/medicines, PUT /api/v1/medicines/[id], DELETE /api/v1/medicines/[id] (soft delete) — caregiver only
   - POST /api/v1/doses { medicineId, date, slot } (idempotent upsert), DELETE /api/v1/doses { medicineId, date, slot } — caregiver and senior
   - POST /api/v1/missed-reasons — caregiver and senior
   - POST /api/v1/bp-readings, DELETE /api/v1/bp-readings/[id], PUT /api/v1/bp-target — caregiver; seniors may add readings
   - POST /api/v1/questions, PUT /api/v1/questions/[id] (mark done), DELETE /api/v1/questions/[id]
   - PUT /api/v1/household { displayName?, language? } — caregiver only
   - DELETE /api/v1/devices/[id] — caregiver only (unlink a phone)
   - POST /api/v1/demo -> creates a NEW household with is_demo=true seeded from lib/demo-data.ts (reuse generateDemoData) and returns a caregiver token. Demo households older than 7 days may be deleted by the same call (cheap cleanup).

5. Tests without new test frameworks: scripts/test-api.ts that runs against a running server (BASE_URL env, default http://localhost:3000) and checks: create household -> create pairing code -> join as senior with the 6-digit code -> senior can POST a dose -> senior gets 403 on POST /api/v1/medicines -> caregiver adds a medicine -> GET /api/v1/state from both devices shows the same data -> a second household cannot read the first household's data (401/404) -> an expired or reused code fails. Add "test:api" script. Keep "npm test" for the pure-function tests only.

6. Run npm run db:migrate against DATABASE_URL (it is safe: tables are new). Then start the dev server on a free port, run the API test script against it, fix failures, stop the server.

7. Update README (Architecture + Configuration: DATABASE_URL; data model table list; privacy notes: nickname only, thumbnails only, hashed tokens, 24 h single-use pairing codes) and SPEC.md (new section "Family sharing and storage").

Do not touch .env.local. Run npm test, npm run typecheck and npm run build, then git commit with Conventional Commits messages in English. End with a short summary including the test results.


## Result
                                                                                                                                                                                                                                                                                                                                                                                                                                                       Session 1 complete. Here's what changed and the test results:

## Summary

**Database layer**
- Added `@neondatabase/serverless` + `server-only` dependencies
- Created `lib/db.ts` ΓÇö Neon client with server-only guard
- Created `db/schema.sql` ΓÇö idempotent schema with 8 tables, indexes, and `ON DELETE CASCADE`
- Created `scripts/db-migrate.ts` ΓÇö reads `DATABASE_URL` from env or `.env.local`, runs schema
- Ran `npm run db:migrate` successfully

**Auth (`lib/auth.ts`)**
- Device tokens: 32 random bytes base64url, SHA-256 hashes stored
- `requireDevice(req)` ΓÇö Bearer token auth, updates `last_seen_at` at most once per hour
- Pairing: 6-digit numeric + long URL code, both hashed, 24h expiry, single use
- In-memory IP rate limiting (10 per 10 min) for join attempts

**API v1 routes (`app/api/v1/...`)**
- `POST /households` ΓÇö creates household + caregiver device
- `POST /pairing-codes` / `POST /join` ΓÇö family sharing flow
- `GET /state` ΓÇö full household snapshot (last 30 days for logs)
- CRUD for medicines (soft delete), doses (upsert), missed reasons, BP readings, questions
- Role-based guards: caregiver-only routes return 403 for seniors
- `POST /demo` ΓÇö creates fresh demo household with seeded data + cleans up old demos

**Tests**
- Created `scripts/test-api.ts` with 30 assertions
- Added `test:api` script to `package.json`
- **All 30 API tests passed** against a running server
- Existing `npm test` (adherence + question router) still passes

**Docs**
- Updated README: new architecture diagram, Configuration (`DATABASE_URL`), data model table list, privacy notes, testing instructions
- Updated SPEC: new section 7 "Family sharing and storage" with household model, auth design, API route table, demo data details

**Commits**
- `9751e29` feat: add Neon database, auth, and API v1 routes for family sharing
- `5eb8d98` docs: update README and SPEC with database architecture and privacy notes

No pages were modified ΓÇö session 2 will connect the UI to these APIs.

## Stats

- Duration: 43.9 min
- Turns:                                                                                                                                                                                                                                                                                                                                                                                                                                                        375
- Is error:                                                                                                                                                                                                                                                                                                                                                                                                                                                        False
- Session id:                                                                                                                                                                                                                                                                                                                                                                                                                                                        01a13dea-e9c5-7663-a6d7-4c5a2e545b18
- Cost/usage: {"input_tokens":7496739,"output_tokens":45407,"cache_creation_input_tokens":278694,"cache_read_input_tokens":7118592,"cache_creation":null,"server_tool_use":null,"service_tier":null}  total_cost_usd=                                                                                                                                                                                                                                                                                                                                                                                                                                                       0
