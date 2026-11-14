-- AlterTable
ALTER TABLE "LaporanProjek" ADD COLUMN     "projekId" TEXT;

-- CreateTable
CREATE TABLE "Projek" (
    "id" TEXT NOT NULL,
    "nama" TEXT NOT NULL,
    "kohort" TEXT NOT NULL DEFAULT '',
    "units" TEXT[],
    "dibuatOlehId" TEXT,
    "dibuatOleh" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Projek_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProjekTag" (
    "id" TEXT NOT NULL,
    "projekId" TEXT NOT NULL,
    "pelajarId" TEXT NOT NULL,
    "peranan" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProjekTag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProjekPeserta" (
    "id" TEXT NOT NULL,
    "laporanId" TEXT NOT NULL,
    "pelajarId" TEXT NOT NULL,
    "jawatan" TEXT NOT NULL,
    "unitKredit" TEXT[],

    CONSTRAINT "ProjekPeserta_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Projek_kohort_idx" ON "Projek"("kohort");

-- CreateIndex
CREATE INDEX "ProjekTag_pelajarId_idx" ON "ProjekTag"("pelajarId");

-- CreateIndex
CREATE UNIQUE INDEX "ProjekTag_projekId_pelajarId_key" ON "ProjekTag"("projekId", "pelajarId");

-- CreateIndex
CREATE INDEX "ProjekPeserta_pelajarId_idx" ON "ProjekPeserta"("pelajarId");

-- CreateIndex
CREATE UNIQUE INDEX "ProjekPeserta_laporanId_pelajarId_key" ON "ProjekPeserta"("laporanId", "pelajarId");

-- CreateIndex
CREATE INDEX "LaporanProjek_projekId_idx" ON "LaporanProjek"("projekId");

-- AddForeignKey
ALTER TABLE "LaporanProjek" ADD CONSTRAINT "LaporanProjek_projekId_fkey" FOREIGN KEY ("projekId") REFERENCES "Projek"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjekTag" ADD CONSTRAINT "ProjekTag_projekId_fkey" FOREIGN KEY ("projekId") REFERENCES "Projek"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjekTag" ADD CONSTRAINT "ProjekTag_pelajarId_fkey" FOREIGN KEY ("pelajarId") REFERENCES "Pelajar"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjekPeserta" ADD CONSTRAINT "ProjekPeserta_laporanId_fkey" FOREIGN KEY ("laporanId") REFERENCES "LaporanProjek"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjekPeserta" ADD CONSTRAINT "ProjekPeserta_pelajarId_fkey" FOREIGN KEY ("pelajarId") REFERENCES "Pelajar"("id") ON DELETE CASCADE ON UPDATE CASCADE;

