-- CreateTable
CREATE TABLE "HadUnit" (
    "id" TEXT NOT NULL,
    "kohort" TEXT NOT NULL,
    "jenisKoko" TEXT NOT NULL,
    "namaUnit" TEXT NOT NULL,
    "had" INTEGER NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HadUnit_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "HadUnit_kohort_namaUnit_key" ON "HadUnit"("kohort", "namaUnit");
