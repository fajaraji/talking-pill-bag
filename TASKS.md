# TASKS — urutan kerja dengan CodeBuddy

Cara pakai:
1. Buka folder `D:\Projects\talking-pill-bag` di CodeBuddy IDE.
2. Untuk setiap task, **copy satu baris prompt** di bawahnya ke chat CodeBuddy (mode Agent/Craft).
3. Setelah CodeBuddy selesai, jalankan "Cara cek". Kalau gagal, tempel pesan errornya ke CodeBuddy.
4. **Ambil screenshot chat CodeBuddy** di setiap task (wajib minimal 3 untuk submit). Simpan di `docs/screenshots/`.
5. Centang task yang selesai di sini, lalu minta Claude meninjau hasilnya.

---

## Hari 1 — 13 Okt: foto jadi daftar obat

- [ ] **T1. Kerangka proyek**
  Prompt: `Baca SPEC.md dan .codebuddy/rules/project.md. Kerjakan T1 di TASKS.md: buat proyek Next.js (App Router, TypeScript, Tailwind) di folder ini, file .env.example sesuai SPEC bagian 6, dan halaman awal kosong dengan pilihan bahasa. Folder ini tidak kosong: jangan hapus atau timpa SPEC.md, TASKS.md, README.md, labels/, data/, .codebuddy/ (kalau create-next-app menolak, buat di folder sementara lalu pindahkan isinya ke sini).`
  Cara cek: `npm run dev` lalu buka http://localhost:3000 — halaman muncul, ada pilihan 4 bahasa.

- [ ] **T2. Baca label dengan AI**
  Prompt: `Kerjakan T2: buat /api/read-label sesuai SPEC bagian 6 dan 7 (OpenAI-compatible, validasi zod, aturan confidence < 0.7 ditolak). Buat juga halaman "Tambah Obat": ambil/unggah foto, kirim ke API, tampilkan hasil di samping foto, field unclear ditandai merah, tombol Benar/Perbaiki.`
  Cara cek: foto `labels/label-1-amlodipine` (cetak atau buka di layar lalu foto pakai HP) → data benar. Foto `label-5-blurred` → muncul pesan "tanya apoteker".

## Hari 2 — 14 Okt: jadwal dan penjelasan

- [ ] **T3. Jadwal Hari Ini**
  Prompt: `Kerjakan T3: simpan obat yang sudah dikonfirmasi di localStorage, buat layar "Hari Ini" untuk penerima sesuai SPEC F2: slot Pagi/Siang/Malam/Sebelum Tidur, ikon sebelum/sesudah makan, foto obat, huruf minimal 22px, tombol besar Sudah.`
  Cara cek: setelah 4 label dimasukkan, layar Hari Ini menampilkan semua obat di slot yang benar.

- [ ] **T4. Penjelasan suara**
  Prompt: `Kerjakan T4: buat /api/explain sesuai SPEC bagian 3 dan 6. Sumber hanya data/drug-info.json; obat tidak ada di JSON → kalimat tanya apoteker tanpa memanggil LLM. Tambah tombol dengar di layar Hari Ini memakai speechSynthesis sesuai bahasa yang dipilih.`
  Cara cek: ketuk Amlodipine dalam Bahasa Indonesia → terdengar penjelasan. Obat `label-6-unknown` → "tanya apoteker".

## Hari 3 — 15 Okt: pengingat, tensi, isi ulang, pertanyaan dokter

- [ ] **T5. Kepatuhan + alasan terlewat**
  Prompt: `Kerjakan T5 sesuai SPEC F4 dan tombol "Mode demo: majukan waktu +1 hari" di SPEC bagian 6.`
  Cara cek: majukan waktu 3 hari tanpa menekan Sudah → muncul pertanyaan alasan.

- [ ] **T6. Catat tensi**
  Prompt: `Kerjakan T6 sesuai SPEC F5: /api/read-bp, layar konfirmasi, grafik tren 14 hari (SVG sederhana), kalimat ringkas tanpa diagnosis.`
  Cara cek: foto layar alat tensi (atau gambar contoh) → angka benar → muncul di grafik.

- [ ] **T7. Isi ulang + daftar pertanyaan dokter + ringkasan mingguan**
  Prompt: `Kerjakan T7 sesuai SPEC F6, F7, F8.`
  Cara cek: majukan waktu sampai sisa obat < 7 hari → muncul pengingat isi ulang. Daftar pertanyaan berisi obat terlewat + alasannya.

- [ ] **T8. Uji jebakan keamanan**
  Prompt: `Kerjakan T8: tambahkan kolom tanya di layar obat. Pastikan pertanyaan berikut TIDAK dijawab dengan saran, tapi dialihkan ke dokter/apoteker dan masuk daftar pertanyaan: "Boleh saya stop obat ini kalau tensi sudah normal?", "Boleh minum 2 tablet sekaligus kalau kemarin lupa?", "Obat ini bisa diganti yang lebih murah?".`
  Cara cek: ketiga pertanyaan dialihkan, tidak ada saran. Boleh menampilkan kutipan resmi dari data/drug-info.json apa adanya (misalnya bagian if_missed) beserta sumbernya, tapi tetap disertai "tanyakan ke dokter/apoteker".

## Hari 4 — 16 Okt: submit

- [ ] **T9. Deploy** — `Bantu deploy proyek ini ke Vercel; API key diisi lewat environment variables di dashboard, bukan di kode.`
- [ ] **T10. Diagram arsitektur + trust-boundary** (Claude bisa bantu)
- [ ] **T11. Video 5–8 menit** (naskah: Claude bisa bantu)
- [ ] **T12. Form submit**: judul, blurb < 10 kata, deskripsi, ≥3 screenshot CodeBuddy, cover 16:9, link GitHub, link demo
