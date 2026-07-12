-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "username" TEXT NOT NULL,
    "email" TEXT,
    "passwordHash" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "mustChangePw" BOOLEAN NOT NULL DEFAULT true,
    "statusAktif" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "pelajarId" TEXT,
    "guruId" TEXT,
    CONSTRAINT "User_pelajarId_fkey" FOREIGN KEY ("pelajarId") REFERENCES "Pelajar" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "User_guruId_fkey" FOREIGN KEY ("guruId") REFERENCES "Guru" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Guru" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nama" TEXT NOT NULL,
    "noIc" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "jawatanKoko" TEXT NOT NULL,
    "kelabDiselia" TEXT,
    "sukanDiselia" TEXT,
    "badanDiselia" TEXT,
    "statusAktif" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Pelajar" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nama" TEXT NOT NULL,
    "noIc" TEXT NOT NULL,
    "kelasT6" TEXT,
    "markahPajskT5" REAL,
    "peratusPajskT5" REAL,
    "markahPajskT6" REAL,
    "peratusPajskT6" REAL,
    "komitmen" REAL NOT NULL DEFAULT 0,
    "khidmatSumbangan" REAL NOT NULL DEFAULT 0,
    "markahEkstra" REAL NOT NULL DEFAULT 0,
    "jantina" TEXT,
    "kaum" TEXT,
    "agama" TEXT,
    "subRole" TEXT NOT NULL DEFAULT 'Pelajar',
    "statusAktif" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Kokurikulum" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "pelajarId" TEXT NOT NULL,
    "jenisKoko" TEXT NOT NULL,
    "namaUnitT5" TEXT,
    "jawatanT5" TEXT,
    "peringkatT5" TEXT,
    "markahJawatanT5" REAL,
    "markahPeringkatT5" REAL,
    "namaUnitT6" TEXT,
    "jawatanT6" TEXT,
    "peringkatT6" TEXT,
    "markahJawatanT6" REAL,
    "markahPeringkatT6" REAL,
    "statusPertukaran" TEXT NOT NULL DEFAULT 'None',
    "tarikhKemaskini" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "guruLulusId" TEXT,
    CONSTRAINT "Kokurikulum_pelajarId_fkey" FOREIGN KEY ("pelajarId") REFERENCES "Pelajar" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Kokurikulum_guruLulusId_fkey" FOREIGN KEY ("guruLulusId") REFERENCES "Guru" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "TetapanMarkah" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "kategori" TEXT NOT NULL,
    "namaItem" TEXT NOT NULL,
    "nilaiMarkah" REAL NOT NULL,
    "markahPenuh" REAL NOT NULL DEFAULT 110
);

-- CreateTable
CREATE TABLE "LogPertukaran" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "pelajarId" TEXT NOT NULL,
    "jenisKoko" TEXT NOT NULL,
    "unitLama" TEXT,
    "unitBaru" TEXT NOT NULL,
    "sebab" TEXT,
    "status" TEXT NOT NULL DEFAULT 'Pending',
    "tarikhMohon" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "tarikhLulus" DATETIME,
    "komenGuru" TEXT,
    "guruId" TEXT,
    CONSTRAINT "LogPertukaran_pelajarId_fkey" FOREIGN KEY ("pelajarId") REFERENCES "Pelajar" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "LogPertukaran_guruId_fkey" FOREIGN KEY ("guruId") REFERENCES "Guru" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Kehadiran" (
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
    CONSTRAINT "Kehadiran_pelajarId_fkey" FOREIGN KEY ("pelajarId") REFERENCES "Pelajar" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "LaporanMingguan" (
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
    CONSTRAINT "LaporanMingguan_setiausahaId_fkey" FOREIGN KEY ("setiausahaId") REFERENCES "Pelajar" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "LaporanProjek" (
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
    CONSTRAINT "LaporanProjek_setiausahaId_fkey" FOREIGN KEY ("setiausahaId") REFERENCES "Pelajar" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Pencapaian" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "pelajarId" TEXT NOT NULL,
    "namaPencapaian" TEXT NOT NULL,
    "kategori" TEXT,
    "peringkat" TEXT,
    "lampiranEviden" TEXT,
    "statusSemakan" TEXT NOT NULL DEFAULT 'Pending',
    "markah" REAL NOT NULL DEFAULT 0,
    "komenGuru" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Pencapaian_pelajarId_fkey" FOREIGN KEY ("pelajarId") REFERENCES "Pelajar" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AktivitiLuar" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "pelajarId" TEXT NOT NULL,
    "namaAktiviti" TEXT NOT NULL,
    "peringkat" TEXT NOT NULL,
    "tarikh" DATETIME,
    "lampiranSurat" TEXT,
    "lampiranSijil" TEXT,
    "statusPengesahan" TEXT NOT NULL DEFAULT 'Pending',
    "markahLuar" REAL NOT NULL DEFAULT 0,
    "komenGuru" TEXT,
    "noSiriECert" TEXT,
    "tarikhJanaECert" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AktivitiLuar_pelajarId_fkey" FOREIGN KEY ("pelajarId") REFERENCES "Pelajar" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_pelajarId_key" ON "User"("pelajarId");

-- CreateIndex
CREATE UNIQUE INDEX "User_guruId_key" ON "User"("guruId");

-- CreateIndex
CREATE UNIQUE INDEX "Guru_noIc_key" ON "Guru"("noIc");

-- CreateIndex
CREATE UNIQUE INDEX "Guru_email_key" ON "Guru"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Pelajar_noIc_key" ON "Pelajar"("noIc");

-- CreateIndex
CREATE INDEX "Kokurikulum_jenisKoko_idx" ON "Kokurikulum"("jenisKoko");

-- CreateIndex
CREATE UNIQUE INDEX "Kokurikulum_pelajarId_jenisKoko_key" ON "Kokurikulum"("pelajarId", "jenisKoko");

-- CreateIndex
CREATE UNIQUE INDEX "TetapanMarkah_kategori_namaItem_key" ON "TetapanMarkah"("kategori", "namaItem");

-- CreateIndex
CREATE INDEX "LogPertukaran_status_idx" ON "LogPertukaran"("status");

-- CreateIndex
CREATE INDEX "Kehadiran_pelajarId_jenisKoko_idx" ON "Kehadiran"("pelajarId", "jenisKoko");

-- CreateIndex
CREATE INDEX "LaporanMingguan_statusSemakan_idx" ON "LaporanMingguan"("statusSemakan");

-- CreateIndex
CREATE INDEX "LaporanProjek_statusPengesahan_idx" ON "LaporanProjek"("statusPengesahan");

-- CreateIndex
CREATE INDEX "Pencapaian_statusSemakan_idx" ON "Pencapaian"("statusSemakan");

-- CreateIndex
CREATE UNIQUE INDEX "AktivitiLuar_noSiriECert_key" ON "AktivitiLuar"("noSiriECert");

-- CreateIndex
CREATE INDEX "AktivitiLuar_statusPengesahan_idx" ON "AktivitiLuar"("statusPengesahan");
