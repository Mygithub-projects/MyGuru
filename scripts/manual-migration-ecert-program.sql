-- Migrasi manual: e-Cert Program (program anjuran kolej + peserta dari vw_murid MOE)
-- Sepadan dengan prisma/migrations/20261006120000_add_ecert_program
-- Skema sasaran: "g5_p4" (DB moeagentic, 34.87.149.51:5433)
--
-- SEBAB perlu jalan manual: pengguna aplikasi (g5_p4_user) tiada kebenaran
-- CREATE pada skema "g5_p4", jadi `prisma migrate deploy` gagal
-- (ERROR: permission denied for schema g5_p4). Jalankan skrip ini menggunakan
-- kredential pemilik skema (atau superuser Postgres).
--
-- Perubahan: CIPTA 2 jadual baharu sahaja — TIADA jadual/data sedia ada diubah.
-- Selamat dijalankan semula (IF NOT EXISTS).
--
-- SELEPAS jalan, dari folder ekokot6:
--   npx prisma migrate resolve --applied "20261006120000_add_ecert_program"

CREATE TABLE IF NOT EXISTS "g5_p4"."ProgramECert" (
    "id" TEXT NOT NULL,
    "namaProgram" TEXT NOT NULL,
    "tarikh" TIMESTAMP(3) NOT NULL,
    "peringkat" TEXT NOT NULL,
    "tempat" TEXT,
    "tahunSiri" INTEGER NOT NULL,
    "namaPenandatangan" TEXT,
    "jawatanPenandatangan" TEXT,
    "dibuatOleh" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ProgramECert_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "g5_p4"."PesertaProgram" (
    "id" TEXT NOT NULL,
    "programId" TEXT NOT NULL,
    "nama" TEXT NOT NULL,
    "noKp" TEXT NOT NULL,
    "idMoeis" TEXT,
    "kodSekolah" TEXT,
    "namaSekolah" TEXT,
    "namaKelas" TEXT,
    "peranan" TEXT NOT NULL DEFAULT 'Peserta',
    "noSiri" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PesertaProgram_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "PesertaProgram_programId_fkey" FOREIGN KEY ("programId")
        REFERENCES "g5_p4"."ProgramECert"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "PesertaProgram_noSiri_key" ON "g5_p4"."PesertaProgram"("noSiri");
CREATE INDEX IF NOT EXISTS "PesertaProgram_noKp_idx" ON "g5_p4"."PesertaProgram"("noKp");
CREATE UNIQUE INDEX IF NOT EXISTS "PesertaProgram_programId_noKp_key" ON "g5_p4"."PesertaProgram"("programId", "noKp");

-- Aplikasi (g5_p4_user) perlu baca/tulis jadual baharu ini.
GRANT SELECT, INSERT, UPDATE, DELETE ON "g5_p4"."ProgramECert", "g5_p4"."PesertaProgram" TO g5_p4_user;

-- Pengesahan selepas jalan (jangkaan: 2 baris dipulangkan)
-- SELECT table_name FROM information_schema.tables
-- WHERE table_schema='g5_p4' AND table_name IN ('ProgramECert','PesertaProgram');
