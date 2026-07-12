-- CreateTable
CREATE TABLE "CadanganAgent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "jenis" TEXT NOT NULL,
    "rujukanId" TEXT NOT NULL,
    "keputusan" TEXT,
    "justifikasi" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Pending',
    "dicadangOleh" TEXT NOT NULL DEFAULT 'AGENT',
    "untukSemakan" TEXT NOT NULL,
    "dicipta" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE INDEX "CadanganAgent_status_idx" ON "CadanganAgent"("status");

-- CreateIndex
CREATE INDEX "CadanganAgent_untukSemakan_idx" ON "CadanganAgent"("untukSemakan");
