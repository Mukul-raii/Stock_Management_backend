/*
  Warnings:

  - You are about to drop the column `newQuantity` on the `UpdatedStock` table. All the data in the column will be lost.
  - You are about to drop the column `totalSale` on the `UpdatedStock` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "UpdatedStock" DROP COLUMN "newQuantity",
DROP COLUMN "totalSale";
