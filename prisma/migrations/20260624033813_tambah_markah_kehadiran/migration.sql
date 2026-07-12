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
    "komitmen" REAL NOT NULL DEFAULT 0,
    "khidmatSumbangan" REAL NOT NULL DEFAULT 0,
    "markahEkstra" REAL NOT NULL DEFAULT 0,
    "markahKehadiran" REAL NOT NULL DEFAULT 0,
    "jantina" TEXT,
    "kaum" TEXT,
    "agama" TEXT,
    "subRole" TEXT NOT NULL DEFAULT 'Pelajar',
    "statusAktif" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Pelajar" ("agama", "createdAt", "id", "jantina", "kaum", "kelasT6", "khidmatSumbangan", "komitmen", "markahEkstra", "markahPajskT5", "markahPajskT6", "nama", "noIc", "peratusPajskT5", "peratusPajskT6", "statusAktif", "subRole", "updatedAt") SELECT "agama", "createdAt", "id", "jantina", "kaum", "kelasT6", "khidmatSumbangan", "komitmen", "markahEkstra", "markahPajskT5", "markahPajskT6", "nama", "noIc", "peratusPajskT5", "peratusPajskT6", "statusAktif", "subRole", "updatedAt" FROM "Pelajar";
DROP TABLE "Pelajar";
ALTER TABLE "new_Pelajar" RENAME TO "Pelajar";
CREATE UNIQUE INDEX "Pelajar_noIc_key" ON "Pelajar"("noIc");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
