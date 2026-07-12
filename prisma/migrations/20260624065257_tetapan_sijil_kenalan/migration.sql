-- AlterTable
ALTER TABLE "Pelajar" ADD COLUMN "email" TEXT;
ALTER TABLE "Pelajar" ADD COLUMN "noTel" TEXT;
ALTER TABLE "Pelajar" ADD COLUMN "telegramChatId" TEXT;

-- CreateTable
CREATE TABLE "TetapanSijil" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT 'default',
    "institusi" TEXT NOT NULL DEFAULT 'KTE (Prauniversiti) Desa Mahkota',
    "tajukSijil" TEXT NOT NULL DEFAULT 'SIJIL PENGHARGAAN KOKURIKULUM',
    "namaPenandatangan" TEXT NOT NULL DEFAULT '',
    "jawatanPenandatangan" TEXT NOT NULL DEFAULT 'Penyelaras Kokurikulum',
    "teksCop" TEXT NOT NULL DEFAULT '',
    "updatedAt" DATETIME NOT NULL
);
