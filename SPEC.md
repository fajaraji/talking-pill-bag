# SPEC — Talking Pill Bag

Project name: **Talking Pill Bag** (repo: `talking-pill-bag`). Indonesian name for internal discussion: "Kantong Obat yang Bisa Ngomong".
Everything that enters the repo (file names, code, comments, commits, README, GitHub description) must be in English — see `.codebuddy/rules/project.md`.

Hackathon: Tencent Cloud AI CAN DO IT Singapore 2026 — Healthcare Track, **Challenge 2: AI Healthier Every Day**.
Submission deadline: 16 October 2026.

## 1. Summary

A web application (mobile-first) for people who manage medicines for elderly users: children, grandchildren, or helpers.
The preparer photographs a medicine label once → AI reads the label → a picture schedule, spoken explanation,
reminders with a "Done" button, blood-pressure notes from a photo of a BP monitor, refill reminders,
and a list of questions for the doctor or pharmacist.

Demo focus population: **elderly with hypertension** who take several chronic medicines.

## 2. Users and roles

| Role | Who | Screens used |
|---|---|---|
| Preparer | Child / grandchild / helper | Add Medicine (photo), check reading result, set language |
| Recipient | Grandmother / grandfather | "Today" screen: large letters, large "Done" button, listen button |
| Monitor | Child living separately | Weekly summary |

## 3. Mandatory boundaries (from the handbook — MUST NOT be violated)

1. **Strictly bounded:** the app NEVER suggests changing, adding, reducing, or stopping a medicine, and does not diagnose. Questions of this kind are answered with "This question needs to be answered by a doctor or pharmacist" and are automatically added to the questions list.
2. **Honest about uncertainty:** if the label is unreadable or the medicine is not in the knowledge base, answer exactly: "I'm not able to identify that medication, please check with your pharmacist." (plus its translation in the selected language). Do not guess.
3. **Medicine explanations come from only two sources:** the confirmed label text, and the file `data/drug-info.json` (summaries from HealthHub Medications A-Z). The LLM may simplify and translate that text, but must not add medical facts.
4. **Human-in-the-loop:** AI reading results are always displayed next to the original photo and must be pressed "Correct" (or corrected) before entering the schedule.
5. No real patient data. The demo uses fictional labels in the `labels/` folder.

## 4. Features (mapped to the 6 Challenge 2 features)

| # | Feature | Handbook feature |
|---|---|---|
| F1 | Photo label → AI extracts JSON → confirmation screen side-by-side with photo | Medication management |
| F2 | "Today" picture schedule: Morning / Afternoon / Evening / Bedtime, before/after food icons, medicine photo, large letters | Medication management |
| F3 | Listen button: brief medicine explanation, in the chosen language, voice via Web Speech API | Medication understanding |
| F4 | Reminder + "Done" button. If medicine is missed ≥2 times in 7 days, ask reason (Forgot / Side effects / Felt well / Ran out / Other) | Adherence support |
| F5 | Photo of BP monitor screen → AI reads systolic/diastolic/pulse → confirmation → 14-day trend graph + simple sentence, without diagnosis | Health tracking |
| F6 | Calculate remaining medicine from label quantity and schedule; refill reminder 7 days before running out | Preventive health |
| F7 | List of questions for the doctor: frequently missed medicines + reasons, BP trends, questions refused by AI | Healthcare preparation |
| F8 | Weekly summary for the monitor | Longitudinal |

## 5. Languages

UI and explanations: English, 中文 (Mandarin), Bahasa Melayu, Bahasa Indonesia.
Static UI text is stored in `lib/i18n.ts`. Medicine explanation translations may go through the LLM,
but the source remains `data/drug-info.json`.

## 6. Architecture (simple, for 4 days)

- **Next.js (App Router) + TypeScript + Tailwind CSS**, single repo.
- **API route** `app/api/read-label/route.ts` and `app/api/read-bp/route.ts`: receive photo (base64),
  call vision LLM, return JSON validated with **zod**.
- **API route** `app/api/explain/route.ts`: receive medicine name + language, fetch entry from
  `data/drug-info.json`, ask LLM to simplify/translate **only that text**.
  Medicine not in JSON → return "ask pharmacist" sentence, without calling the LLM.
- **LLM provider** via **OpenAI-compatible** endpoint, configured in `.env.local`:
  `LLM_BASE_URL`, `LLM_API_KEY`, `LLM_VISION_MODEL`, `LLM_TEXT_MODEL`.
  (Can be Tencent Hunyuan, Gemini, OpenAI, etc. API key NEVER enters code or Git.)
- **Model test results (14 Oct 2026, Nous Research endpoint):**
  - `google/gemini-2.5-flash` (vision): read labels 1–4 and 6 correctly, refused blurred label 5, about 5 seconds
    and about US$0.002 per photo. Send `response_format: {"type":"json_object"}`. The `food` field from the model is still free
    (e.g. "BEFORE BEDTIME"), so the prompt must force the enum in SPEC section 7 and zod must reject other values.
  - `tencent/hy3` (text) is a **reasoning model**. Without settings, it "thinks" first for about 600 tokens. If
    `max_tokens` is small, `content` returns `null`. Always send `reasoning: {"enabled": false}` (direct answer,
    about 40 tokens) and `max_tokens` at least 1000. Response time 8–13 seconds, so **store explanation results per
    medicine + language in localStorage** (create once when medicine is confirmed, not when the listen button is pressed).
    If `content` is empty or errors → use English text from `data/drug-info.json`.
- **Storage:** `localStorage` in the browser (sufficient for demo; mention as a limitation in diagrams).
- **Voice:** `window.speechSynthesis` (free, no API).
- **Demo time:** hidden button "Demo mode: advance time +1 day" so reminders,
  trends, and refills can be demonstrated in a 5–8 minute video.
- Deploy: Vercel (or Tencent EdgeOne Pages) for demo link (bonus points).

## 7. Label reading data schema (required output from `/api/read-label`)

```json
{
  "readable": true,
  "confidence": 0.0,
  "drug_name": "Amlodipine",
  "strength": "5 mg",
  "dose_per_time": "1 tablet",
  "times_per_day": 1,
  "time_slots": ["morning"],
  "food": "after_food | before_food | with_food | any",
  "special_instructions": ["..."],
  "quantity_dispensed": 30,
  "dispensed_date": "2026-10-01",
  "unclear_fields": ["..."]
}
```

Rule: if `readable=false` or `confidence < 0.7` or `drug_name` empty →
show "ask pharmacist" message, do not create schedule. Unreadable fields go into `unclear_fields`
and are marked red on the confirmation screen.

## 8. Definition of done (for demo)

- All 6 labels in `labels/` are tested: 4 read correctly, 1 blurred rejected, 1 unknown medicine → "ask pharmacist".
- The entire flow can be run on a phone (375px width) without assistance.
- Not a single sentence of medical advice in output (test with trap questions in TASKS.md).
