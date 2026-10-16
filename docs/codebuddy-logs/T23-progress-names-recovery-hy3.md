# CodeBuddy CLI session: T23-progress-names-recovery-hy3

- Started: 2026-10-16 17:31:03
- Model: hy3
- Command: codebuddy -p -y --model hy3 --max-turns 180 --output-format json

## Prompt

Read .codebuddy/rules/project.md. Improvements found during a real phone test of the senior screen. Keep all existing behaviour and tests working.

1) Progress like a to-do list on /today (both roles): under the date show a large progress bar "1 of 3 done today" (filled bar, success colour, aria-valuenow). When every scheduled dose for today is taken, show a calm success banner "All done for today ✓" (i18n, four languages) above the list.

2) Who marked a dose: store the marking device on each dose log (add column dose_logs.taken_by_device uuid null REFERENCES devices(id) ON DELETE SET NULL via an idempotent ALTER TABLE ... ADD COLUMN IF NOT EXISTS in db/schema.sql; run npm run db:migrate). POST /api/v1/doses records the caller's device id; GET /api/v1/state returns taken_by_label (the device label). Show "Taken at 17:08 · by <label>" on the dose card (the current device shows "by you").

3) Names for family members: when joining (/join page and the 6-digit code flow) ask "Your name" (optional, max 40 chars, e.g. "Mei (daughter)", "Siti (helper)"); for a senior code pre-fill the household display name's phone label. Send it with POST /api/v1/join and store it as the device label. Keep the existing rename on /family.

4) Recovery code for caregivers: when a household is created, generate a long random recovery code (e.g. 4 groups of 5 letters/digits), store only its SHA-256 hash, and show it ONCE with "Save this code. If this phone loses its data, use it to get back in." plus Copy button. Entering it in "I have a code from my family" joins as caregiver (single use; the caregiver can generate a new one from /family which invalidates the old one). Rate-limit like the join endpoint.

5) Text fixes: special instructions and "seek help" items are joined with ".;" (e.g. "Swallow the tablet whole.; Do not crush or chew."). Render arrays as separate lines/bullets instead of joining with "; ". In the explanation panel the licence line shows "Open Government Licence v3.0" twice; show it once as a link: "Contains public sector information licensed under the Open Government Licence v3.0."

Add API tests for 2) and 4) to scripts/test-api.ts. Run npm test, npm run typecheck, npm run build; start the dev server on port 3001, run BASE_URL=http://localhost:3001 npm run test:api, then stop the server. Commit in small Conventional Commits (English). Do not touch .env.local.


## Result


## Stats

- Duration: 1.2 min
- Turns: 
- Is error: 
- Session id: 
- Cost/usage:   total_cost_usd=
