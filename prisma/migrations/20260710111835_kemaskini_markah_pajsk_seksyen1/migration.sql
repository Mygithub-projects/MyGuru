-- AlterTable
ALTER TABLE "LaporanProjek" ADD COLUMN "jawatanProjek" TEXT;
ALTER TABLE "LaporanProjek" ADD COLUMN "peringkatProjek" TEXT;

-- AlterTable
ALTER TABLE "Pencapaian" ADD COLUMN "kedudukan" TEXT;

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Pelajar" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nama" TEXT NOT NULL,
    "noIc" TEXT NOT NULL,
    "kelasT6" TEXT,
    "markahPajskT5" REAL,
    "peratusPajskT5" REAL,
    "markahPajskT6" REAL,
    "peratusPajskT6" REAL,
    "markahKehadiran" REAL NOT NULL DEFAULT 0,
    "markahPenglibatan" REAL NOT NULL DEFAULT 0,
    "markahPencapaian" REAL NOT NULL DEFAULT 0,
    "markahProjekJawatan" REAL NOT NULL DEFAULT 0,
    "markahProjekPeringkat" REAL NOT NULL DEFAULT 0,
    "markahEkstra" REAL NOT NULL DEFAULT 0,
    "gredPajskT6" TEXT,
    "komitmen" REAL NOT NULL DEFAULT 0,
    "khidmatSumbangan" REAL NOT NULL DEFAULT 0,
    "jantina" TEXT,
    "kaum" TEXT,
    "agama" TEXT,
    "email" TEXT,
    "noTel" TEXT,
    "telegramChatId" TEXT,
    "subRole" TEXT NOT NULL DEFAULT 'Pelajar',
    "statusAktif" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Pelajar" ("agama", "createdAt", "email", "id", "jantina", "kaum", "kelasT6", "khidmatSumbangan", "komitmen", "markahEkstra", "markahKehadiran", "markahPajskT5", "markahPajskT6", "nama", "noIc", "noTel", "peratusPajskT5", "peratusPajskT6", "statusAktif", "subRole", "telegramChatId", "updatedAt") SELECT "agama", "createdAt", "email", "id", "jantina", "kaum", "kelasT6", "khidmatSumbangan", "komitmen", "markahEkstra", "markahKehadiran", "markahPajskT5", "markahPajskT6", "nama", "noIc", "noTel", "peratusPajskT5", "peratusPajskT6", "statusAktif", "subRole", "telegramChatId", "updatedAt" FROM "Pelajar";
DROP TABLE "Pelajar";
ALTER TABLE "new_Pelajar" RENAME TO "Pelajar";
CREATE UNIQUE INDEX "Pelajar_noIc_key" ON "Pelajar"("noIc");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
