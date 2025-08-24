/*
  Warnings:

  - You are about to drop the column `password` on the `user` table. All the data in the column will be lost.
  - You are about to drop the column `userName` on the `user` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[userId]` on the table `user` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `email` to the `user` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Bank" ADD COLUMN     "userId" TEXT;

-- AlterTable
ALTER TABLE "BillHistory" ADD COLUMN     "userId" TEXT;

-- AlterTable
ALTER TABLE "UpdatedStock" ADD COLUMN     "userId" TEXT;

-- AlterTable
ALTER TABLE "record" ADD COLUMN     "userId" TEXT;

-- AlterTable
ALTER TABLE "stock" ADD COLUMN     "userId" TEXT;

-- AlterTable
ALTER TABLE "user" DROP COLUMN "password",
DROP COLUMN "userName",
ADD COLUMN     "email" TEXT NOT NULL,
ADD COLUMN     "hashedPassword" TEXT,
ADD COLUMN     "userId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "user_userId_key" ON "user"("userId");

-- AddForeignKey
ALTER TABLE "stock" ADD CONSTRAINT "stock_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("userId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "record" ADD CONSTRAINT "record_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("userId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Bank" ADD CONSTRAINT "Bank_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("userId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BillHistory" ADD CONSTRAINT "BillHistory_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("userId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UpdatedStock" ADD CONSTRAINT "UpdatedStock_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("userId") ON DELETE SET NULL ON UPDATE CASCADE;
