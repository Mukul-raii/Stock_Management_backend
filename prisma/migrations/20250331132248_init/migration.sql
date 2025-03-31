-- CreateEnum
CREATE TYPE "Shop" AS ENUM ('VamanPuri', 'Amariya');

-- CreateEnum
CREATE TYPE "User" AS ENUM ('employee', 'admin');

-- CreateTable
CREATE TABLE "user" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "userName" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" "User" NOT NULL,

    CONSTRAINT "user_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stock" (
    "id" SERIAL NOT NULL,
    "product" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL,
    "price" INTEGER NOT NULL,
    "lastUpdated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "shop" "Shop" NOT NULL,

    CONSTRAINT "stock_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "record" (
    "id" SERIAL NOT NULL,
    "recordName" TEXT NOT NULL,
    "shopName" "Shop" NOT NULL,
    "message" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "paymentMethod" TEXT NOT NULL,

    CONSTRAINT "record_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BillHistory" (
    "id" SERIAL NOT NULL,
    "pdfDate" TIMESTAMP(3) NOT NULL,
    "totalSale" INTEGER,
    "upiPayment" INTEGER,
    "discount" INTEGER,
    "breakageCash" INTEGER,
    "canteenCash" INTEGER,
    "totalDesiSale" INTEGER,
    "totalBeerSale" INTEGER,
    "salary" INTEGER,
    "shop" "Shop" NOT NULL,
    "rateDiff" INTEGER,
    "transportation" INTEGER,
    "rent" INTEGER,
    "totalPaymentReceived" INTEGER,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BillHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UpdatedStock" (
    "id" SERIAL NOT NULL,
    "product" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "lastQuantity" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL,
    "price" INTEGER NOT NULL,
    "totalSale" INTEGER NOT NULL,
    "newQuantity" INTEGER NOT NULL,
    "lastUpdated" TIMESTAMP(3) NOT NULL,
    "Shop" TEXT NOT NULL,

    CONSTRAINT "UpdatedStock_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "UpdatedStock" ADD CONSTRAINT "UpdatedStock_id_fkey" FOREIGN KEY ("id") REFERENCES "BillHistory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
