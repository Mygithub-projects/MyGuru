-- AlterTable: simpan guru pengesah supaya guru itu boleh Batal pengesahan
ALTER TABLE "Pencapaian" ADD COLUMN "disahkanOlehId" TEXT;
ALTER TABLE "LaporanMingguan" ADD COLUMN "disahkanOlehId" TEXT;
ALTER TABLE "LaporanProjek" ADD COLUMN "disahkanOlehId" TEXT;
