-- AlterTable
ALTER TABLE "AktivitiLuar" ADD COLUMN     "guruPengiringId" TEXT,
ADD COLUMN     "kedudukan" TEXT,
ADD COLUMN     "markahPencapaian" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "markahPenglibatan" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- CreateIndex
CREATE INDEX "AktivitiLuar_guruPengiringId_idx" ON "AktivitiLuar"("guruPengiringId");

-- AddForeignKey
ALTER TABLE "AktivitiLuar" ADD CONSTRAINT "AktivitiLuar_guruPengiringId_fkey" FOREIGN KEY ("guruPengiringId") REFERENCES "Guru"("id") ON DELETE SET NULL ON UPDATE CASCADE;

