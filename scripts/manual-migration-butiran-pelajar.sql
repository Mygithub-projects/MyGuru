-- Migrasi manual: Pengesahan Butiran Pelajar oleh Guru Penasihat/Ketua GP
-- Jadual sasaran: "g5_p4"."Pelajar" (DB moeagentic, 34.87.149.51:5433)
--
-- SEBAB perlu jalan manual: pengguna aplikasi (g5_p4_user) BUKAN pemilik
-- jadual "Pelajar" pada DB kongsi ini, jadi `prisma migrate dev` dan
-- `prisma db push` kedua-duanya gagal (ERROR: must be owner of table Pelajar /
-- permission denied to create database). Jalankan skrip ini menggunakan
-- kredential yang MEMILIKI jadual tersebut (atau superuser Postgres).
--
-- Perubahan: TAMBAH 3 lajur sahaja (semua nullable/default) — TIADA data
-- sedia ada dipadam atau diubah. Selamat dijalankan bila-bila masa.

ALTER TABLE "g5_p4"."Pelajar" ADD COLUMN IF NOT EXISTS "statusButiran" TEXT NOT NULL DEFAULT 'Pending';
ALTER TABLE "g5_p4"."Pelajar" ADD COLUMN IF NOT EXISTS "disahkanOlehId" TEXT;
ALTER TABLE "g5_p4"."Pelajar" ADD COLUMN IF NOT EXISTS "tarikhSahkan" TIMESTAMP(3);

-- Pengesahan selepas jalan (jangkaan: 3 baris dipulangkan)
-- SELECT column_name FROM information_schema.columns
-- WHERE table_schema='g5_p4' AND table_name='Pelajar'
--   AND column_name IN ('statusButiran','disahkanOlehId','tarikhSahkan');
