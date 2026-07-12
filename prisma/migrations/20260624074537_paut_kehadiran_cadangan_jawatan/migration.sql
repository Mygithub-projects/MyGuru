-- CreateTable
CREATE TABLE "CadanganJawatan" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "pelajarId" TEXT NOT NULL,
    "jenisKoko" TEXT NOT NULL,
    "jawatanBaru" TEXT NOT NULL,
    "markahJawatan" REAL NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Pending',
    "dicadangOlehId" TEXT,
    "guruId" TEXT,
    "komen" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "tarikhProses" DATETIME,
    CONSTRAINT "CadanganJawatan_pelajarId_fkey" FOREIGN KEY ("pelajarId") REFERENCES "Pelajar" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_LaporanMingguan" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "jenisKoko" TEXT NOT NULL,
    "namaUnit" TEXT,
    "tarikh" DATETIME NOT NULL,
    "masa" TEXT,
    "aktiviti" TEXT NOT NULL,
    "lampiran" TEXT,
    "setiausahaId" TEXT NOT NULL,
    "statusSemakan" TEXT NOT NULL DEFAULT 'Draft',
    "komenGuru" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "sesiId" TEXT,
    CONSTRAINT "LaporanMingguan_setiausahaId_fkey" FOREIGN KEY ("setiausahaId") REFERENCES "Pelajar" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "LaporanMingguan_sesiId_fkey" FOREIGN KEY ("sesiId") REFERENCES "SesiKehadiran" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_LaporanMingguan" ("aktiviti", "createdAt", "id", "jenisKoko", "komenGuru", "lampiran", "masa", "namaUnit", "setiausahaId", "statusSemakan", "tarikh", "updatedAt") SELECT "aktiviti", "createdAt", "id", "jenisKoko", "komenGuru", "lampiran", "masa", "namaUnit", "setiausahaId", "statusSemakan", "tarikh", "updatedAt" FROM "LaporanMingguan";
DROP TABLE "LaporanMingguan";
ALTER TABLE "new_LaporanMingguan" RENAME TO "LaporanMingguan";
CREATE INDEX "LaporanMingguan_statusSemakan_idx" ON "LaporanMingguan"("statusSemakan");
CREATE TABLE "new_LaporanProjek" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "namaProjek" TEXT NOT NULL,
    "jenisKoko" TEXT,
    "namaUnit" TEXT,
    "setiausahaId" TEXT NOT NULL,
    "failKertasKerja" TEXT,
    "failLaporanImpak" TEXT,
    "kewangan" TEXT,
    "kekuatan" TEXT,
    "kelemahan" TEXT,
    "statusPengesahan" TEXT NOT NULL DEFAULT 'Draft',
    "komenGuru" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "sesiId" TEXT,
    CONSTRAINT "LaporanProjek_setiausahaId_fkey" FOREIGN KEY ("setiausahaId") REFERENCES "Pelajar" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "LaporanProjek_sesiId_fkey" FOREIGN KEY ("sesiId") REFERENCES "SesiKehadiran" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_LaporanProjek" ("createdAt", "failKertasKerja", "failLaporanImpak", "id", "jenisKoko", "kekuatan", "kelemahan", "kewangan", "komenGuru", "namaProjek", "namaUnit", "setiausahaId", "statusPengesahan", "updatedAt") SELECT "createdAt", "failKertasKerja", "failLaporanImpak", "id", "jenisKoko", "kekuatan", "kelemahan", "kewangan", "komenGuru", "namaProjek", "namaUnit", "setiausahaId", "statusPengesahan", "updatedAt" FROM "LaporanProjek";
DROP TABLE "LaporanProjek";
ALTER TABLE "new_LaporanProjek" RENAME TO "LaporanProjek";
CREATE INDEX "LaporanProjek_statusPengesahan_idx" ON "LaporanProjek"("statusPengesahan");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "CadanganJawatan_status_idx" ON "CadanganJawatan"("status");
