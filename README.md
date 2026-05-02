# 🎓 Alumni Tracer System - Daily Project 3

Sistem Pelacakan Alumni Otomatis yang dirancang untuk mengatasi masalah "Disambiguasi Nama" menggunakan algoritma pembobotan skor (*Scoring Logic*). Proyek ini merupakan implementasi dari rancangan sistem pada Daily Project 2 yang merupakan pemenuhan tugas Daily project 3 mata kuliah Rekayasa Kebutuhan 6-D.

---

## 🔗 Tautan Penting
- **Link Publish (Live):** [https://pelacakan-alumni-mauve.vercel.app](https://pelacakan-alumni-mauve.vercel.app)
- **Source Code:** [https://github.com/rizkysch/pelacakan-alumni](https://github.com/rizkysch/pelacakan-alumni)

---


## 🚀 Fitur Utama
- **Automated Disambiguation:** Memisahkan entitas nama yang sama berdasarkan afiliasi universitas (UMM).
- **Multi-Source Tracking:** Integrasi pencarian otomatis ke LinkedIn, Google Scholar, dan Search Engine.
- **Evidence Management:** Menyimpan bukti pelacakan berupa tautan dan skor akurasi.
- **Data Integrity:** Fitur auto-reset status pelacakan jika data master diubah.
- **Real-time Dashboard:** Monitoring statistik alumni (Teridentifikasi vs Belum Dilacak).

---

## 🛠️ Tech Stack
![Next.js](https://img.shields.io/badge/Next.js-15-black)
![Tailwind](https://img.shields.io/badge/Tailwind-CSS-blue)
![Supabase](https://img.shields.io/badge/Supabase-Database-green)
![Vercel](https://img.shields.io/badge/Vercel-Deployed-black)
- **Frontend:** Next.js 15 (App Router), Tailwind CSS
- **Backend/Database:** Supabase (PostgreSQL)
- **Icons:** Lucide React
- **Deployment:** Vercel

---


## 🧠 Logika Disambiguasi
Sistem menggunakan bobot persentase untuk menentukan keaslian profil alumni:
1. **Nama Match (50%)**: Mencocokkan nama input dengan nama pada profil publik.
2. **Affiliation Match (50%)**: Mencocokkan kata kunci "Universitas Muhammadiyah Malang" atau "UMM" pada bio/pekerjaan.

> **Status Teridentifikasi** hanya diberikan jika total skor mencapai **100%**.


---

## 🧪 Tabel Pengujian Aplikasi (Kualitas Sistem)
Berikut adalah hasil pengujian fungsionalitas dan kualitas aplikasi berdasarkan parameter yang telah ditetapkan pada desain **Daily Project 2**.

| ID | Aspek Kualitas (DP2) | Skenario Pengujian | Hasil yang Diharapkan | Status |
| :--- | :--- | :--- | :--- | :---: |
| **01** | **Akurasi Data** | Pelacakan nama pasaran dengan filter universitas. | Sistem memberikan skor 100% jika nama & afiliasi cocok. | ✅ Pass |
| **02** | **Integritas Data** | Melakukan 'Edit' pada nama alumni yang sudah dilacak. | Status pelacakan otomatis kembali ke 'Belum Dilacak' & bukti dihapus. | ✅ Pass |
| **03** | **Reliabilitas** | Menekan tombol 'Data Salah' pada hasil pelacakan. | Sistem menghapus rujukan lama dan menyajikan kandidat baru tanpa error. | ✅ Pass |
| **04** | **Fungsionalitas** | Penambahan data alumni baru (CRUD). | Data tersimpan di Supabase dan muncul seketika di dashboard. | ✅ Pass |
| **05** | **Efisiensi User** | Pencarian data melalui kolom Search di Dashboard. | Hasil terfilter secara real-time tanpa perlu memuat ulang halaman. | ✅ Pass |
| **06** | **Responsivitas** | Mengakses aplikasi melalui browser mobile/smartphone. | Tampilan UI menyesuaikan ukuran layar (Mobile Friendly). | ✅ Pass |

---

## 🏗️ Cara Menjalankan Secara Lokal
1. Clone repository ini.
2. Jalankan `npm install`.
3. Buat file `.env.local` dan masukkan `NEXT_PUBLIC_SUPABASE_URL` serta `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
4. Jalankan `npm run dev`.

---

## 📁 Struktur Folder
```text
src/
├── app/               # Next.js App Router (Pages)
│   ├── daftar-alumni/ # Dashboard Utama
│   ├── input-alumni/  # Form Tambah Data
│   └── verifikasi/    # Logika Scoring & Evidence
├── components/        # UI Components (Reusability)
└── lib/               # Konfigurasi Supabase Client
```
---

## 👤 Dibuat Oleh

| Detail | Keterangan |
| :--- | :--- |
| **Nama** | Rizky Maulana Virdaus |
| **NIM** | 202310370311244 |
| **Kelas** | Rekayasa Kebutuhan D |
| **Program Studi** | Informatika |
| **Instansi** | Universitas Muhammadiyah Malang |


---


## 📄 Hak Cipta & Lisensi

Copyright © 2026 **Rizky Maulana Virdaus**. Seluruh hak cipta dilindungi undang-undang.

Proyek ini dikembangkan sebagai bagian dari tugas **Daily Project 3** pada mata kuliah Rekayasa Perangkat Lunak, Program Studi Informatika, **Universitas Muhammadiyah Malang**.
