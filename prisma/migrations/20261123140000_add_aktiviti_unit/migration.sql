-- CreateTable
CREATE TABLE "AktivitiUnit" (
    "id" TEXT NOT NULL,
    "namaAktiviti" TEXT NOT NULL,
    "peringkat" TEXT NOT NULL,
    "tarikh" TIMESTAMP(3),
    "namaUnit" TEXT NOT NULL,
    "jenisKoko" TEXT NOT NULL,
    "kohort" TEXT,
    "laporan" TEXT,
    "lampiranEviden" TEXT,
    "setiausahaId" TEXT NOT NULL,
    "statusPengesahan" TEXT NOT NULL DEFAULT 'Pending',
    "komenGuru" TEXT,
    "disahkanOlehId" TEXT,
    "tarikhSahkan" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AktivitiUnit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AktivitiUnitPeserta" (
    "id" TEXT NOT NULL,
    "aktivitiId" TEXT NOT NULL,
    "pelajarId" TEXT NOT NULL,
    "kedudukan" TEXT NOT NULL DEFAULT 'Penyertaan',
    "markahPenglibatan" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "markahPencapaian" DOUBLE PRECISION NOT NULL DEFAULT 0,

    CONSTRAINT "AktivitiUnitPeserta_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AktivitiUnit_namaUnit_statusPengesahan_idx" ON "AktivitiUnit"("namaUnit", "statusPengesahan");

-- CreateIndex
CREATE INDEX "AktivitiUnitPeserta_pelajarId_idx" ON "AktivitiUnitPeserta"("pelajarId");

-- CreateIndex
CREATE UNIQUE INDEX "AktivitiUnitPeserta_aktivitiId_pelajarId_key" ON "AktivitiUnitPeserta"("aktivitiId", "pelajarId");

-- AddForeignKey
ALTER TABLE "AktivitiUnit" ADD CONSTRAINT "AktivitiUnit_setiausahaId_fkey" FOREIGN KEY ("setiausahaId") REFERENCES "Pelajar"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AktivitiUnitPeserta" ADD CONSTRAINT "AktivitiUnitPeserta_aktivitiId_fkey" FOREIGN KEY ("aktivitiId") REFERENCES "AktivitiUnit"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AktivitiUnitPeserta" ADD CONSTRAINT "AktivitiUnitPeserta_pelajarId_fkey" FOREIGN KEY ("pelajarId") REFERENCES "Pelajar"("id") ON DELETE CASCADE ON UPDATE CASCADE;

