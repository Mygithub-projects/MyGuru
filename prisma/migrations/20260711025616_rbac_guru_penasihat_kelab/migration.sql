-- CreateTable
CREATE TABLE "GuruPenasihatKelab" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "guruId" TEXT NOT NULL,
    "namaUnit" TEXT NOT NULL,
    "jenisKoko" TEXT NOT NULL,
    "peranan" TEXT NOT NULL DEFAULT 'Penasihat',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "GuruPenasihatKelab_guruId_fkey" FOREIGN KEY ("guruId") REFERENCES "Guru" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "GuruPenasihatKelab_namaUnit_idx" ON "GuruPenasihatKelab"("namaUnit");

-- CreateIndex
CREATE UNIQUE INDEX "GuruPenasihatKelab_guruId_namaUnit_key" ON "GuruPenasihatKelab"("guruId", "namaUnit");
