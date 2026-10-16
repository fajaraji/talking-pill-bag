# CodeBuddy CLI session: T22-robust-label-reading-hy3

- Started: 2026-10-16 17:19:31
- Model: hy3
- Command: codebuddy -p -y --model hy3 --max-turns 120 --output-format json

## Prompt

Read .codebuddy/rules/project.md. Fix four problems in /api/read-label found while testing a real-looking Singapore pharmacy label (NIFEDIPINE LA 30MG, "TAKE 1 TABLET ONCE EVERY MORNING", dispensed date printed as "10/08/..." with the year cut off by a blister strip lying on top of the label).

1) False "I'm not able to identify that medication" for a clear label. The same image read correctly in 6 of 6 tests later, so the rejection is intermittent: invalid model output (e.g. quantity "30 TAB" instead of a number, null fields, extra text) fails strict zod validation and is treated as "unreadable". Fix: send temperature 0; normalise model output before validation (numbers from strings like "30 TAB" -> 30, null strings -> "", null arrays -> [], trim strings, upper/lower-case enums); if validation still fails, retry the model call once; only after that treat it as a service problem (see 3). Reject as unreadable ONLY when readable=false, confidence < 0.7 or drug_name is empty.

2) Hallucinated year: the model returned dispensed_date "2021-08-10" although the year is not visible. Add to the prompt: never guess, infer or complete any part of a date; if the day, month or year is cut off, covered or missing, return "" and add "dispensed_date" to unclear_fields. Also add a server-side guard: if dispensed_date is not a valid YYYY-MM-DD, is in the future, or is more than 2 years before today, set it to "" and add "dispensed_date" to unclear_fields. Apply the same "never guess" rule to quantity_dispensed and strength.

3) Separate messages on the Add Medicine page: unreadable label -> keep "I'm not able to identify that medication, please check with your pharmacist."; model/service failure or invalid output after the retry -> new i18n message "We couldn't read the photo this time. Please try again." with a Retry button (all four languages). The API should return HTTP 422 { rejected: true } for unreadable and HTTP 503 { retryable: true } for service problems.

4) Multilingual labels: tell the model the label may be in English, Chinese, Malay or Indonesian (e.g. "Minum 1 tablet setiap pagi sesudah makan", "每日早上服一粒，饭后"); it must still output the enum values (time_slots, food) in English and drug_name as printed (Latin script generic name if it is printed).

Add unit tests for the normalisation and the date guard in scripts/ (pure functions in lib/label-normalise.ts) and include them in npm test. Run npm test, npm run typecheck and npm run build. Commit: "fix: robust label reading, no guessed dates, separate retry message, multilingual labels". Do not touch .env.local.


## Result


## Stats

- Duration: 3.3 min
- Turns: 
- Is error: 
- Session id: 
- Cost/usage:   total_cost_usd=
