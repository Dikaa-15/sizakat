# SiZakat Tasklist

## Phase 1 - Setup & Database (2 hari)
- [x] Inisialisasi project Node.js + Express + EJS + Tailwind-ready structure
- [x] Setup environment config (`.env.example`) dan database connection
- [x] Buat `schema.sql` sesuai brief untuk tabel:
  - [x] `master_rt_rw`
  - [x] `users`
  - [x] `muzakki`
  - [x] `mustahik`
  - [x] `distribusi`
  - [x] `pengaturan`
- [x] Implement auth API:
  - [x] `POST /auth/login`
  - [x] `POST /auth/logout`
  - [x] `GET /auth/profile`
- [x] Implement master RT/RW API:
  - [x] `GET /api/master/rt-rw`
  - [x] `GET /api/master/rt-rw/:id`
  - [x] `POST /api/master/rt-rw` (admin)
  - [x] `PUT /api/master/rt-rw/:id` (admin)
  - [x] `DELETE /api/master/rt-rw/:id` soft delete (admin)
- [x] Middleware dasar:
  - [x] JWT auth guard
  - [x] Role guard admin
  - [x] Error handler
- [x] Seed awal:
  - [x] Admin user
  - [x] Minimal data `pengaturan`
- [ ] Checkpoint DoD Phase 1:
  - [ ] API auth + RT/RW berjalan tanpa error
  - [ ] Validasi input required berjalan
  - [ ] Soft delete RT/RW bekerja via `is_active`

## Phase 2 - Muzakki Module (2 hari)
- [x] Model/controller/routes `muzakki`
- [x] `GET /api/muzakki` + filter RT/RW, tanggal, jenis zakat
- [x] `GET /api/muzakki/:id`
- [x] `POST /api/muzakki`
- [x] `PUT /api/muzakki/:id`
- [x] `DELETE /api/muzakki/:id` (admin)
- [x] Auto-calc zakat dari `jumlah_jiwa x pengaturan`
- [x] UI Data Muzakki (table, search/filter, modal tambah/edit)
- [ ] Checkpoint DoD Phase 2:
  - [ ] CRUD muzakki valid
  - [ ] Kalkulasi beras/uang sesuai pengaturan

## Phase 3 - Mustahik Module (2 hari)
- [x] Model/controller/routes `mustahik`
- [x] `GET /api/mustahik` + filter kategori/RT-RW
- [x] `GET /api/mustahik/:id`
- [x] `POST /api/mustahik`
- [x] `PUT /api/mustahik/:id`
- [x] `DELETE /api/mustahik/:id` (admin)
- [x] Validasi 8 kategori mustahik
- [x] Auto-calc `hak_beras_kg` dan `hak_uang`
- [x] UI Data Mustahik (table, filter, modal)
- [ ] Checkpoint DoD Phase 3:
  - [ ] CRUD mustahik valid
  - [ ] Hak zakat auto-calc benar

## Phase 4 - Distribusi Module (2 hari)
- [x] Model/controller/routes `distribusi`
- [x] `GET /api/distribusi` + filter status
- [x] `POST /api/distribusi`
- [x] `PUT /api/distribusi/:id/batal` (admin)
- [x] Validasi stok cukup sebelum distribusi
- [x] Kurangi stok saat konfirmasi distribusi
- [x] Rollback stok saat pembatalan
- [x] Enforce: mustahik hanya menerima sekali kecuali dibatalkan
- [x] UI Distribusi (list, modal salurkan, konfirmasi)
- [ ] Checkpoint DoD Phase 4:
  - [ ] Distribusi + pembatalan konsisten
  - [ ] Stok beras/uang terjaga

## Phase 5 - Dashboard & Laporan (2 hari)
- [x] `GET /api/dashboard/summary`
- [x] `GET /api/laporan/penerimaan`
- [x] `GET /api/laporan/distribusi`
- [x] `GET /api/laporan/cetak`
- [x] Dashboard UI: summary cards, progress, chart kategori
- [x] Laporan UI: total penerimaan/distribusi, sisa zakat, breakdown RT/RW
- [x] Cetak/PDF laporan
- [ ] Checkpoint DoD Phase 5:
  - [ ] Angka dashboard/laporan konsisten dengan transaksi

## Phase 6 - Polish & Testing (1 hari)
- [ ] Uji validasi semua form/API
- [ ] Uji responsif desktop + mobile
- [ ] Uji edge cases distribusi dan pembatalan
- [ ] Regression check antar modul
- [ ] Update `CLAUDE.md` sesuai implementasi terbaru
- [ ] Checkpoint DoD final:
  - [ ] Semua CRUD tanpa error
  - [ ] Validasi + auto-calc benar
  - [ ] Data konsisten end-to-end
  - [ ] Dokumentasi update
