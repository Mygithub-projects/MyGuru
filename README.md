# e-KokoT6 — Sistem Pengurusan Kokurikulum Tingkatan 6

Sistem web untuk mengurus kokurikulum Tingkatan 6: markah PAJSK automatik,
kesinambungan kepimpinan T5→T6, e-Cert *self-service*, dan analitik — selaras
spesifikasi `e-KokoT6.md`.

## Stack

| Lapisan | Teknologi |
|---|---|
| Frontend & Backend | **Next.js 16** (App Router, Turbopack) + React 19 + TypeScript |
| Styling | Tailwind CSS v4 |
| Pangkalan Data | **Prisma 6** — SQLite (dev) / PostgreSQL (produksi) |
| Auth | JWT (`jose`) + cookie HttpOnly, RBAC 3 peringkat + sub-role SU/NSU |
| Kata laluan | bcrypt (`bcryptjs`) |
| Import Excel | `exceljs` (IC dibaca sebagai teks) |
| Validasi | `zod` |

> **Nota Next.js 16:** projek guna konvensyen terkini — `params`/`cookies()`
> async, dan **`src/proxy.ts`** (menggantikan `middleware.ts`) untuk kawalan
> akses laluan.

## Persediaan

```bash
cd ekokot6
npm install
cp .env.example .env          # kemudian set JWT_SECRET yang kuat
npm run db:migrate            # cipta pangkalan data SQLite + skema
npm run db:seed               # import roster T6 (namelist) + Guru & cipta akaun
npm run dev                   # http://localhost:3000
```

Fail sumber Excel dijangka berada di folder **induk** projek
(`../namelist.xlsx`, `../GURU DATA.xlsx`). `namelist.xlsx` ialah senarai
pelajar Tingkatan 6 semasa (Kelas, Nama, No. IC, Jantina, dan unit Badan
Beruniform / Kelab / Sukan) — markah PAJSK T6 diisi kemudian oleh guru.

## Akaun Ujian (selepas seed)

| Peranan | Log masuk | Kata laluan |
|---|---|---|
| **Admin** | `admin` | `ekoko2026` |
| **Pelajar** | No. IC (cth `070402050048`) | `ekoko2026` |
| **Guru** | emel berdaftar (dari GURU DATA) | `ekoko2026` |

Kata laluan lalai dikonfigur melalui `DEFAULT_SEED_PASSWORD` dalam `.env`.

## Tukar ke PostgreSQL (produksi)

1. `prisma/schema.prisma` → tukar `provider = "sqlite"` kepada `"postgresql"` + tambah `directUrl`.
2. Set `DATABASE_URL` PostgreSQL dalam `.env`.
3. `npm run db:migrate && npm run db:bootstrap`.

Skema sengaja mengelak enum/array native supaya mudah-alih antara kedua-dua DB.

## Ujian & CI

```bash
npm test          # Vitest — ujian unit enjin PAJSK & penghurai (29 ujian)
npm run lint      # ESLint
npm run build     # Semakan jenis + binaan produksi
```

GitHub Actions (`.github/workflows/ci.yml`) menjalankan **prisma validate → lint →
test → build** pada setiap push/PR ke `main`. `vercel.json` menetapkan region
Singapura (`sin1`) + header keselamatan (HSTS, X-Frame-Options, dll.).

## 🚀 Deploy ke produksi

Lihat **[`DEPLOY.md`](./DEPLOY.md)** — panduan lengkap Vercel + PostgreSQL (Neon) +
storan objek (S3/R2) + pengurusan secrets, termasuk migrasi automatik (`vercel-build`)
dan bootstrap admin (`npm run db:bootstrap`).

## Status Pembangunan

**Siap:**
- ✅ Asas projek, keselamatan rahsia (`.env`, `.gitignore`)
- ✅ Skema pangkalan data penuh (11 jadual, T5 read-only vs T6 aktif)
- ✅ Enjin pengiraan markah PAJSK (parser kurungan + formula §5.6 + delta T5↔T6) — diuji
- ✅ Auth: login No. IC / emel, JWT, RBAC 3 peringkat + sub-role, proxy guard
- ✅ Import Excel sebenar (280 pelajar T6 dari `namelist.xlsx`, 32 guru) — IC sebagai teks (sifar di hadapan yang digugurkan Excel dipulihkan)
- ✅ Modul Pelajar: profil, ringkasan markah, **perbandingan T5 vs T6** (jadual + carta), unit semasa, pencapaian
- ✅ Dashboard asas Guru & Admin (kiraan & skop akses)
- ✅ **Pertukaran unit**: pelajar mohon → guru/admin lulus/tolak → T6 dikemas kini (jawatan reset, markah kira semula) sementara **T5 kekal**; semakan skop seliaan guru
- ✅ **Semakan guru**: panel item Pending (pertukaran/pencapaian/aktiviti luar) dengan tindakan Lulus/Tolak/Sahkan/Kuiri + markah
- ✅ **Aktiviti luar**: kelulusan → markah auto ikut peringkat → e-Cert diaktifkan (No. Siri unik); kawalan eviden lengkap (surat+sijil) di UI & pelayan
- ✅ **Modul Kehadiran**: SU/NSU buka sesi perjumpaan, tanda kehadiran (senarai) atau **QR self check-in**; guru sahkan; `markahKehadiran` dikira prorata & T6 dikemas kini
- ✅ **Laporan Mingguan & Projek** (SU/NSU): borang + muat naik fail (pra kertas kerja / pasca impak); guru sahkan/kuiri
- ✅ **Borang pelajar**: isi pencapaian & aktiviti luar + muat naik eviden
- ✅ **Penjanaan PDF**: e-Cert (logo, No. Siri, tandatangan — hanya jika Approved) & Butiran Diri (profil + perbandingan T5/T6) via `pdf-lib`
- ✅ **Analitik**: kehadiran ikut unit, status projek, pematuhan laporan, demografi (jantina/kaum/agama) + jadual silang — carta SVG; skop Guru (unit) vs Admin (penuh)
- ✅ **Admin**: import Excel via UI, tetapan formula markah, kemas kini demografi
- ✅ **Notifikasi**: dalam-app (loceng + kiraan belum dibaca) pada setiap kelulusan/kuiri; adapter e-mel/Telegram/WhatsApp boleh-palam (env)

**Penambahbaikan produksi — SIAP:**
- ✅ **Paksa tukar kata laluan** pada log masuk pertama (`mustChangePw`) — dikuatkuasakan di proxy/layout
- ✅ **Templat e-Cert boleh-suai** (institusi, tajuk, penandatangan, cop) via UI Admin + pratonton
- ✅ **Eksport analitik** ke Excel (4 helaian) & PDF
- ✅ **Adapter notifikasi luaran sebenar** — SMTP (nodemailer) & Telegram Bot API, aktif bila env disediakan (graceful no-op jika tidak)
- ✅ **Abstraksi storan fail** — pemacu `local` (lalai) / `s3` (`@aws-sdk/client-s3`) dipilih via `STORAGE_DRIVER`
- ✅ **Dokumentasi pengguna** — manual Pelajar/Guru/Admin (`docs/`) + halaman bantuan dalam-app (`/bantuan`)

**Konfigurasi produksi** (lihat `.env.example`):
- Tukar `provider` Prisma ke `postgresql` + `DATABASE_URL`
- `STORAGE_DRIVER=s3` + `S3_*` untuk storan objek
- `SMTP_*` dan/atau `TELEGRAM_BOT_TOKEN` untuk notifikasi
- Putar `JWT_SECRET`; pertimbang imbasan virus pada muat naik fail

## Struktur Penting

```
src/
  lib/
    pajsk.ts        # enjin markah PAJSK (parser + formula + perbandingan)
    auth-core.ts    # JWT + IC (selamat untuk edge/proxy)
    auth.ts         # bcrypt + cookie (runtime Node)
    import.ts       # penghurai Excel PAJSK, namelist T6 & Guru
    pelajar.ts      # lapisan data + perbandingan T5/T6
    enums.ts        # pemalar peranan/status/peringkat
    api.ts          # pembantu respons + guard peranan
  proxy.ts          # kawalan akses laluan (Next 16)
  app/
    login/          # halaman log masuk
    pelajar/        # dashboard pelajar
    guru/ admin/    # dashboard guru & admin
    api/auth/       # login, logout, me
prisma/
  schema.prisma     # skema DB
  seed.ts           # import roster T6 (namelist) + Guru + cipta akaun
scripts/
  test-pajsk.ts     # ujian unit enjin markah
```
