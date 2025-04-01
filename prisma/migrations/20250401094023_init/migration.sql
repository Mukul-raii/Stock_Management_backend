/*
  Warnings:

  - You are about to drop the column `Shop` on the `UpdatedStock` table. All the data in the column will be lost.
  - Added the required column `shop` to the `UpdatedStock` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "UpdatedStock" DROP COLUMN "Shop",
ADD COLUMN     "shop" TEXT NOT NULL;
