# SPEC — Talking Pill Bag

Nama proyek: **Talking Pill Bag** (repo: `talking-pill-bag`). Nama Indonesia untuk diskusi internal: "Kantong Obat yang Bisa Ngomong".
Semua yang masuk repo (nama file, kode, komentar, commit, README, deskripsi GitHub) memakai bahasa Inggris — lihat `.codebuddy/rules/project.md`.

Hackathon: Tencent Cloud AI CAN DO IT Singapore 2026 — Healthcare Track, **Challenge 2: AI Healthier Every Day**.
Deadline submit: 16 Oktober 2026.

## 1. Ringkasan

Aplikasi web (mobile-first) untuk orang yang mengurus obat lansia: anak, cucu, atau helper.
Penyiap memfoto label obat sekali → AI membaca label → jadwal bergambar, penjelasan suara,
pengingat dengan tombol "Sudah", catatan tensi dari foto alat tensi, pengingat isi ulang,
dan daftar pertanyaan untuk dokter atau apoteker.

Fokus populasi demo: **lansia dengan hipertensi** yang minum beberapa obat kronis.

## 2. Pengguna dan peran

| Peran | Siapa | Layar yang dipakai |
|---|---|---|
| Penyiap | Anak / cucu / helper | Tambah obat (foto), cek hasil bacaan, atur bahasa |
| Penerima | Nenek / kakek | Layar "Hari Ini": huruf besar, tombol besar "Sudah", tombol dengar |
| Pemantau | Anak yang tinggal terpisah | Ringkasan mingguan |

## 3. Batasan wajib (dari handbook — TIDAK BOLEH dilanggar)

1. **Strictly bounded:** aplikasi TIDAK PERNAH menyarankan mengganti, menambah, mengurangi,
   atau menghentikan obat, dan tidak mendiagnosis. Pertanyaan semacam itu dijawab dengan
   "Pertanyaan ini perlu dijawab dokter atau apoteker" dan otomatis masuk daftar pertanyaan.
2. **Honest about uncertainty:** kalau label tidak terbaca atau obat tidak ada di basis pengetahuan,
   jawab persis: "I'm not able to identify that medication, please check with your pharmacist."
   (beserta terjemahannya di bahasa yang dipilih). Jangan menebak.
3. **Penjelasan obat hanya dari dua sumber:** teks label yang sudah dikonfirmasi manusia, dan
   file `data/drug-info.json` (ringkasan dari HealthHub Medications A-Z). LLM boleh
   menyederhanakan dan menerjemahkan teks itu, tidak boleh menambah fakta medis.
4. **Human-in-the-loop:** hasil bacaan AI selalu tampil di samping foto aslinya dan harus
   ditekan "Benar" (atau diperbaiki) sebelum masuk jadwal.
5. Tidak ada data pasien asli. Demo memakai label tiruan di folder `labels/`.

## 4. Fitur (dipetakan ke 6 fitur Challenge 2)

| # | Fitur | Fitur handbook |
|---|---|---|
| F1 | Foto label → AI ekstrak JSON → layar konfirmasi berdampingan dengan foto | Medication management |
| F2 | Jadwal "Hari Ini" bergambar: Pagi / Siang / Malam / Sebelum Tidur, ikon sebelum/sesudah makan, foto obat, huruf besar | Medication management |
| F3 | Tombol dengar: penjelasan singkat obat, dalam bahasa pilihan, suara via Web Speech API | Medication understanding |
| F4 | Pengingat + tombol "Sudah". Jika obat terlewat ≥2 kali dalam 7 hari, tanya alasan (Lupa / Efek samping / Merasa sudah sehat / Obat habis / Lainnya) | Adherence support |
| F5 | Foto layar alat tensi → AI baca sistolik/diastolik/nadi → konfirmasi → grafik tren 14 hari + kalimat sederhana, tanpa diagnosis | Health tracking |
| F6 | Hitung sisa obat dari jumlah di label dan jadwal; pengingat isi ulang 7 hari sebelum habis | Preventive health |
| F7 | Daftar pertanyaan untuk dokter: obat sering terlewat + alasannya, tren tensi, pertanyaan yang ditolak dijawab AI | Healthcare preparation |
| F8 | Ringkasan mingguan untuk pemantau | Longitudinal |

## 5. Bahasa

UI dan penjelasan: English, 中文 (Mandarin), Bahasa Melayu, Bahasa Indonesia.
Teks UI statis disimpan di `lib/i18n.ts`. Terjemahan penjelasan obat boleh lewat LLM,
tapi sumbernya tetap `data/drug-info.json`.

## 6. Arsitektur (sederhana, untuk 4 hari)

- **Next.js (App Router) + TypeScript + Tailwind CSS**, satu repo.
- **API route** `app/api/read-label/route.ts` dan `app/api/read-bp/route.ts`: menerima foto (base64),
  memanggil vision LLM, mengembalikan JSON yang sudah divalidasi dengan **zod**.
- **API route** `app/api/explain/route.ts`: menerima nama obat + bahasa, mengambil entri dari
  `data/drug-info.json`, meminta LLM menyederhanakan/menerjemahkan **hanya teks itu**.
  Obat tidak ada di JSON → kembalikan kalimat "tanya apoteker", tanpa memanggil LLM.
- **LLM provider** lewat endpoint **OpenAI-compatible**, dikonfigurasi di `.env.local`:
  `LLM_BASE_URL`, `LLM_API_KEY`, `LLM_VISION_MODEL`, `LLM_TEXT_MODEL`.
  (Bisa Tencent Hunyuan, Gemini, OpenAI, dll. API key TIDAK PERNAH masuk ke kode atau Git.)
- **Hasil uji model (14 Okt 2026, endpoint Nous Research):**
  - `google/gemini-2.5-flash` (vision): membaca label 1–4 dan 6 dengan benar, menolak label 5 yang buram, sekitar 5 detik
    dan sekitar US$0,002 per foto. Kirim `response_format: {"type":"json_object"}`. Field `food` dari model masih bebas
    (misalnya "BEFORE BEDTIME"), jadi prompt harus memaksa enum di SPEC bagian 7 dan zod harus menolak nilai lain.
  - `tencent/hy3` (teks) adalah **model reasoning**. Tanpa pengaturan, ia "berpikir" dulu sekitar 600 token. Kalau
    `max_tokens` kecil, `content` kembali `null`. Selalu kirim `reasoning: {"enabled": false}` (jawaban langsung,
    sekitar 40 token) dan `max_tokens` minimal 1000. Waktu respons 8–13 detik, jadi **simpan hasil penjelasan per
    obat + bahasa di localStorage** (buat sekali saat obat dikonfirmasi, jangan saat tombol dengar ditekan).
    Jika `content` kosong atau error → pakai teks bahasa Inggris dari `data/drug-info.json`.
- **Penyimpanan:** `localStorage` di browser (cukup untuk demo; sebut di diagram sebagai batasan).
- **Suara:** `window.speechSynthesis` (gratis, tanpa API).
- **Waktu demo:** tombol tersembunyi "Mode demo: majukan waktu +1 hari" supaya pengingat,
  tren, dan isi ulang bisa didemokan dalam video 5–8 menit.
- Deploy: Vercel (atau Tencent EdgeOne Pages) untuk link demo (poin bonus).

## 7. Skema data hasil baca label (output wajib dari `/api/read-label`)

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

Aturan: jika `readable=false` atau `confidence < 0.7` atau `drug_name` kosong →
tampilkan pesan "tanya apoteker", jangan buat jadwal. Field yang tidak terbaca masuk `unclear_fields`
dan ditandai merah di layar konfirmasi.

## 8. Definisi selesai (untuk demo)

- Semua 6 label di `labels/` diuji: 4 terbaca benar, 1 buram ditolak, 1 obat tak dikenal → "tanya apoteker".
- Seluruh alur bisa dijalankan di HP (lebar 375px) tanpa bantuan.
- Tidak ada satu pun kalimat saran medis di output (uji dengan pertanyaan jebakan di TASKS.md).
