/*
  Warnings:

  - Added the required column `message` to the `Bank` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Bank" ADD COLUMN     "message" TEXT NOT NULL;
