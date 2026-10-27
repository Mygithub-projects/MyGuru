-- AlterTable
ALTER TABLE "Pelajar" ADD COLUMN "kohort" TEXT;

-- Data sedia ada ditag sebagai kohort STPM 2027 (arahan pentadbir).
UPDATE "Pelajar" SET "kohort" = 'STPM 2027' WHERE "kohort" IS NULL;

-- CreateIndex
CREATE INDEX "Pelajar_kohort_idx" ON "Pelajar"("kohort");
