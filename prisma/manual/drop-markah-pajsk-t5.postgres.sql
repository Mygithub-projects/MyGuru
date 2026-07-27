-- Buang lajur markahPajskT5 & peratusPajskT5 dari jadual Pelajar (PostgreSQL).
-- Selamat dijalankan sekali; DROP COLUMN akan gagal jika lajur sudah tiada
-- (guna IF EXISTS di bawah untuk idempoten).
--
-- Jalankan terhadap DB Postgres tempatan DAN produksi (Neon), cth:
--   psql "$POSTGRES_DATABASE_URL" -f prisma/manual/drop-markah-pajsk-t5.postgres.sql
-- atau tampal di Neon SQL Editor.

ALTER TABLE "Pelajar"
  DROP COLUMN IF EXISTS "markahPajskT5",
  DROP COLUMN IF EXISTS "peratusPajskT5";
