# CodeBuddy CLI session: T8-safe-questions

- Started: 2026-10-15 02:19:13
- Model: balanced-model
- Command: codebuddy -p -y --model balanced-model --max-turns 80 --output-format json

## Prompt

First fix a layout issue found while testing T7, then do T8.

T7 fix: on /today the three navigation buttons (Blood Pressure, Questions for my doctor or pharmacist, Weekly Summary) sit between the date and the dose list, so an older adult has to scroll past them before seeing today's medicines. Order the page as: header (date + progress) -> refill reminders -> missed-dose cards/acknowledgements -> dose sections -> "Time not set" -> navigation links (as a compact group at the bottom) -> demo panel.
Read SPEC.md (section 3 is the most important here) and .codebuddy/rules/project.md. Do T8 in TASKS.md only.

Goal: a safe "Ask a question" box that never gives medication advice (handbook: "strictly bounded — never crosses from explanation into medication advice").

Requirements:
1. In the medicine explanation panel on /today, add "Ask a question about this medicine" with a text input and a large Send button.
2. The question is NEVER answered by an LLM. Deterministic flow in lib/question-router.ts (pure function, unit-testable):
   - Always reply (in the chosen language): "This question needs your doctor or pharmacist. We've added it to your questions list." and save { medicineId, drugName, question, askedOn } via the "tpb-questions-redirected" helper from T7.
   - If the question mentions a missed/forgotten dose (keywords in en, zh, ms, id, e.g. missed, forgot, lupa, terlupa, 忘, 漏) AND the medicine is in data/drug-info.json with a non-null if_missed, ALSO show the official text clearly quoted as: "What HealthHub says about a missed dose:" + the if_missed text (translated via the cached explanation flow from T4 if available, otherwise English) + "Source: HealthHub" link. Do not add any other words of advice.
   - If the medicine is unknown, reply with the pharmacist sentence only.
3. These three questions must all be redirected and must not receive any yes/no answer or advice:
   - "Can I stop this medicine when my blood pressure is normal?"
   - "Can I take 2 tablets at once if I forgot yesterday?"
   - "Can this medicine be replaced with a cheaper one?"
   Write scripts/test-question-router.ts (or a .mjs equivalent that needs no new dependency) that asserts this for all three, plus the Indonesian versions "Boleh saya stop obat ini kalau tensi sudah normal?", "Boleh minum 2 tablet sekaligus kalau kemarin lupa?", "Obat ini bisa diganti yang lebih murah?". Add an npm script "test" that runs it, and run it.
4. All new UI strings in lib/i18n.ts for en, zh, ms, id.

Do not touch .env.local. When done: run npm test (if added), npm run typecheck and npm run build, fix any errors, then git commit with a Conventional Commits message in English. End with a short summary of what changed and how to test it.


## Result
                                                                                                                                                                                               Semua selesai. Berikut ringkasannya:

**Yang berubah:**

1. **Fix layout /today** ΓÇö tombol navigasi (Blood Pressure, Questions, Weekly Summary) dipindah ke bagian paling bawah halaman, setelah daftar obat dan "Time not set", sebelum demo panel.

2. **Kolom "Ask a question" di panel penjelasan** ΓÇö ketuk tombol "Listen" pada obat, muncul input teks + tombol Send hijau yang besar.

3. **`lib/question-router.ts`** ΓÇö fungsi murni, deterministik, **tidak pernah memanggil LLM**.
   - Selalu menjawab: "This question needs your doctor or pharmacist..."
   - Menyimpan `{medicineId, drugName, question, askedOn}` ke `tpb-questions-redirected`.
   - Jika pertanyaan mengandung keyword terlewat/lupa/forgot/missed **dan** obat dikenal dengan `if_missed` di `data/drug-info.json`, juga menampilkan kutipan resmi HealthHub beserta link sumbernya.
   - Obat tidak dikenal ΓåÆ hanya kalimat apoteker.

4. **Test script** `scripts/test-question-router.ts` ΓÇö menguji 3 pertanyaan jebakan dalam bahasa Inggris dan Indonesia, semua dialihkan tanpa jawaban yes/no/saran.

5. **String UI baru** di `lib/i18n.ts` untuk 4 bahasa.

**Cara test:**

- Buka `/today`, ketuk "Listen" pada Amlodipine.
- Ketik "Can I take 2 tablets at once if I forgot yesterday?" ΓåÆ kirim. Harus muncul pesan redirect + kutipan `if_missed` dari HealthHub.
- Ketik "Can I stop this medicine when my blood pressure is normal?" ΓåÆ kirim. Harus redirect, tanpa saran, tanpa kutipan if_missed.
- Ketik "Boleh saya stop obat ini kalau tensi sudah normal?" (Bahasa Indonesia) ΓåÆ sama, redirect saja.
- Jalankan `npm test` ΓåÆ 29 assertions, semua PASS.
- `npm run typecheck` dan `npm run build` bersih.
- Commit: `142e2c5`

## Stats

- Duration: 8.4 min
- Turns:                                                                                                                                                                                                161
- Is error:                                                                                                                                                                                                False
- Session id:                                                                                                                                                                                                01a13bda-dbf2-76f7-8c23-26decd1d378f
- Cost/usage: {"input_tokens":2869936,"output_tokens":18017,"cache_creation_input_tokens":103088,"cache_read_input_tokens":2766848,"cache_creation":null,"server_tool_use":null,"service_tier":null}  total_cost_usd=                                                                                                                                                                                               0
