-- AlterTable
ALTER TABLE "LaporanMingguan" ADD COLUMN "disahkanOleh" TEXT,
ADD COLUMN "tarikhSahkan" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "LaporanProjek" ADD COLUMN "disahkanOleh" TEXT,
ADD COLUMN "tarikhSahkan" TIMESTAMP(3);
