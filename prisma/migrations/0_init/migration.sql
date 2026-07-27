-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "email" TEXT,
    "passwordHash" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "mustChangePw" BOOLEAN NOT NULL DEFAULT true,
    "statusAktif" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "pelajarId" TEXT,
    "guruId" TEXT,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Guru" (
    "id" TEXT NOT NULL,
    "nama" TEXT NOT NULL,
    "noIc" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "jawatanKoko" TEXT NOT NULL,
    "kelabDiselia" TEXT,
    "sukanDiselia" TEXT,
    "badanDiselia" TEXT,
    "statusAktif" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Guru_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GuruPenasihatKelab" (
    "id" TEXT NOT NULL,
    "guruId" TEXT NOT NULL,
    "namaUnit" TEXT NOT NULL,
    "jenisKoko" TEXT NOT NULL,
    "peranan" TEXT NOT NULL DEFAULT 'Penasihat',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GuruPenasihatKelab_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Pelajar" (
    "id" TEXT NOT NULL,
    "nama" TEXT NOT NULL,
    "noIc" TEXT NOT NULL,
    "kelasT6" TEXT,
    "markahPajskT6" DOUBLE PRECISION,
    "peratusPajskT6" DOUBLE PRECISION,
    "markahKehadiran" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "markahPenglibatan" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "markahPencapaian" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "markahProjekJawatan" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "markahProjekPeringkat" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "markahEkstra" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "gredPajskT6" TEXT,
    "komitmen" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "khidmatSumbangan" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "jantina" TEXT,
    "kaum" TEXT,
    "agama" TEXT,
    "email" TEXT,
    "noTel" TEXT,
    "telegramChatId" TEXT,
    "subRole" TEXT NOT NULL DEFAULT 'Pelajar',
    "statusAktif" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Pelajar_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CadanganJawatan" (
    "id" TEXT NOT NULL,
    "pelajarId" TEXT NOT NULL,
    "jenisKoko" TEXT NOT NULL,
    "jawatanBaru" TEXT NOT NULL,
    "markahJawatan" DOUBLE PRECISION NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Pending',
    "dicadangOlehId" TEXT,
    "guruId" TEXT,
    "komen" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "tarikhProses" TIMESTAMP(3),

    CONSTRAINT "CadanganJawatan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CadanganAgent" (
    "id" TEXT NOT NULL,
    "jenis" TEXT NOT NULL,
    "rujukanId" TEXT NOT NULL,
    "keputusan" TEXT,
    "justifikasi" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Pending',
    "dicadangOleh" TEXT NOT NULL DEFAULT 'AGENT',
    "untukSemakan" TEXT NOT NULL,
    "dicipta" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "diprosesOleh" TEXT,
    "tarikhProses" TIMESTAMP(3),
    "komen" TEXT,

    CONSTRAINT "CadanganAgent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Kokurikulum" (
    "id" TEXT NOT NULL,
    "pelajarId" TEXT NOT NULL,
    "jenisKoko" TEXT NOT NULL,
    "namaUnitT5" TEXT,
    "jawatanT5" TEXT,
    "peringkatT5" TEXT,
    "markahJawatanT5" DOUBLE PRECISION,
    "markahPeringkatT5" DOUBLE PRECISION,
    "namaUnitT6" TEXT,
    "jawatanT6" TEXT,
    "peringkatT6" TEXT,
    "markahJawatanT6" DOUBLE PRECISION,
    "markahPeringkatT6" DOUBLE PRECISION,
    "statusPertukaran" TEXT NOT NULL DEFAULT 'None',
    "tarikhKemaskini" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "guruLulusId" TEXT,

    CONSTRAINT "Kokurikulum_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TetapanMarkah" (
    "id" TEXT NOT NULL,
    "kategori" TEXT NOT NULL,
    "namaItem" TEXT NOT NULL,
    "nilaiMarkah" DOUBLE PRECISION NOT NULL,
    "markahPenuh" DOUBLE PRECISION NOT NULL DEFAULT 100,

    CONSTRAINT "TetapanMarkah_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LogPertukaran" (
    "id" TEXT NOT NULL,
    "pelajarId" TEXT NOT NULL,
    "jenisKoko" TEXT NOT NULL,
    "unitLama" TEXT,
    "unitBaru" TEXT NOT NULL,
    "sebab" TEXT,
    "status" TEXT NOT NULL DEFAULT 'Pending',
    "tarikhMohon" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "tarikhLulus" TIMESTAMP(3),
    "komenGuru" TEXT,
    "guruId" TEXT,

    CONSTRAINT "LogPertukaran_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SesiKehadiran" (
    "id" TEXT NOT NULL,
    "jenisKoko" TEXT NOT NULL,
    "namaUnit" TEXT NOT NULL,
    "tarikh" TIMESTAMP(3) NOT NULL,
    "bilPerjumpaan" INTEGER NOT NULL,
    "token" TEXT NOT NULL,
    "dibuka" BOOLEAN NOT NULL DEFAULT true,
    "dibuatOlehId" TEXT,
    "disahkan" BOOLEAN NOT NULL DEFAULT false,
    "guruId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SesiKehadiran_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Kehadiran" (
    "id" TEXT NOT NULL,
    "pelajarId" TEXT NOT NULL,
    "jenisKoko" TEXT NOT NULL,
    "namaUnit" TEXT,
    "tarikh" TIMESTAMP(3) NOT NULL,
    "bilPerjumpaan" INTEGER NOT NULL,
    "statusHadir" BOOLEAN NOT NULL DEFAULT false,
    "disahkan" BOOLEAN NOT NULL DEFAULT false,
    "ditandaOlehId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sesiId" TEXT,

    CONSTRAINT "Kehadiran_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TetapanSijil" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "institusi" TEXT NOT NULL DEFAULT 'KTE (Prauniversiti) Desa Mahkota',
    "tajukSijil" TEXT NOT NULL DEFAULT 'SIJIL PENGHARGAAN KOKURIKULUM',
    "namaPenandatangan" TEXT NOT NULL DEFAULT '',
    "jawatanPenandatangan" TEXT NOT NULL DEFAULT 'Penyelaras Kokurikulum',
    "teksCop" TEXT NOT NULL DEFAULT '',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TetapanSijil_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LogImport" (
    "id" TEXT NOT NULL,
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
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "appliedAt" TIMESTAMP(3),

    CONSTRAINT "LogImport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notifikasi" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tajuk" TEXT NOT NULL,
    "mesej" TEXT NOT NULL,
    "jenis" TEXT NOT NULL DEFAULT 'info',
    "pautan" TEXT,
    "dibaca" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notifikasi_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LaporanMingguan" (
    "id" TEXT NOT NULL,
    "jenisKoko" TEXT NOT NULL,
    "namaUnit" TEXT,
    "tarikh" TIMESTAMP(3) NOT NULL,
    "masa" TEXT,
    "aktiviti" TEXT NOT NULL,
    "lampiran" TEXT,
    "setiausahaId" TEXT NOT NULL,
    "statusSemakan" TEXT NOT NULL DEFAULT 'Draft',
    "komenGuru" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "sesiId" TEXT,

    CONSTRAINT "LaporanMingguan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LaporanProjek" (
    "id" TEXT NOT NULL,
    "namaProjek" TEXT NOT NULL,
    "jenisKoko" TEXT,
    "namaUnit" TEXT,
    "jawatanProjek" TEXT,
    "peringkatProjek" TEXT,
    "setiausahaId" TEXT NOT NULL,
    "failKertasKerja" TEXT,
    "failLaporanImpak" TEXT,
    "kewangan" TEXT,
    "kekuatan" TEXT,
    "kelemahan" TEXT,
    "statusPengesahan" TEXT NOT NULL DEFAULT 'Draft',
    "komenGuru" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "sesiId" TEXT,

    CONSTRAINT "LaporanProjek_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Pencapaian" (
    "id" TEXT NOT NULL,
    "pelajarId" TEXT NOT NULL,
    "namaPencapaian" TEXT NOT NULL,
    "kategori" TEXT,
    "peringkat" TEXT,
    "kedudukan" TEXT,
    "lampiranEviden" TEXT,
    "statusSemakan" TEXT NOT NULL DEFAULT 'Pending',
    "markah" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "komenGuru" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Pencapaian_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AktivitiLuar" (
    "id" TEXT NOT NULL,
    "pelajarId" TEXT NOT NULL,
    "namaAktiviti" TEXT NOT NULL,
    "peringkat" TEXT NOT NULL,
    "tarikh" TIMESTAMP(3),
    "lampiranSurat" TEXT,
    "lampiranSijil" TEXT,
    "statusPengesahan" TEXT NOT NULL DEFAULT 'Pending',
    "markahLuar" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "komenGuru" TEXT,
    "noSiriECert" TEXT,
    "tarikhJanaECert" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AktivitiLuar_pkey" PRIMARY KEY ("id")
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
CREATE INDEX "GuruPenasihatKelab_namaUnit_idx" ON "GuruPenasihatKelab"("namaUnit");

-- CreateIndex
CREATE UNIQUE INDEX "GuruPenasihatKelab_guruId_namaUnit_key" ON "GuruPenasihatKelab"("guruId", "namaUnit");

-- CreateIndex
CREATE UNIQUE INDEX "Pelajar_noIc_key" ON "Pelajar"("noIc");

-- CreateIndex
CREATE INDEX "CadanganJawatan_status_idx" ON "CadanganJawatan"("status");

-- CreateIndex
CREATE INDEX "CadanganAgent_status_idx" ON "CadanganAgent"("status");

-- CreateIndex
CREATE INDEX "CadanganAgent_untukSemakan_idx" ON "CadanganAgent"("untukSemakan");

-- CreateIndex
CREATE INDEX "Kokurikulum_jenisKoko_idx" ON "Kokurikulum"("jenisKoko");

-- CreateIndex
CREATE UNIQUE INDEX "Kokurikulum_pelajarId_jenisKoko_key" ON "Kokurikulum"("pelajarId", "jenisKoko");

-- CreateIndex
CREATE UNIQUE INDEX "TetapanMarkah_kategori_namaItem_key" ON "TetapanMarkah"("kategori", "namaItem");

-- CreateIndex
CREATE INDEX "LogPertukaran_status_idx" ON "LogPertukaran"("status");

-- CreateIndex
CREATE UNIQUE INDEX "SesiKehadiran_token_key" ON "SesiKehadiran"("token");

-- CreateIndex
CREATE INDEX "SesiKehadiran_jenisKoko_idx" ON "SesiKehadiran"("jenisKoko");

-- CreateIndex
CREATE UNIQUE INDEX "SesiKehadiran_namaUnit_bilPerjumpaan_key" ON "SesiKehadiran"("namaUnit", "bilPerjumpaan");

-- CreateIndex
CREATE INDEX "Kehadiran_pelajarId_jenisKoko_idx" ON "Kehadiran"("pelajarId", "jenisKoko");

-- CreateIndex
CREATE UNIQUE INDEX "Kehadiran_pelajarId_namaUnit_bilPerjumpaan_key" ON "Kehadiran"("pelajarId", "namaUnit", "bilPerjumpaan");

-- CreateIndex
CREATE INDEX "LogImport_status_idx" ON "LogImport"("status");

-- CreateIndex
CREATE INDEX "LogImport_createdAt_idx" ON "LogImport"("createdAt");

-- CreateIndex
CREATE INDEX "Notifikasi_userId_dibaca_idx" ON "Notifikasi"("userId", "dibaca");

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

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_pelajarId_fkey" FOREIGN KEY ("pelajarId") REFERENCES "Pelajar"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_guruId_fkey" FOREIGN KEY ("guruId") REFERENCES "Guru"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GuruPenasihatKelab" ADD CONSTRAINT "GuruPenasihatKelab_guruId_fkey" FOREIGN KEY ("guruId") REFERENCES "Guru"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CadanganJawatan" ADD CONSTRAINT "CadanganJawatan_pelajarId_fkey" FOREIGN KEY ("pelajarId") REFERENCES "Pelajar"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Kokurikulum" ADD CONSTRAINT "Kokurikulum_pelajarId_fkey" FOREIGN KEY ("pelajarId") REFERENCES "Pelajar"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Kokurikulum" ADD CONSTRAINT "Kokurikulum_guruLulusId_fkey" FOREIGN KEY ("guruLulusId") REFERENCES "Guru"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LogPertukaran" ADD CONSTRAINT "LogPertukaran_pelajarId_fkey" FOREIGN KEY ("pelajarId") REFERENCES "Pelajar"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LogPertukaran" ADD CONSTRAINT "LogPertukaran_guruId_fkey" FOREIGN KEY ("guruId") REFERENCES "Guru"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Kehadiran" ADD CONSTRAINT "Kehadiran_pelajarId_fkey" FOREIGN KEY ("pelajarId") REFERENCES "Pelajar"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Kehadiran" ADD CONSTRAINT "Kehadiran_sesiId_fkey" FOREIGN KEY ("sesiId") REFERENCES "SesiKehadiran"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LaporanMingguan" ADD CONSTRAINT "LaporanMingguan_setiausahaId_fkey" FOREIGN KEY ("setiausahaId") REFERENCES "Pelajar"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LaporanMingguan" ADD CONSTRAINT "LaporanMingguan_sesiId_fkey" FOREIGN KEY ("sesiId") REFERENCES "SesiKehadiran"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LaporanProjek" ADD CONSTRAINT "LaporanProjek_setiausahaId_fkey" FOREIGN KEY ("setiausahaId") REFERENCES "Pelajar"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LaporanProjek" ADD CONSTRAINT "LaporanProjek_sesiId_fkey" FOREIGN KEY ("sesiId") REFERENCES "SesiKehadiran"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pencapaian" ADD CONSTRAINT "Pencapaian_pelajarId_fkey" FOREIGN KEY ("pelajarId") REFERENCES "Pelajar"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AktivitiLuar" ADD CONSTRAINT "AktivitiLuar_pelajarId_fkey" FOREIGN KEY ("pelajarId") REFERENCES "Pelajar"("id") ON DELETE CASCADE ON UPDATE CASCADE;

