-- CreateTable
CREATE TABLE "Kohort" (
    "id" TEXT NOT NULL,
    "nama" TEXT NOT NULL,
    "tarikhMula" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Aktif',
    "tarikhTamat" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Kohort_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Kohort_nama_key" ON "Kohort"("nama");

-- Daftar kohort sedia ada (tarikh mula = rekod pelajar terawal; Admin boleh ubah).
INSERT INTO "Kohort" ("id", "nama", "tarikhMula", "status")
SELECT 'kohort_' || regexp_replace(lower("kohort"), '[^a-z0-9]', '', 'g'), "kohort", MIN("createdAt"), 'Aktif'
FROM "Pelajar" WHERE "kohort" IS NOT NULL GROUP BY "kohort";

-- AlterTable: sesi kehadiran berasingan setiap kohort
ALTER TABLE "SesiKehadiran" ADD COLUMN "kohort" TEXT NOT NULL DEFAULT '';
UPDATE "SesiKehadiran" SET "kohort" = 'STPM 2027' WHERE "kohort" = '';

-- DropIndex
DROP INDEX "SesiKehadiran_namaUnit_bilPerjumpaan_key";

-- CreateIndex
CREATE UNIQUE INDEX "SesiKehadiran_kohort_namaUnit_bilPerjumpaan_key" ON "SesiKehadiran"("kohort", "namaUnit", "bilPerjumpaan");
