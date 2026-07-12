-- CreateTable
CREATE TABLE "LogImport" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "jenis" TEXT NOT NULL,
    "namaFail" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Preview',
    "dimuatOlehId" TEXT,
    "jumlah" INTEGER NOT NULL DEFAULT 0,
    "baharu" INTEGER NOT NULL DEFAULT 0,
    "berubah" INTEGER NOT NULL DEFAULT 0,
    "ralatCount" INTEGER NOT NULL DEFAULT 0,
    "payloadJson" TEXT NOT NULL,
    "diffJson" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "appliedAt" DATETIME
);

-- CreateIndex
CREATE INDEX "LogImport_status_idx" ON "LogImport"("status");

-- CreateIndex
CREATE INDEX "LogImport_createdAt_idx" ON "LogImport"("createdAt");
