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

## Features

- **Add Medicine** — Take or upload a photo of a medicine label. AI reads it and shows the extracted fields next to the original image for human confirmation before saving.
- **Today** — A picture schedule with Morning / Afternoon / Evening / Bedtime slots, before/after-food icons, medicine photos, and a large "Done" button for each dose.
- **Listen + Ask a question** — Tap "Listen" to hear a brief explanation of the medicine in the chosen language. Tap "Ask a question" to type a question; the deterministic router redirects every question to a doctor or pharmacist and, for missed-dose questions about known medicines, also shows the official HealthHub quote.
- **Blood Pressure** — Photograph a BP monitor screen or enter values manually. View a 14-day trend graph and a plain-language sentence (no diagnosis).
- **Questions for my doctor or pharmacist** — A printable list of missed doses with reasons, refill reminders, high-BP readings, and any questions the user asked that the app redirected.
- **Weekly Summary** — For family members: doses taken vs scheduled, reasons recorded, average blood pressure, and refills due.

## Demo mode

Judges: open https://talking-pill-bag.vercel.app/?demo=1 to load a demo profile (fictional patient).

A hidden demo-mode bar on the Today screen lets you simulate the passage of time:

- Open any page with `?demo=1` to load the demo profile and show the demo controls.
- **+1 day** advances the simulated date by one day (stored in `localStorage`), so reminders, missed-dose prompts, refill warnings, and the weekly summary can be demonstrated quickly.
- **Reset** returns the simulated date to today.

## Architecture

```mermaid
flowchart TB
    subgraph Phone["Phone Browser"]
        UI["UI (React + Tailwind)"]
        LS["localStorage"]
        Speech["Web Speech API"]
    end

    subgraph Server["Next.js Server Routes"]
        RL["/api/read-label"]
        RB["/api/read-bp"]
        EX["/api/explain"]
    end

    subgraph External["External Services"]
        LLM["OpenAI-compatible endpoint"]
        VM["Vision model<br/>(reads photos)"]
        TM["tencent/hy3<br/>(translates & simplifies)"]
    end

    subgraph Data["Data"]
        DI["data/drug-info.json<br/>(HealthHub summaries)"]
    end

    UI <-->|"reads/writes"| LS
    UI -->|"speaks"| Speech
    UI -->|"POST image"| RL
    UI -->|"POST image"| RB
    UI -->|"POST name + lang"| EX
    RL -->|"POST image"| VM
    RB -->|"POST image"| VM
    EX -->|"POST text"| TM
    EX -->|"reads"| DI
    RL -.->|"returns JSON"| UI
    RB -.->|"returns JSON"| UI
    EX -.->|"returns explanation"| UI
    VM -.->|"returns text"| RL
    VM -.->|"returns text"| RB
    TM -.->|"returns text"| EX

    style Phone fill:#e1f5e1
    style Server fill:#e1e8f5
    style External fill:#f5e1e1
    style Data fill:#f5f0e1
```

**Trust boundaries:**

- The **phone browser** (UI, `localStorage`, Web Speech) runs entirely on the user's device. No data leaves the browser except via the explicit API calls.
- The **Next.js server routes** (`/api/read-label`, `/api/read-bp`, `/api/explain`) are the only components that hold the LLM API key. The key stays on the server and never reaches the client.
- The **external LLM provider** receives only photos (vision model) or HealthHub text snippets (text model). A label photo can show the patient's name; the app does not extract or store it, but the photo itself is sent to the provider. A production version would crop or blur the name area on the device before upload.
- **`data/drug-info.json`** is a static file of HealthHub medication summaries. It is read by the server and returned to the client as part of explanations.
- **Questions are answered by a deterministic router** (`lib/question-router.ts`) with **no LLM call**. Every question is redirected to a doctor or pharmacist.

## Key design trade-offs

- **localStorage instead of a database** — Sufficient for a 4-day hackathon prototype. All data stays on the device, but it is lost if the browser cache is cleared.
- **Human confirmation of every AI label read** — The preparer must tap "Confirm" (or edit fields) before the medicine enters the schedule. This prevents silent misreadings.
- **Explanations limited to HealthHub summaries** — The LLM may only translate and simplify text from `data/drug-info.json`. It cannot add facts not present in the JSON.
- **Deterministic question router instead of a chatbot** — Every free-text question is redirected to a doctor or pharmacist. No generative model answers medical questions.
- **Pre-generated cached translations** — Because the text model (`tencent/hy3`) takes 8–13 s per call, explanations are generated once when a medicine is confirmed and stored in `localStorage`. Subsequent "Listen" taps are instant.

## Safety boundaries

- Never gives medical advice: no suggestions to change, add, reduce or stop medicines, and no diagnosis.
- Says "I'm not able to identify that medication, please check with your pharmacist." instead of guessing.
- Demo uses fictional labels only — no real patient data.

## Testing

```bash
npm test        # runs scripts/test-adherence.ts and scripts/test-question-router.ts
npm run typecheck
npm run build
```

## Configuration

Copy `.env.example` to `.env.local` and fill in your own values:

```
LLM_BASE_URL=https://your-endpoint.example.com/v1
LLM_API_KEY=your-key-here
LLM_VISION_MODEL=google/gemini-2.5-flash
LLM_TEXT_MODEL=tencent/hy3
```

**Never commit `.env.local`** — it is git-ignored and contains secrets.

## Getting started

```bash
npm install
cp .env.example .env.local   # then fill in your own LLM API key
npm run dev
```

Open http://localhost:3000. Demo labels: open `labels/labels.html` in a browser and photograph them with a phone.

## Data sources

Medication information in `data/drug-info.json` is summarised from [HealthHub Singapore](https://www.healthhub.sg) medication pages (source URL stored per entry).
