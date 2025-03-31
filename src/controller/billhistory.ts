import { PrismaClient, Shop } from "@prisma/client";
import { Request, Response } from "express";
import * as e from "express";

const prisma = new PrismaClient();

export const generateBillHistory = async (req: Request, res: Response): Promise<void> => {
  const {
    updatedStocks,
    pdfDate,
    totalSale,
    upiPayment,
    discount,
    breakageCash,
    canteenCash,
    totalDesiSale,
    totalBeerSale,
    salary,
    shop,
    rent,
    rateDiff,
    totalPaymentReceived,
    transportation,
  } = req.body;

  try {
    const result = await prisma.billHistory.create({
      data: {
        updatedStocks: updatedStocks,
        pdfDate: pdfDate,
        totalSale: totalSale,
        upiPayment: upiPayment,
        discount: discount,
        breakageCash: breakageCash,
        canteenCash: canteenCash,
        totalDesiSale: totalDesiSale,
        totalBeerSale: totalBeerSale,
        salary: salary,
        shop: shop,
        rent: rent,
        rateDiff: rateDiff,
        totalPaymentReceived: totalPaymentReceived,
        transportation: transportation,
      },
    });
     res.status(200).json(result);
  } catch (error) {
     res.status(500).json(error);
  }
};

export const getAllBillHistory = async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await prisma.billHistory.findMany();
     res.status(200).json(result);
  } catch (error) {
     res.status(500).json(error);
  }
};
