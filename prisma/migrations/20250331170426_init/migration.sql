/*
  Warnings:

  - The values [VamanPuri] on the enum `Shop` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "Shop_new" AS ENUM ('Vamanpuri', 'Amariya');
ALTER TABLE "stock" ALTER COLUMN "shop" TYPE "Shop_new" USING ("shop"::text::"Shop_new");
ALTER TABLE "record" ALTER COLUMN "shopName" TYPE "Shop_new" USING ("shopName"::text::"Shop_new");
ALTER TABLE "BillHistory" ALTER COLUMN "shop" TYPE "Shop_new" USING ("shop"::text::"Shop_new");
ALTER TYPE "Shop" RENAME TO "Shop_old";
ALTER TYPE "Shop_new" RENAME TO "Shop";
DROP TYPE "Shop_old";
COMMIT;
