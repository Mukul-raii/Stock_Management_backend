-- CreateTable
CREATE TABLE "Bank" (
    "id" SERIAL NOT NULL,
    "amount" INTEGER NOT NULL,
    "bank" TEXT NOT NULL,
    "transaction" TEXT NOT NULL,

    CONSTRAINT "Bank_pkey" PRIMARY KEY ("id")
);
