-- CreateTable
CREATE TABLE "KehadiranGuru" (
    "id" TEXT NOT NULL,
    "guruId" TEXT NOT NULL,
    "sesiId" TEXT NOT NULL,
    "statusHadir" BOOLEAN NOT NULL DEFAULT true,
    "catatan" TEXT,
    "statusSemakan" TEXT NOT NULL DEFAULT 'Pending',
    "disemakOlehId" TEXT,
    "tarikhSemak" TIMESTAMP(3),
    "komenAdmin" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "KehadiranGuru_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "KehadiranGuru_statusSemakan_idx" ON "KehadiranGuru"("statusSemakan");

-- CreateIndex
CREATE UNIQUE INDEX "KehadiranGuru_guruId_sesiId_key" ON "KehadiranGuru"("guruId", "sesiId");

-- AddForeignKey
ALTER TABLE "KehadiranGuru" ADD CONSTRAINT "KehadiranGuru_guruId_fkey" FOREIGN KEY ("guruId") REFERENCES "Guru"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KehadiranGuru" ADD CONSTRAINT "KehadiranGuru_sesiId_fkey" FOREIGN KEY ("sesiId") REFERENCES "SesiKehadiran"("id") ON DELETE CASCADE ON UPDATE CASCADE;
