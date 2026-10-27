-- AlterTable
ALTER TABLE "LaporanMingguan" ADD COLUMN "namaProgram" TEXT,
ADD COLUMN "peringkat" TEXT;

-- AlterTable
ALTER TABLE "LaporanProjek" ADD COLUMN "tarikh" TIMESTAMP(3),
ADD COLUMN "laporan" TEXT;
