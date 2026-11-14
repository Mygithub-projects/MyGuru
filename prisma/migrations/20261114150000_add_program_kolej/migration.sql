-- CreateTable
CREATE TABLE "ProgramKolej" (
    "id" TEXT NOT NULL,
    "nama" TEXT NOT NULL,
    "tarikh" TIMESTAMP(3),
    "peringkat" TEXT NOT NULL,
    "kohort" TEXT NOT NULL DEFAULT '',
    "dibuatOleh" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProgramKolej_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProgramKolejPeserta" (
    "id" TEXT NOT NULL,
    "programId" TEXT NOT NULL,
    "pelajarId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProgramKolejPeserta_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ProgramKolej_kohort_idx" ON "ProgramKolej"("kohort");

-- CreateIndex
CREATE INDEX "ProgramKolejPeserta_pelajarId_idx" ON "ProgramKolejPeserta"("pelajarId");

-- CreateIndex
CREATE UNIQUE INDEX "ProgramKolejPeserta_programId_pelajarId_key" ON "ProgramKolejPeserta"("programId", "pelajarId");

-- AddForeignKey
ALTER TABLE "ProgramKolejPeserta" ADD CONSTRAINT "ProgramKolejPeserta_programId_fkey" FOREIGN KEY ("programId") REFERENCES "ProgramKolej"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProgramKolejPeserta" ADD CONSTRAINT "ProgramKolejPeserta_pelajarId_fkey" FOREIGN KEY ("pelajarId") REFERENCES "Pelajar"("id") ON DELETE CASCADE ON UPDATE CASCADE;

