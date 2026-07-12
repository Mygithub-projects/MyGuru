# Manual Pengguna — Pentadbir (Admin) (e-KokoT6)

## 1. Log Masuk
- Akaun lalai: `admin`. Tukar kata laluan dengan segera selepas pemasangan.

## 2. Import Data (CSV/Excel)
Menu **Import Data**:
1. Pilih jenis: **PAJSK (Pelajar)** atau **Pendaftaran Guru**.
2. Muat naik fail Excel → sistem mencipta/mengemas kini rekod (upsert) & akaun log masuk.
- **No. IC dibaca sebagai teks** (digit penuh dikekalkan, tiada format saintifik).
- Markah dalam kurungan (cth `NAIB PENGERUSI (8)`, `NEGERI (14)`, `12 (40)`) dihurai automatik.
- Amaran dipaparkan untuk IC tidak sah / baris bermasalah.

## 3. Tetapan Formula Markah
Menu **Tetapan Formula Markah** — laras nilai markah Jawatan & Peringkat agar selaras pekeliling PAJSK semasa. Markah penuh lalai = 100.

## 4. Templat e-Cert
Menu **Templat e-Cert** — suai nama institusi, tajuk sijil, nama & jawatan penandatangan, teks cop. Pratonton dipaparkan; perubahan terpakai pada semua e-Cert baharu.

## 5. Kemas Kini Demografi
Menu **Kemas Kini Demografi** — isi Jantina, Kaum, Agama setiap pelajar untuk analitik demografi.

## 6. Analitik Keseluruhan
Menu **📊 Analitik Keseluruhan** — statistik seluruh kohort (kehadiran, projek, laporan, demografi, jadual silang) + **Eksport Excel/PDF**.

## 7. Keselamatan (PDPA)
- Semua rahsia dalam `.env` (tidak di-commit). Putar `JWT_SECRET` untuk produksi.
- Kata laluan di-hash (bcrypt). Pengguna dipaksa tukar kata laluan lalai pada log masuk pertama.
- Untuk produksi: tukar DB ke PostgreSQL, storan fail ke S3 (`STORAGE_DRIVER=s3`), dan konfigur saluran notifikasi (SMTP/Telegram).
