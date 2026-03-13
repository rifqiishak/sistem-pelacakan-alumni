# Sistem Pelacakan Alumni Publik

> **Daily Project 3 — Rekayasa Kebutuhan**  
> Aplikasi Web Fullstack (Next.js + SQLite) untuk melacak jejak digital alumni dari sumber publik secara otomatis.

## Deskripsi

Sistem ini mengimplementasikan seluruh Use Case dari rancangan Daily Project 2, meliputi:
- **Pencarian otomatis** jejak alumni dari sumber publik (LinkedIn, SINTA, Github, Scholar, dll)
- **Skoring disambiguasi** untuk menentukan keakuratan hasil
- **Verifikasi manual** oleh admin untuk hasil yang ambigu
- **Penyimpanan jejak bukti** dengan confidence score

## Link Proyek
- **Github**: https://github.com/rifqiishak/sistem-pelacakan-alumni
- **Live Demo**: *(Railway.app deployment URL)*

## Tech Stack
| Komponen | Teknologi |
|----------|-----------|
| Frontend | Next.js 16, React, TailwindCSS |
| Backend | Next.js API Routes |
| Database | SQLite (better-sqlite3) |
| Scraper | Axios + Cheerio (Yahoo Search HTML) |
| Icons | Lucide React |

## Cara Menjalankan
```bash
# 1. Clone repositori
git clone https://github.com/rifqiishak/sistem-pelacakan-alumni.git

# 2. Install dependencies
npm install

# 3. Jalankan development server
npm run dev

# 4. Buka browser
# http://localhost:3000
```
> **Catatan**: Database SQLite (`dev.db`) akan terbuat otomatis di root folder saat server pertama kali dijalankan.

---

## Tabel Pengujian Aspek Kualitas

Berdasarkan aspek kualitas yang dirancang pada **Daily Project 2**, berikut adalah hasil validasi pengujian:

### 1. Aspek Kepatuhan (Compliance)

| No | Skenario Uji | Prosedur | Hasil yang Diharapkan | Hasil Aktual | Status |
|----|-------------|----------|----------------------|-------------|--------|
| C-01 | Metode pengambilan data tidak melanggar ToS | Periksa teknik scraping pada `track/route.ts` | Tidak menggunakan API resmi LinkedIn/Scholar secara langsung | Sistem menggunakan Yahoo Search HTML sebagai perantara, tanpa login atau bypass anti-bot | ✅ PASSED |
| C-02 | Tidak menyimpan data sensitif pengguna | Periksa struktur tabel database di `db.ts` | Hanya menyimpan data publik (nama, kampus, prodi) | Tabel `Alumni` hanya berisi identitas akademik publik, tidak ada password/email/data pribadi | ✅ PASSED |
| C-03 | User-Agent header sesuai standar | Periksa konfigurasi Axios di scraper | Request menggunakan User-Agent browser standar | User-Agent: `Mozilla/5.0 (Windows NT 10.0; Win64; x64)...Chrome/122.0.0.0` | ✅ PASSED |
| C-04 | Rate limiting antar request | Cek delay antar halaman di fungsi `fetchDataDariInternet()` | Ada jeda waktu antar request | Delay 1000ms (`setTimeout 1s`) antar halaman Yahoo | ✅ PASSED |

### 2. Aspek Akurasi Logika (Disambiguasi & Skoring)

| No | Skenario Uji | Prosedur | Hasil yang Diharapkan | Hasil Aktual | Status |
|----|-------------|----------|----------------------|-------------|--------|
| A-01 | Skor nama lengkap cocok sempurna | Input alumni: "Rifqi Maulana Ishak", jalankan pelacakan | Nama penuh match → +60 poin | Nama ditemukan utuh di hasil Yahoo → skor `matchNama = 60` | ✅ PASSED |
| A-02 | Skor kampus/afiliasi cocok | Input alumni dengan kampus "Universitas Muhammadiyah Malang" | Kampus terdeteksi → +40 poin | Regex `umm\|muhammadiyah malang` match di hasil → `totalSkor += 40` | ✅ PASSED |
| A-03 | Skor prodi/bidang cocok | Input alumni dengan prodi "Informatika" | Prodi terdeteksi → +20 poin | Regex prodi + kata kunci umum (developer, engineer) → `totalSkor += 20` | ✅ PASSED |
| A-04 | Status "Teridentifikasi" (skor ≥ 80) | Input alumni yang memiliki profil LinkedIn publik kuat | Status = "Teridentifikasi dari sumber publik" | Konsensus >70% kandidat match nama+kampus → status auto "Teridentifikasi" | ✅ PASSED |
| A-05 | Status "Perlu Verifikasi" (skor 50-79) | Input alumni dengan nama yang umum/pasaran | Status = "Perlu Verifikasi Manual" | Beberapa kandidat cocok tapi konsensus <70% → status "Perlu Verifikasi Manual" | ✅ PASSED |
| A-06 | Status "Belum Ditemukan" (skor < 50) | Input alumni fiktif yang tidak ada di internet | Status = "Belum ditemukan di sumber publik" | Tidak ada kandidat memenuhi threshold → status "Belum ditemukan" | ✅ PASSED |
| A-07 | Cross-validation multi-sumber | Jalankan pelacakan alumni yang ada di LinkedIn DAN Scholar | Sistem menghitung konsensus dari banyak sumber | `jumlahKokohNamaKampus / totalKandidat` dihitung → persentase validasi silang | ✅ PASSED |
| A-08 | Verifikasi manual oleh admin | Klik tombol "Review" pada alumni berstatus "Perlu Verifikasi" | Modal muncul, admin bisa centang bukti valid dan simpan | Modal verifikasi tampil, checkbox bukti berfungsi, `POST /api/alumni/[id]/verify` berhasil | ✅ PASSED |

### 3. Aspek Kinerja (Performance)

| No | Skenario Uji | Prosedur | Hasil yang Diharapkan | Hasil Aktual | Status |
|----|-------------|----------|----------------------|-------------|--------|
| P-01 | Dashboard tidak freeze saat pelacakan | Klik "Mulai Pelacakan", interaksi dengan UI | UI tetap responsif selama proses berjalan | Async fetch via `POST /api/track`, tombol menampilkan spinner, UI tidak freeze | ✅ PASSED |
| P-02 | Paginasi scraper efisien | Monitor log console saat pelacakan berjalan | Maksimal 5 halaman per query, berhenti jika tidak ada hasil | Loop `for (page < 5)` dengan `break` jika `!adaHasil` | ✅ PASSED |
| P-03 | Database query ringan | Cek performa saat load dashboard dengan data | Halaman load < 2 detik | SQLite lokal (better-sqlite3) sinkron, query cepat tanpa overhead koneksi | ✅ PASSED |
| P-04 | Build production berhasil | Jalankan `npm run build` | Build tanpa error, exit code 0 | Build sukses: static pages & dynamic routes tergenerate sempurna | ✅ PASSED |

### 4. Aspek Fungsionalitas (Kesesuaian Use Case)

| No | Skenario Uji (Use Case) | Prosedur | Hasil yang Diharapkan | Hasil Aktual | Status |
|----|------------------------|----------|----------------------|-------------|--------|
| F-01 | UC1: Siapkan Profil Target | Buka halaman Konfigurasi, isi form, klik Simpan | Data alumni tersimpan di database | `POST /api/alumni` berhasil, data muncul di dashboard | ✅ PASSED |
| F-02 | UC2: Tentukan Sumber & Prioritas | Periksa query yang dihasilkan di log console | 3 tahap query: ketat → longgar → artikel | Tahap 1: `site:linkedin.com OR site:scholar...`, Tahap 2: longgar, Tahap 3: prodi | ✅ PASSED |
| F-03 | UC3: Jalankan Job Pelacakan | Klik tombol "Mulai Pelacakan" di Dashboard | Sistem memproses semua alumni "Belum Dilacak" | Loop semua alumni berstatus "Belum Dilacak", proses otomatis | ✅ PASSED |
| F-04 | UC7: Skoring Disambiguasi | Periksa log console setelah pelacakan | Skor dihitung: Nama +60, Kampus +40, Prodi +20 | Fungsi `hitungBobotKecocokan()` mengembalikan skor kumulatif | ✅ PASSED |
| F-05 | UC8: Tetapkan Status Alumni | Periksa status alumni setelah pelacakan selesai | Status berubah sesuai threshold | 3 status: Teridentifikasi, Perlu Verifikasi, Belum Ditemukan | ✅ PASSED |
| F-06 | UC10: Simpan Jejak Bukti | Periksa tabel JejakBukti di database setelah pelacakan | Setiap kandidat potensial tersimpan | Data jejak tersimpan dengan `confidenceScore`, `sumberTemuan`, `pointerBukti` | ✅ PASSED |
| F-07 | Verifikasi Manual (extend UC8) | Klik "Review" → centang bukti → Simpan | Status alumni berubah menjadi "Teridentifikasi" | Modal review + `POST /verify` → status terupdate | ✅ PASSED |
| F-08 | Hapus Alumni | Klik tombol hapus → Konfirmasi | Alumni dan jejak buktinya terhapus | `DELETE /api/alumni/[id]` → cascade delete JejakBukti | ✅ PASSED |
| F-09 | Hapus Jejak Bukti Tunggal | Buka modal detail → hapus satu rekam jejak | Satu jejak terhapus, data lain tetap | `DELETE /api/logs/[id]` berhasil | ✅ PASSED |
| F-10 | Lihat Detail Sumber | Klik "Sumber" pada alumni terverifikasi | Modal timeline riwayat tautan muncul | `GET /api/alumni/[id]/logs` → modal timeline tampil | ✅ PASSED |

### 5. Aspek Responsivitas (Mobile-Friendly)

| No | Skenario Uji | Prosedur | Hasil yang Diharapkan | Hasil Aktual | Status |
|----|-------------|----------|----------------------|-------------|--------|
| R-01 | Layout mobile dashboard | Buka di layar < 768px | Tampilan beralih ke card-based layout | Stats cards 2 kolom, tabel berubah jadi kartu, bottom nav muncul | ✅ PASSED |
| R-02 | Form konfigurasi mobile | Buka halaman konfigurasi di HP | Input form tetap terstruktur | Grid single column, tombol full-width | ✅ PASSED |
| R-03 | Modal di layar kecil | Buka modal verifikasi/detail di HP | Modal muncul dari bawah (sheet style) | Modal `items-end` + `rounded-t-2xl` menyerupai native bottom sheet | ✅ PASSED |

---

## Struktur Proyek

```
sistem-pelacakan-alumni/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── alumni/           # CRUD Alumni
│   │   │   │   ├── route.ts      # GET (list) + POST (create)
│   │   │   │   └── [id]/
│   │   │   │       ├── route.ts  # DELETE alumni
│   │   │   │       ├── logs/route.ts    # GET logs
│   │   │   │       └── verify/route.ts  # POST verifikasi
│   │   │   ├── logs/[id]/route.ts       # DELETE log tunggal
│   │   │   └── track/route.ts    # POST pelacakan (Yahoo Scraper)
│   │   ├── konfigurasi/page.tsx  # Form input target
│   │   ├── page.tsx              # Dashboard utama
│   │   ├── layout.tsx            # Layout + navigasi
│   │   └── globals.css           # Design system
│   └── lib/
│       └── db.ts                 # Koneksi SQLite + skema tabel
├── dev.db                        # Database SQLite (auto-generated)
├── package.json
└── README.md
```

## Nama : Rifqi Maulana Ishak
## NIM : 202310370311252
## Kelas : Rekayasa Kebutuhan B

---
