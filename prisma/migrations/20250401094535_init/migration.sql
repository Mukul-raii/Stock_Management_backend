/*
  Warnings:

  - The primary key for the `UpdatedStock` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - Added the required column `billHistoryId` to the `UpdatedStock` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "UpdatedStock" DROP CONSTRAINT "UpdatedStock_id_fkey";

-- AlterTable
ALTER TABLE "UpdatedStock" DROP CONSTRAINT "UpdatedStock_pkey",
ADD COLUMN     "billHistoryId" INTEGER NOT NULL,
ADD COLUMN     "ids" SERIAL NOT NULL,
ALTER COLUMN "id" DROP DEFAULT,
ADD CONSTRAINT "UpdatedStock_pkey" PRIMARY KEY ("ids");
DROP SEQUENCE "UpdatedStock_id_seq";

-- AddForeignKey
ALTER TABLE "UpdatedStock" ADD CONSTRAINT "UpdatedStock_billHistoryId_fkey" FOREIGN KEY ("billHistoryId") REFERENCES "BillHistory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
