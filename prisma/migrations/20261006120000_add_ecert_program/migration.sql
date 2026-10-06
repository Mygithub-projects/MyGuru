-- CreateTable
CREATE TABLE "ProgramECert" (
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

-- CreateTable
CREATE TABLE "PesertaProgram" (
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

    CONSTRAINT "PesertaProgram_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PesertaProgram_noSiri_key" ON "PesertaProgram"("noSiri");

-- CreateIndex
CREATE INDEX "PesertaProgram_noKp_idx" ON "PesertaProgram"("noKp");

-- CreateIndex
CREATE UNIQUE INDEX "PesertaProgram_programId_noKp_key" ON "PesertaProgram"("programId", "noKp");

-- AddForeignKey
ALTER TABLE "PesertaProgram" ADD CONSTRAINT "PesertaProgram_programId_fkey" FOREIGN KEY ("programId") REFERENCES "ProgramECert"("id") ON DELETE CASCADE ON UPDATE CASCADE;
