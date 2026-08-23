# Menjalankan e-KokoT6 dengan Docker

Deploy rasmi projek ini ialah **Vercel** (lihat `DEPLOY.md`). Setup Docker di sini
untuk **self-host** atau **dev tempatan** — ia tidak menggantikan Vercel.

## Mula pantas

```bash
cp .env.example .env          # isi JWT_SECRET, dsb.
docker compose up -d --build  # db -> migrate -> app
```

Buka http://localhost:3000

Biarkan `DATABASE_URL` dalam `.env` kosong/dikomen — compose sudah menetapkan
`postgresql://postgres:postgres@db:5432/ekokot6?schema=public` (hos `db`, bukan
`localhost`). Jika anda mahu Postgres luaran, isikan `DATABASE_URL` sendiri.

## Seed data awal (sekali sahaja)

```bash
docker compose run --rm migrate npx prisma db seed
docker compose run --rm migrate npx tsx scripts/bootstrap.ts
```

Mana-mana skrip `db:*` dalam `package.json` boleh dijalankan cara sama, kerana
perkhidmatan `migrate` mengandungi Prisma CLI + `tsx` + `src/` penuh.

## Struktur imej

| Peringkat  | Tujuan |
|-----------|--------|
| `deps`    | `npm ci` (termasuk devDependencies) |
| `builder` | `prisma generate` + `next build` dalam mod `standalone` |
| `migrator`| Imej kerja: `prisma migrate deploy`, seed, skrip `tsx` |
| `runner`  | Imej produksi — hanya output standalone, pengguna bukan-root |

`next.config.ts` hanya menghidupkan `output: "standalone"` bila `DOCKER_BUILD=1`,
jadi build Vercel kekal tidak berubah.

## Perkara penting

- **Pemboleh ubah `NEXT_PUBLIC_*` ditanam masa build.** Menukar
  `NEXT_PUBLIC_BASE_URL` memerlukan `docker compose build app` semula, bukan
  sekadar restart.
- **Muat naik fail.** `STORAGE_DRIVER="local"` menulis ke `public/uploads`,
  yang dilekapkan sebagai volume `uploads`. Untuk lebih daripada satu replika,
  tukar ke `STORAGE_DRIVER="s3"` — volume tidak dikongsi antara nod.
- **`.env` tidak masuk ke dalam imej** (disekat oleh `.dockerignore`); ia
  dibaca masa runtime melalui `env_file`.
- **Migrasi berjalan automatik** sebelum `app` bermula; `app` tidak akan naik
  jika `migrate` gagal.

## Bina imej sahaja (tanpa compose)

```bash
docker build -t ekokot6 \
  --build-arg NEXT_PUBLIC_BASE_URL=https://koko.sekolah.edu.my .

docker run -d -p 3000:3000 --env-file .env \
  -v ekokot6-uploads:/app/public/uploads ekokot6
```

Jalankan `prisma migrate deploy` secara berasingan:

```bash
docker build -t ekokot6-migrate --target migrator .
docker run --rm --env-file .env ekokot6-migrate
```

## Seed dengan data sebenar (spreadsheet)

`prisma/seed.ts` membaca tiga fail dari **folder induk projek**
(`path.resolve(process.cwd(), "..")`). Fail ini tiada dalam imej — ia mesti
dilekapkan masa runtime. Dalam bekas, cwd ialah `/app`, jadi induknya `/`:

| Fail (folder induk) | Laluan dalam bekas | Perlu? |
|---|---|---|
| `namelist.xlsx`    | `/namelist.xlsx`    | Ya — `seedPelajar()` |
| `GURU DATA.xlsx`   | `/GURU DATA.xlsx`   | Ya — `seedGuru()` |
| `DUMM PAJSK.xlsx`  | `/DUMM PAJSK.xlsx`  | Opsyenal — sejarah T5 |

```bash
# Folder induk projek (tempat spreadsheet berada)
D="$(pwd)/.."
docker compose run --rm \
  -v "$D/namelist.xlsx:/namelist.xlsx:ro" \
  -v "$D/GURU DATA.xlsx:/GURU DATA.xlsx:ro" \
  -v "$D/DUMM PAJSK.xlsx:/DUMM PAJSK.xlsx:ro" \
  migrate npx prisma db seed
```

`main()` memanggil `seedPelajar()` **sebelum** `seedGuru()`, jadi jika
`namelist.xlsx` hilang, guru pun tidak sempat diimport — seed berhenti awal
selepas `TetapanMarkah` dan akaun `admin` sahaja.

Tanpa spreadsheet, guna data dummy sebagai ganti:

```bash
docker compose run --rm migrate npx tsx scripts/seed-dummy.ts   # 50 pelajar
```
