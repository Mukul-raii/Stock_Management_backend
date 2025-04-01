/*
  Warnings:

  - You are about to drop the column `totalPaymentReceived` on the `BillHistory` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "BillHistory" DROP COLUMN "totalPaymentReceived",
ADD COLUMN     "totalCashReceived" INTEGER;
