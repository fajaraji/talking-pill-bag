# CodeBuddy CLI session: T5-adherence-demo-clock

- Started: 2026-10-15 01:38:06
- Model: balanced-model
- Command: codebuddy -p -y --model balanced-model --max-turns 80 --output-format json

## Prompt

First fix two issues found while testing T4, then do T5.

T4 fixes:
A) Speech voices: window.speechSynthesis.getVoices() returns an empty list until the browser fires the "voiceschanged" event, so the app wrongly shows "Voice not available on this device" (tested: the browser had 3 en-US voices). Load voices once in a small hook (lib/use-voices.ts) that listens to "voiceschanged" and also retries getVoices() after a short delay; only show the "not available" note when the list is still empty after loading AND no voice matches the language.
B) The translated explanations sometimes contain markdown (e.g. "**Untuk apa ubat ini?**"), which is shown raw and read aloud. Tell the model to return plain text only (no markdown), and also strip markdown symbols (*, #, _, backticks) on the server before returning or caching.
Read SPEC.md and .codebuddy/rules/project.md. Do T5 in TASKS.md only (do not start T6).

Goal: adherence support (SPEC F4) plus a demo clock so the 5–8 minute demo video can show several days.

Requirements:
1. Demo clock in lib/clock.ts: store an integer day offset in localStorage key "tpb-demo-offset-days". getToday() returns the real local date plus the offset (YYYY-MM-DD). Add getNow() (Date shifted by the offset), advanceDemoDays(n) and resetDemoClock(). All date logic in the app must use these helpers.
2. Demo controls: a small, unobtrusive "Demo mode" panel at the bottom of /today, shown only when the URL has ?demo=1 or localStorage "tpb-demo"="1". Buttons: "+1 day", "Reset". Show the simulated date clearly when the offset is not zero.
3. Medicines get an "addedOn" date (YYYY-MM-DD, from getToday()) when confirmed. For older entries without it, treat addedOn as the first date the app loads them and save it.
4. Missed dose = a scheduled dose (medicine x time slot) on a date >= addedOn and < today with no dose-log entry. Put this logic in lib/adherence.ts with pure, unit-testable functions (no direct localStorage access inside them).
5. If a medicine has >= 2 missed doses in the last 7 days and no reason was recorded for it in the last 7 days, show a friendly card at the top of /today: "You missed <drug> <n> times this week. What happened?" with large buttons: Forgot, Side effects, Felt well, Ran out, Other. Save to localStorage "tpb-missed-reasons" as { medicineId, reason, missedCount, recordedOn }.
6. After a reason is chosen, show only a neutral acknowledgement and "We'll add this to your questions for the doctor or pharmacist." Never suggest changing, stopping or skipping the medicine. For "Side effects" also show: "Please tell your doctor or pharmacist about this."
7. All new UI strings in lib/i18n.ts for en, zh, ms, id.
8. Add a tiny test script without new dependencies: scripts/test-adherence.mjs that imports nothing from Next and checks the missed-dose logic with a few hard-coded cases (copy the pure functions into a .mjs-compatible form or write lib/adherence.ts so it can be compiled by tsc). Simplest acceptable option: add "test:adherence": "npx tsx scripts/test-adherence.ts" only if tsx is already available; otherwise skip the script and explain why in the summary.

Do not touch .env.local. When done: run npm run typecheck and npm run build and fix any errors, then git commit with a Conventional Commits message in English. End with a short summary of what changed and how to test it.


## Result
