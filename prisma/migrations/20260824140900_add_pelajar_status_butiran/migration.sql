-- AlterTable
ALTER TABLE "Pelajar" ADD COLUMN     "disahkanOlehId" TEXT,
ADD COLUMN     "statusButiran" TEXT NOT NULL DEFAULT 'Pending',
ADD COLUMN     "tarikhSahkan" TIMESTAMP(3);

