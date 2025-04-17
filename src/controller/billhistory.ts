import { PrismaClient, Shop } from "@prisma/client";
import { Request, Response } from "express";
import * as e from "express";

const prisma = new PrismaClient();

export const generateBillHistory = async (
  req: Request,
  res: Response
): Promise<void> => {
  const {
    stockData,
    date,
    totalCash,
    upiPayment,
    discount,
    breakageCash,
    canteenCash,
    totalLiquorSale,
    totalBeerSale,
    cashLeft,
    shopName,
    rent,
    ratedifference,
    transportation,
  } = req.body;

  try {
    const stockUpdate = stockData.map(async (stock: any) => {
      const result = await prisma.stock.update({
        where: {
          shop: shopName,
          id: stock.id,
          product: stock.product,
        },
        data: {
          quantity: stock.lastQuantity,
        },
      });
    });

    const result = await prisma.billHistory.create({
      data: {
        updatedStocks: { create: [...stockData] },
        pdfDate: date,
        totalSale: totalCash,
        upiPayment: upiPayment,
        discount: discount,
        breakageCash: breakageCash,
        canteenCash: canteenCash,
        totalDesiSale: totalLiquorSale,
        totalBeerSale: totalBeerSale,
        shop: shopName,
        rent: rent,
        rateDiff: ratedifference,
        transportation: transportation,
        totalCashReceived: cashLeft,
      },
    });
    res.status(200).json(result);
  } catch (error) {
    console.log(error);

    res.status(500).json(error);
  }
};

export const getAllBillHistory = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { Shop } = req.query;

  try {
    const result = await prisma.billHistory.findMany({
      where: {
        shop: Shop as Shop,
      },
      orderBy: {
        pdfDate: "desc",
      },
    });

    res.status(200).json(result);
  } catch (error) {
    console.log(error);

    res.status(500).json(error);
  }
};
