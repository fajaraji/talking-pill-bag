# CodeBuddy CLI session: T22-robust-label-reading-deepseek-v4.1-flash

- Started: 2026-10-16 17:23:19
- Model: deepseek-v4.1-flash
- Command: codebuddy -p -y --model deepseek-v4.1-flash --max-turns 120 --output-format json

## Prompt

Read .codebuddy/rules/project.md. Fix four problems in /api/read-label found while testing a real-looking Singapore pharmacy label (NIFEDIPINE LA 30MG, "TAKE 1 TABLET ONCE EVERY MORNING", dispensed date printed as "10/08/..." with the year cut off by a blister strip lying on top of the label).

1) False "I'm not able to identify that medication" for a clear label. The same image read correctly in 6 of 6 tests later, so the rejection is intermittent: invalid model output (e.g. quantity "30 TAB" instead of a number, null fields, extra text) fails strict zod validation and is treated as "unreadable". Fix: send temperature 0; normalise model output before validation (numbers from strings like "30 TAB" -> 30, null strings -> "", null arrays -> [], trim strings, upper/lower-case enums); if validation still fails, retry the model call once; only after that treat it as a service problem (see 3). Reject as unreadable ONLY when readable=false, confidence < 0.7 or drug_name is empty.

2) Hallucinated year: the model returned dispensed_date "2021-08-10" although the year is not visible. Add to the prompt: never guess, infer or complete any part of a date; if the day, month or year is cut off, covered or missing, return "" and add "dispensed_date" to unclear_fields. Also add a server-side guard: if dispensed_date is not a valid YYYY-MM-DD, is in the future, or is more than 2 years before today, set it to "" and add "dispensed_date" to unclear_fields. Apply the same "never guess" rule to quantity_dispensed and strength.

3) Separate messages on the Add Medicine page: unreadable label -> keep "I'm not able to identify that medication, please check with your pharmacist."; model/service failure or invalid output after the retry -> new i18n message "We couldn't read the photo this time. Please try again." with a Retry button (all four languages). The API should return HTTP 422 { rejected: true } for unreadable and HTTP 503 { retryable: true } for service problems.

4) Multilingual labels: tell the model the label may be in English, Chinese, Malay or Indonesian (e.g. "Minum 1 tablet setiap pagi sesudah makan", "每日早上服一粒，饭后"); it must still output the enum values (time_slots, food) in English and drug_name as printed (Latin script generic name if it is printed).

Add unit tests for the normalisation and the date guard in scripts/ (pure functions in lib/label-normalise.ts) and include them in npm test. Run npm test, npm run typecheck and npm run build. Commit: "fix: robust label reading, no guessed dates, separate retry message, multilingual labels". Do not touch .env.local.


## Result
                                                                                                                                                                                   Selesai. Semua task sudah dikerjakan, commit `c7a4b1e` sudah dibuat.

## Ringkasan perubahan

**1. `lib/label-normalise.ts` (baru)** ΓÇö fungsi murni, bisa di-unit-test:
- `parseModelJson` ΓÇö buang markdown fence / teks pembungkus, ambil objek JSON.
- `normaliseLabelOutput` ΓÇö sebelum validasi zod: angka dari string (`"30 TAB"` ΓåÆ `30`), `null` string ΓåÆ `""`, `null` array ΓåÆ `[]`, trim string, enum di-lower-case (`"MORNING"` ΓåÆ `"morning"`). Key yang tidak dikirim model sengaja tidak diisi supaya zod gagal ΓåÆ memicu retry. Kalau `readable`/`confidence` tidak bisa dibaca ΓåÆ objek dibuang (`{}`).
- `applyDateGuard` / `isPlausibleDispensedDate` ΓÇö `dispensed_date` yang bukan `YYYY-MM-DD` valid, tanggal masa depan, atau > 2 tahun sebelum hari ini ΓåÆ di-set `""` + `"dispensed_date"` masuk `unclear_fields`.

**2. `app/api/read-label/route.ts`**
- `temperature: 0`; normalisasi sebelum zod; retry model sekali bila output tidak valid.
- Prompt baru: **jangan menebak** tanggal/jumlah/kekuatan (tahun tertutup blister strip ΓåÆ `""` + unclear), dan label boleh berbahasa Inggris/Cina/Melayu/Indonesia dengan enum tetap keluaran bahasa Inggris, `drug_name` sesuai cetakan.
- Status: `422 { rejected: true }` (tidak terbaca) vs `503 { retryable: true }` (masalah model/layanan). Reject hanya bila `readable=false`, `confidence < 0.7`, atau `drug_name` kosong.

**3. `lib/i18n.ts`** ΓÇö key baru `readFailed` di 4 bahasa: "We couldn't read the photo this time. Please try again." / Φ┐Öµ¼íµêæΣ╗¼µùáµ│òΦ»╗σÅûτàºτëçπÇéΦ»╖ΘçìΦ»òπÇé/ "Kami tidak dapat membaca gambar ini kali ini. Sila cuba semula." / "Kali ini kami tidak dapat membaca fotonya. Silakan coba lagi."

**4. `app/add/page.tsx`** ΓÇö pesan dipisah: tidak terbaca ΓåÆ pesan apoteker; masalah layanan/invalid ΓåÆ `readFailed` dengan tombol Retry (mencoba ulang foto yang sama); error klien ΓåÆ pesan generik.

**5. `scripts/test-label-normalise.ts` + `package.json`** ΓÇö 38 unit test baru, masuk `npm test`.

## Verifikasi
- `npm test` ΓåÆ 80 PASS, 0 FAIL
- `npm run typecheck` ΓåÆ bersih
- `npm run build` ΓåÆ sukses
- `.env.local` tidak disentuh

**Cara menguji manual:** buka `/add`, foto label dengan tahun tertutup ΓåÆ `dispensed_date` kosong dan ditandai merah; paksa error layanan (mis. matikan `LLM_API_KEY`) ΓåÆ muncul pesan "We couldn't read the photo this time." + tombol Retry; label yang benar-benar tidak terbaca ΓåÆ tetap pesan apoteker.

## Stats

- Duration: 5.6 min
- Turns:                                                                                                                                                                                    158
- Is error:                                                                                                                                                                                    False
- Session id:                                                                                                                                                                                    01a1443c-f035-7782-858d-f3d505dd82c1
- Cost/usage: {"input_tokens":2997073,"output_tokens":32711,"cache_creation_input_tokens":51665,"cache_read_input_tokens":2945408,"cache_creation":null,"server_tool_use":null,"service_tier":null}  total_cost_usd=                                                                                                                                                                                   0
