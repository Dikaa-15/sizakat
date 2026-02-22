# SiZakat Project Notes

## Current Progress
- Phase 1 completed (implementation level, runtime DB test pending)
- Foundation implemented:
  - Express app setup
  - MySQL pool configuration
  - Auth middleware and role guard
  - Auth routes (`/auth/login`, `/auth/logout`, `/auth/profile`)
  - Master RT/RW routes (`/api/master/rt-rw`)
  - Base schema and seed script
- Phase 2 partial implementation:
  - Muzakki API routes (`/api/muzakki`)
  - Auto-calculation logic using `pengaturan`
  - EJS page for data muzakki (`/muzakki`) with filter and create/edit modal
  - Login page (`/login`)
- Phase 3 implementation:
  - Mustahik API routes (`/api/mustahik`) with filter by kategori and RT/RW
  - 8 kategori validation (Fakir, Miskin, Amil, Mualaf, Riqab, Gharimin, Fisabilillah, Ibnu Sabil)
  - Auto-calc hak mustahik (`hak_beras_kg`, `hak_uang`) from `pengaturan`
  - EJS page for data mustahik (`/mustahik`) with filter and create/edit modal
- Navigation & Master Data update:
  - Shared top navigation component for web pages
  - Master RT/RW web page (`/master/rt-rw`) with list/filter
  - Admin CRUD modal for RT/RW integrated to existing API
- Phase 4 implementation:
  - Distribusi API (`/api/distribusi`) with list, create, and admin cancel endpoint
  - Stock validation based on penerimaan (muzakki) minus active distribusi
  - One-time distribution guard per mustahik unless canceled
  - Web page `/distribusi` with stock cards, mustahik distribution actions, and history list
- Phase 5 implementation:
  - Dashboard API (`/api/dashboard/summary`) and dashboard web page (`/dashboard`)
  - Laporan APIs (`/api/laporan/penerimaan`, `/api/laporan/distribusi`, `/api/laporan/cetak`)
  - Laporan web page (`/laporan`) with ringkasan, per kategori, and RT/RW breakdown
  - Print-friendly report output for `cetak` endpoint

## Important Rules
- Follow project brief in `SiZakat-Project-Planning (1).docx`
- Do not add features outside defined scope
- Propose migration-impacting changes first
