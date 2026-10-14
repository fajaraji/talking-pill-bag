# Talking Pill Bag

Snap a medicine label once. Get a picture schedule, spoken explanations in your own language, and gentle reminders — built for the families and helpers who manage medicines for older adults.

Built for the **Tencent Cloud AI CAN DO IT Hackathon Singapore 2026** — Healthcare Track, Challenge 2: *AI Healthier Every Day*. Developed with **CodeBuddy**.

## What it does

1. **Read the label** — photograph a medicine label; AI extracts the name, strength, timing and food instructions. A person confirms the result next to the original photo before it is used.
2. **Picture schedule** — morning / afternoon / evening / bedtime, before or after food, in large print.
3. **Spoken explanations** — what each medicine is for, in English, 中文, Bahasa Melayu or Bahasa Indonesia, sourced only from the confirmed label and official HealthHub (Singapore) medication information.
4. **Reminders with one "Done" button** — when doses are missed, the app asks why (forgot, side effects, felt well, ran out).
5. **Blood pressure log** — photograph the BP monitor screen; see a simple 14-day trend.
6. **Refill reminders** — remaining supply is estimated from the label quantity.
7. **Questions for the doctor** — missed doses, reasons and BP trends become a list to bring to the next visit.

## Safety boundaries

- Never gives medical advice: no suggestions to change, add, reduce or stop medicines, and no diagnosis.
- Says "I'm not able to identify that medication, please check with your pharmacist." instead of guessing.
- Demo uses fictional labels only — no real patient data.

## Getting started

```bash
npm install
cp .env.example .env.local   # then fill in your own LLM API key
npm run dev
```

Open http://localhost:3000. Demo labels: open `labels/labels.html` in a browser and photograph them with a phone.

## Data sources

Medication information in `data/drug-info.json` is summarised from [HealthHub Singapore](https://www.healthhub.sg) medication pages (source URL stored per entry).
