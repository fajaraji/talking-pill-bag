# Project rules — Talking Pill Bag (AI must follow)

## Language
- Prompts from the team may be in Indonesian or English. Always understand both.
- Everything that ends up in the repository MUST be in **English**: file and folder names, variable/function
  names, code comments, README, commit messages, PR titles/descriptions, and the GitHub repo description.
- Commit messages follow Conventional Commits, in English, imperative mood, e.g.
  `feat: add label photo reader API`, `fix: reject low-confidence label reads`, `docs: add architecture diagram`.
- The app UI is multilingual (English, 中文, Bahasa Melayu, Bahasa Indonesia). UI strings live in `lib/i18n.ts`;
  English is the default and the source language.
- Your end-of-task summary to the team may be in Indonesian.

## Scope and stack
- The full spec is `SPEC.md`; the task list is `TASKS.md`. Do ONLY the task requested.
- Stack: Next.js App Router + TypeScript + Tailwind. Do not add other frameworks without a clear reason.

## Safety (from the hackathon handbook — never violate)
- The app NEVER gives medical advice: it does not suggest changing, adding, reducing or stopping a medicine,
  and it does not diagnose. Such questions are redirected to a doctor/pharmacist.
- Medicine explanations come only from the confirmed label and `data/drug-info.json`. Unknown medicine →
  "I'm not able to identify that medication, please check with your pharmacist." (plus its translation).
- Every LLM output used by the app is validated with zod. Invalid output → treat as unreadable.

## Security
- Never write API keys into code or commits. Use `.env.local` (git-ignored); document variables in `.env.example`.

## UI
- Mobile-first (375px), large text, high contrast, tap targets at least 48px.

## After each task
- Write a short summary of what changed and how to test it.
