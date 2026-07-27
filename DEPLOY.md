# Panduan Deploy — e-KokoT6 (Vercel + PostgreSQL + Secrets)

Panduan langkah-demi-langkah untuk menerbitkan e-KokoT6 ke produksi pada **Vercel**
dengan **PostgreSQL** terurus dan storan objek untuk muat naik fail.

> **Tiga keputusan produksi penting** (berbeza daripada pembangunan tempatan):
> 1. **Postgres terurus** menggantikan Postgres tempatan (Vercel tiada cakera kekal).
> 2. **Storan objek (S3/R2)** wajib untuk muat naik fail — fail sistem Vercel
>    *read-only* kecuali `/tmp`, jadi `STORAGE_DRIVER=local` **tidak berfungsi**.
> 3. **Semua rahsia** dalam Vercel Environment Variables — jangan commit ke Git.

---

## Prasyarat

- Akaun [GitHub](https://github.com), [Vercel](https://vercel.com), dan satu pembekal Postgres.
- Postgres terurus — disyorkan **[Neon](https://neon.tech)** (percuma, *connection pooling* siap sedia, integrasi Vercel). Alternatif: Supabase, Vercel Postgres.
- Storan objek — disyorkan **[Cloudflare R2](https://developers.cloudflare.com/r2/)** (serasi S3, murah, tiada caj egress) atau AWS S3.
- Node.js 20+ secara tempatan (untuk migrasi & bootstrap).

---

## Langkah 1 — Sediakan PostgreSQL

1. Cipta projek/pangkalan data Postgres (cth di Neon).
2. Dapatkan **dua** rentetan sambungan:
   - **Pooled** (melalui PgBouncer) — untuk aplikasi *serverless*. Biasanya mengandungi `-pooler` dan `?sslmode=require`.
   - **Direct** — untuk migrasi Prisma (`migrate deploy`).

   Di Neon: salin "Pooled connection" dan "Direct connection" dari dashboard.

```
DATABASE_URL = postgresql://user:pass@ep-xxx-pooler.region.aws.neon.tech/ekokot6?sslmode=require
DIRECT_URL   = postgresql://user:pass@ep-xxx.region.aws.neon.tech/ekokot6?sslmode=require
```

---

## Langkah 2 — Tambah `directUrl` pada skema

`prisma/schema.prisma` sudah pun `provider = "postgresql"`, dan sejarah migrasi
sudah di-*baseline* untuk Postgres (`prisma/migrations/0_init`). Satu-satunya
perubahan yang tinggal ialah menambah `directUrl`, supaya migrasi menggunakan
sambungan *direct* manakala runtime menggunakan *pooled*:

```prisma
datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")    // pooled (runtime)
  directUrl = env("DIRECT_URL")      // direct (migrasi) ← tambah baris ini
}
```

> 🚫 **Jangan** `rm -rf prisma/migrations`. Folder itu kini mengandungi baseline
> Postgres yang sah. Membuangnya akan memecahkan `migrate deploy` di Vercel.

Vercel menjalankan `prisma migrate deploy` semasa build, yang menerapkan
`0_init` ke pangkalan data produksi yang masih kosong. Untuk perubahan skema
selepas ini, jana migrasi seperti biasa dan commit hasilnya:

```bash
npx prisma migrate dev --name <nama_perubahan>
```

> **Pembangunan tempatan:** kekalkan Postgres (branch Neon pembangunan, atau
> Postgres tempatan). Jangan sesekali tukar `provider` — itulah punca sejarah
> migrasi rosak sebelum ini.

---

## Langkah 3 — Storan objek untuk muat naik (WAJIB)

Vercel *serverless* tidak boleh menulis ke `public/uploads`. Gunakan adapter S3
(sudah dibina dalam `src/lib/storage.ts`).

1. Cipta bucket (Cloudflare R2 atau AWS S3), jadikan boleh-baca awam (atau guna CDN).
2. Jana kunci akses (Access Key ID + Secret).
3. Tetapkan env (Langkah 6):

```
STORAGE_DRIVER=s3
S3_BUCKET=ekokot6-uploads
S3_REGION=auto                          # R2: "auto"; AWS: cth "ap-southeast-1"
S3_ACCESS_KEY_ID=...
S3_SECRET_ACCESS_KEY=...
S3_ENDPOINT=https://<akaun>.r2.cloudflarestorage.com   # R2 sahaja; kosongkan untuk AWS
S3_PUBLIC_BASE_URL=https://cdn.sekolah.edu.my          # URL awam bucket/CDN
```

---

## Langkah 4 — Jana secrets

```bash
# Rahsia JWT (min 48 aksara)
openssl rand -base64 48
```

Simpan output sebagai `JWT_SECRET` (Langkah 6). Jana satu kata laluan admin awal yang kuat juga.

---

## Langkah 5 — Tolak ke GitHub

Repo sudah wujud (**privat** — ia mengandungi rekod pelajar sebenar) pada
`https://github.com/Applephy/myguruAI.git`, dengan branch utama `master`:

```bash
cd ekokot6
git push origin master
```

> Pastikan `.gitignore` mengecualikan `.env`, `*.db`, `/uploads/`, `node_modules` (sudah dikonfigur).
>
> ⚠️ Repo **mesti kekal privat** — ia mengandungi nombor Kad Pengenalan pelajar
> di bawah PDPA 2010.

---

## Langkah 6 — Import ke Vercel & tetapkan Environment Variables

1. Vercel → **Add New → Project** → import repo GitHub. Framework dikesan automatik (Next.js).
2. **Settings → Environment Variables** — tambah (Scope: Production, dan Preview jika perlu):

| Variable | Wajib | Nilai |
|---|:---:|---|
| `DATABASE_URL` | ✅ | Rentetan **pooled** Postgres |
| `DIRECT_URL` | ✅ | Rentetan **direct** Postgres |
| `JWT_SECRET` | ✅ | Output `openssl rand -base64 48` |
| `JWT_EXPIRES_IN` | — | `8h` (lalai) |
| `NEXT_PUBLIC_INSTITUSI` | ✅ | Nama kolej |
| `NEXT_PUBLIC_BASE_URL` | — | URL produksi (cth `https://ekokot6.vercel.app`) |
| `STORAGE_DRIVER` | ✅ | `s3` |
| `S3_BUCKET` `S3_REGION` `S3_ACCESS_KEY_ID` `S3_SECRET_ACCESS_KEY` `S3_PUBLIC_BASE_URL` | ✅ | Lihat Langkah 3 |
| `S3_ENDPOINT` | R2 | Endpoint R2 |
| `ADMIN_USERNAME` / `ADMIN_PASSWORD` | — | Akaun admin awal (untuk bootstrap) |
| `SMTP_HOST` … | — | Notifikasi e-mel (pilihan) |
| `TELEGRAM_BOT_TOKEN` | — | Notifikasi Telegram (pilihan) |
| `ANTHROPIC_API_KEY` | — | Cerapan AI (pilihan) |
| `AI_MODEL` | — | `claude-opus-4-8` (lalai) atau `claude-haiku-4-5` |

> **Jangan** tetapkan `DATABASE_URL="file:..."` di produksi. **Jangan** commit `.env`.

---

## Langkah 7 — Build command (migrasi automatik)

Vercel menggunakan skrip **`vercel-build`** jika wujud (sudah ditambah ke `package.json`):

```json
"vercel-build": "prisma generate && prisma migrate deploy && next build",
"postinstall": "prisma generate"
```

Ini menjana klien Prisma, menerapkan migrasi ke Postgres (guna `DIRECT_URL`), kemudian build Next.js. Tiada konfigurasi tambahan diperlukan — cuma **Deploy**.

> Jika `migrate deploy` gagal kerana `DIRECT_URL` tiada, sahkan ia ditetapkan dalam Environment Variables.

---

## Langkah 8 — Bootstrap data awal

Selepas deploy pertama berjaya (migrasi telah diterapkan), cipta akaun Admin + tetapan markah. Jalankan **secara tempatan** dengan menghala ke DB produksi:

```bash
export DATABASE_URL="postgresql://...pooler.../ekokot6?sslmode=require"
export DIRECT_URL="postgresql://...direct.../ekokot6?sslmode=require"
export ADMIN_PASSWORD="KataLaluanKuat#2026"
npm run db:bootstrap
```

Ini mencipta:
- Akaun **Admin** (`mustChangePw=true` — dipaksa tukar pada log masuk pertama)
- Tetapan markah PAJSK & templat sijil lalai

> Data pelajar & guru **tidak** di-seed di produksi (fail Excel tiada di Vercel) —
> import melalui **UI Admin → Import Data** selepas log masuk.

---

## Langkah 9 — Log masuk & isi data

1. Buka URL produksi → log masuk sebagai Admin → **tukar kata laluan** (dipaksa).
2. **Import Data** → muat naik fail PAJSK (pelajar) & borang Guru (Excel).
3. **Kemas Kini Demografi**, semak **Tetapan Formula** & **Templat e-Cert**.
4. Selesai — pelajar & guru boleh log masuk.

---

## Pilihan — Notifikasi, AI, Domain

- **E-mel (SMTP):** set `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`. Pelajar perlu medan `email` diisi.
- **Telegram:** set `TELEGRAM_BOT_TOKEN` (+ `telegramChatId` pelajar atau `TELEGRAM_DEFAULT_CHAT_ID`).
- **Cerapan AI:** set `ANTHROPIC_API_KEY` (panel Analitik Pintar akan jana ringkasan).
- **Domain tersuai:** Vercel → Settings → Domains → tambah domain sekolah.

---

## Senarai Semak Keselamatan / PDPA

- [ ] `JWT_SECRET` unik & kuat (≥48 aksara rawak); berbeza dari pembangunan.
- [ ] Semua rahsia dalam Vercel Env Vars, **bukan** dalam Git.
- [ ] `mustChangePw` aktif — semua akaun import dipaksa tukar kata laluan.
- [ ] HTTPS dikuatkuasakan (automatik di Vercel).
- [ ] Postgres `sslmode=require`.
- [ ] Bucket storan: hadkan kebenaran tulis kepada kunci aplikasi sahaja; pertimbang imbasan virus untuk muat naik.
- [ ] Putar (`revoke + regenerate`) sebarang kunci yang terdedah dengan segera.
- [ ] Backup pangkalan data dihidupkan (Neon/Supabase auto-backup).

---

## Penyelesaian Masalah

| Gejala | Punca & penyelesaian |
|---|---|
| Build gagal: `@prisma/client did not initialize` | `postinstall: prisma generate` tiada/ gagal — sahkan ia dalam `package.json`. |
| `migrate deploy` gagal / tiada migrasi | Sahkan `prisma/migrations/0_init` ada dalam repo dan `migration_lock.toml` berbunyi `postgresql`. Jangan padam folder migrasi. |
| `P3019 provider does not match` | `migration_lock.toml` tidak sepadan dengan `provider` skema. Jangan tukar provider; jika DB sedia ada perlu diguna semula, *baseline* dengan `migrate diff` + `migrate resolve --applied`. |
| Muat naik fail gagal / ralat tulis fail | `STORAGE_DRIVER` masih `local` — set `s3` + kredensial S3/R2 (Langkah 3). |
| `Too many connections` pada beban | Guna rentetan **pooled** untuk `DATABASE_URL` (PgBouncer), bukan direct. |
| Login berfungsi tetapi dashboard kosong | Data belum diimport — guna UI Admin → Import Data. |
| `JWT_SECRET tidak ditetapkan` | Tambah `JWT_SECRET` dalam Env Vars & deploy semula. |
| e-Cert PDF tiada logo | Pastikan `public/logo-ktedm.jpeg` di-commit ke repo. |

---

## Ringkasan perintah (rujukan pantas)

```bash
# Tambah directUrl pada prisma/schema.prisma (Langkah 2), kemudian:
git add . && git commit -m "directUrl untuk produksi" && git push origin master

# Selepas deploy Vercel pertama:
DATABASE_URL=... DIRECT_URL=... ADMIN_PASSWORD=... npm run db:bootstrap
```

Selebihnya (migrasi setiap deploy) automatik melalui `vercel-build`.
