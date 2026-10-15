# Development Log — Talking Pill Bag

## Overview

Talking Pill Bag was built in 4 days for the Tencent Cloud AI CAN DO IT Singapore 2026 hackathon (Healthcare Track, Challenge 2: *AI Healthier Every Day*).

All application code was written by **CodeBuddy**. Between sessions, a separate AI assistant (**Claude Code**) acted as reviewer: it wrote the task prompts from `SPEC.md`, ran the app, tested the APIs with the demo labels and the browser, and fed the bugs it found back into the next CodeBuddy prompt.

## Tools and workflow

- **T1–T2** — Built in the CodeBuddy IDE (chat screenshots kept by the team).
- **T3–T8 and fixes** — Built with the **CodeBuddy Code CLI** in headless mode:
  ```bash
  codebuddy -p -y --model balanced-model
  ```
  One session per task. Each session's prompt and result were saved in `docs/codebuddy-logs/`.
- **Review** — Claude Code reviewed each session's output, ran the dev server, tested APIs with demo labels, and tested in the browser. Bugs were documented and fed into the next CodeBuddy prompt.

## Task log

| Task | What was built | Bugs found in review | Fixed in which session |
|---|---|---|---|
| T1 | Next.js project skeleton (App Router, TypeScript, Tailwind), `.env.example`, language picker page | — | — |
| T2 | `/api/read-label`, Add Medicine page with photo upload, confirmation screen, unclear-field highlighting | Unreadable labels returned a technical error; DD/MM dates read as MM/DD; empty time slots not flagged; full-size photos stored in localStorage | T2 fix session |
| T3 | `localStorage` persistence, Today schedule with Morning/Afternoon/Evening/Bedtime slots | "Edit time" ignored the edit parameter; brief "No medicines yet" flash | T4 session |
| T4 | `/api/explain`, Listen button with Web Speech API | Speech voices read before the browser loaded them; markdown in translations | T5 session |
| T5 | Adherence prompts, missed-dose reasons, demo-mode clock (`/today?demo=1`) | Hydration mismatch from computing dates during server render; acknowledgement after choosing a reason never shown; test duplicated logic instead of importing it | T6 session |
| T6 | `/api/read-bp`, BP confirmation screen, 14-day SVG trend graph | Chart labels overlapping at 375px | T7 session |
| T7 | Refill reminders, questions-for-doctor page, weekly summary | Navigation buttons above the dose list | T8 session |
| T8 | Ask-a-question column, deterministic question router (`lib/question-router.ts`) with trap tests | Missed-dose quote not shown for questions in a language different from the UI; `npm test` skipping the adherence test | This session (T9 fixes) |
| T9 | Database schema (`db/schema.sql`), `/api/v1` server API (households, medicines, doses, BP, questions), `scripts/test-api.ts` | Race condition in join; short code expiry too long; test households not flagged demo | T10 session |
| T10 | Family sharing UI: client data layer (`lib/store.tsx`), onboarding, caregiver/senior roles, QR codes, PWA manifest, sharing updates | — | — |

## Session artifacts

Prompts and outputs for T3–T8 are preserved in:

- `docs/codebuddy-logs/T3-today-schedule.md`
- `docs/codebuddy-logs/T4-spoken-explanations.md`
- `docs/codebuddy-logs/T5-adherence-demo-clock.md`
- `docs/codebuddy-logs/T6-blood-pressure.md`
- `docs/codebuddy-logs/T7-refill-questions-summary.md`
- `docs/codebuddy-logs/T8-safe-questions.md`
- `docs/codebuddy-logs/T9-fixes-and-docs.md` (this session)
