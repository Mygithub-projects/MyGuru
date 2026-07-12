-- CreateTable
CREATE TABLE "SesiKehadiran" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "jenisKoko" TEXT NOT NULL,
    "namaUnit" TEXT NOT NULL,
    "tarikh" DATETIME NOT NULL,
    "bilPerjumpaan" INTEGER NOT NULL,
    "token" TEXT NOT NULL,
    "dibuka" BOOLEAN NOT NULL DEFAULT true,
    "dibuatOlehId" TEXT,
    "disahkan" BOOLEAN NOT NULL DEFAULT false,
    "guruId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Notifikasi" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "tajuk" TEXT NOT NULL,
    "mesej" TEXT NOT NULL,
    "jenis" TEXT NOT NULL DEFAULT 'info',
    "pautan" TEXT,
    "dibaca" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Kehadiran" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "pelajarId" TEXT NOT NULL,
    "jenisKoko" TEXT NOT NULL,
    "namaUnit" TEXT,
    "tarikh" DATETIME NOT NULL,
    "bilPerjumpaan" INTEGER NOT NULL,
    "statusHadir" BOOLEAN NOT NULL DEFAULT false,
    "disahkan" BOOLEAN NOT NULL DEFAULT false,
    "ditandaOlehId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sesiId" TEXT,
    CONSTRAINT "Kehadiran_pelajarId_fkey" FOREIGN KEY ("pelajarId") REFERENCES "Pelajar" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Kehadiran_sesiId_fkey" FOREIGN KEY ("sesiId") REFERENCES "SesiKehadiran" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Kehadiran" ("bilPerjumpaan", "createdAt", "disahkan", "ditandaOlehId", "id", "jenisKoko", "namaUnit", "pelajarId", "statusHadir", "tarikh") SELECT "bilPerjumpaan", "createdAt", "disahkan", "ditandaOlehId", "id", "jenisKoko", "namaUnit", "pelajarId", "statusHadir", "tarikh" FROM "Kehadiran";
DROP TABLE "Kehadiran";
ALTER TABLE "new_Kehadiran" RENAME TO "Kehadiran";
CREATE INDEX "Kehadiran_pelajarId_jenisKoko_idx" ON "Kehadiran"("pelajarId", "jenisKoko");
CREATE UNIQUE INDEX "Kehadiran_pelajarId_namaUnit_bilPerjumpaan_key" ON "Kehadiran"("pelajarId", "namaUnit", "bilPerjumpaan");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "SesiKehadiran_token_key" ON "SesiKehadiran"("token");

-- CreateIndex
CREATE INDEX "SesiKehadiran_jenisKoko_idx" ON "SesiKehadiran"("jenisKoko");

-- CreateIndex
CREATE UNIQUE INDEX "SesiKehadiran_namaUnit_bilPerjumpaan_key" ON "SesiKehadiran"("namaUnit", "bilPerjumpaan");

-- CreateIndex
CREATE INDEX "Notifikasi_userId_dibaca_idx" ON "Notifikasi"("userId", "dibaca");
