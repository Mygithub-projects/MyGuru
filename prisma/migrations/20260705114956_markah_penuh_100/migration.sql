-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_TetapanMarkah" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "kategori" TEXT NOT NULL,
    "namaItem" TEXT NOT NULL,
    "nilaiMarkah" REAL NOT NULL,
    "markahPenuh" REAL NOT NULL DEFAULT 100
);
INSERT INTO "new_TetapanMarkah" ("id", "kategori", "markahPenuh", "namaItem", "nilaiMarkah") SELECT "id", "kategori", "markahPenuh", "namaItem", "nilaiMarkah" FROM "TetapanMarkah";
DROP TABLE "TetapanMarkah";
ALTER TABLE "new_TetapanMarkah" RENAME TO "TetapanMarkah";
CREATE UNIQUE INDEX "TetapanMarkah_kategori_namaItem_key" ON "TetapanMarkah"("kategori", "namaItem");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
