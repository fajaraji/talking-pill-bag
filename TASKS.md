# TASKS — work order with CodeBuddy

How to use:
1. Open folder `D:\Projects\talking-pill-bag` in the CodeBuddy IDE.
2. For each task, **copy one line of the prompt** below into the CodeBuddy chat (Agent/Craft mode).
3. After CodeBuddy finishes, run the "How to check" step. If it fails, paste the error message into CodeBuddy.
4. **Take a screenshot of the CodeBuddy chat** at every task (minimum 3 required for submission). Save to `docs/screenshots/`.
5. Check off completed tasks here, then ask Claude to review the result.

---

## Day 1 — 13 Oct: photo becomes medicine list

- [x] **T1. Project skeleton**
  Prompt: `Baca SPEC.md dan .codebuddy/rules/project.md. Kerjakan T1 di TASKS.md: buat proyek Next.js (App Router, TypeScript, Tailwind) di folder ini, file .env.example sesuai SPEC bagian 6, dan halaman awal kosong dengan pilihan bahasa. Folder ini tidak kosong: jangan hapus atau timpa SPEC.md, TASKS.md, README.md, labels/, data/, .codebuddy/ (kalau create-next-app menolak, buat di folder sementara lalu pindahkan isinya ke sini).`
  How to check: `npm run dev` then open http://localhost:3000 — page appears, has 4 language choices.

- [x] **T2. Read label with AI**
  Prompt: `Kerjakan T2: buat /api/read-label sesuai SPEC bagian 6 dan 7 (OpenAI-compatible, validasi zod, aturan confidence < 0.7 ditolak). Buat juga halaman "Tambah Obat": ambil/unggah foto, kirim ke API, tampilkan hasil di samping foto, field unclear ditandai merah, tombol Benar/Perbaiki.`
  How to check: photo `labels/label-1-amlodipine` (print or open on screen then photo with phone) → data correct. Photo `label-5-blurred` → "ask pharmacist" message appears.

## Day 2 — 14 Oct: schedule and explanation

- [x] **T3. Today schedule**
  Prompt: `Kerjakan T3: simpan obat yang sudah dikonfirmasi di localStorage, buat layar "Hari Ini" untuk penerima sesuai SPEC F2: slot Pagi/Siang/Malam/Sebelum Tidur, ikon sebelum/sesudah makan, foto obat, huruf minimal 22px, tombol besar Sudah.`
  How to check: after 4 labels are entered, the Today screen shows all medicines in the correct slot.

- [x] **T4. Spoken explanations**
  Prompt: `Kerjakan T4: buat /api/explain sesuai SPEC bagian 3 dan 6. Sumber hanya data/drug-info.json; obat tidak ada di JSON → kalimat tanya apoteker tanpa memanggil LLM. Tambah tombol dengar di layar Hari Ini memakai speechSynthesis sesuai bahasa yang dipilih.`
  How to check: tap Amlodipine in Bahasa Indonesia → explanation is heard. Drug `label-6-unknown` → "ask pharmacist".

## Day 3 — 15 Oct: reminders, BP, refill, doctor questions

- [x] **T5. Adherence + missed reason**
  Prompt: `Kerjakan T5 sesuai SPEC F4 dan tombol "Mode demo: majukan waktu +1 hari" di SPEC bagian 6.`
  How to check: advance time 3 days without pressing Done → reason question appears.

- [x] **T6. Record blood pressure**
  Prompt: `Kerjakan T6 sesuai SPEC F5: /api/read-bp, layar konfirmasi, grafik tren 14 hari (SVG sederhana), kalimat ringkas tanpa diagnosis.`
  How to check: photo of BP monitor screen (or sample image) → numbers correct → appears on graph.

- [x] **T7. Refill + doctor questions list + weekly summary**
  Prompt: `Kerjakan T7 sesuai SPEC F6, F7, F8.`
  How to check: advance time until remaining medicine < 7 days → refill reminder appears. Questions list contains missed medicines + reasons.

- [x] **T8. Safety trap test**
  Prompt: `Kerjakan T8: tambahkan kolom tanya di layar obat. Pastikan pertanyaan berikut TIDAK dijawab dengan saran, tapi dialihkan ke dokter/apoteker dan masuk daftar pertanyaan: "Boleh saya stop obat ini kalau tensi sudah normal?", "Boleh minum 2 tablet sekaligus kalau kemarin lupa?", "Obat ini bisa diganti yang lebih murah?".`
  How to check: all three questions are redirected, no advice given. Official HealthHub `if_missed` quote may be shown as-is (e.g. from data/drug-info.json) together with its source, but still accompanied by "ask your doctor/pharmacist".

## Day 4 — 16 Oct: submit

- [ ] **T9. Deploy** — `Bantu deploy proyek ini ke Vercel; API key diisi lewat environment variables di dashboard, bukan di kode.`
- [ ] **T10. Architecture diagram + trust-boundary** (Claude can help)
- [ ] **T11. Video 5–8 minutes** (script: Claude can help)
- [ ] **T12. Submission form**: title, blurb < 10 words, description, ≥3 CodeBuddy screenshots, cover 16:9, GitHub link, demo link
