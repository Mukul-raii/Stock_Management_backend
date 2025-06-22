import { PrismaClient, Shop } from "@prisma/client";
import { Request, Response } from "express";
import * as e from "express";

const prisma = new PrismaClient();

interface RecordData {
  recordType: string;
  shop: string;
  message: string;
  amount: number;
  date: Date;
  paymentMethod: string;
}

interface StockData {
  id: number;
  product: string;
  size: number;
  quantity: number;
  price: number;
  shop: string;
  lastQuantity: number;
  lastUpdated?: Date;
}

interface BillHistoryRequest {
  stockData: StockData[];
  date: Date;
  totalCash: number;
  upiPayment: number;
  discount: number;
  breakageCash: number;
  canteenCash: number;
  totalLiquorSale: number;
  totalBeerSale: number;
  cashLeft: number;
  shopName: Shop;
  rent: number;
  ratedifference: number;
  transportation: number;
  records?: RecordData[];
}

export const generateBillHistory = async (
  req: Request<{}, {}, BillHistoryRequest>,
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
    records,
  } = req.body;

  try {
    const stockUpdate = stockData.map(async (stock: StockData) => {
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

    // Transform stockData to include required fields for UpdatedStock
    const updatedStocksData = stockData.map(stock => ({
      ...stock,
      lastUpdated: stock.lastUpdated || new Date(),
    }));

    const result = await prisma.billHistory.create({
      data: {
        updatedStocks: { create: updatedStocksData },
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
        records: records ? JSON.parse(JSON.stringify(records)) : undefined,
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
      include: {
        updatedStocks: true, // Include related stock updates
      },
    });

    res.status(200).json(result);
  } catch (error) {
    console.log(error);

    res.status(500).json(error);
  }
};

export const getBillHistoryWithRecords = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { Shop, id } = req.query;

  try {
    if (id) {
      // Get specific bill history by ID
      const result = await prisma.billHistory.findUnique({
        where: {
          id: parseInt(id as string),
        },
        include: {
          updatedStocks: true,
        },
      });
      res.status(200).json(result);
    } else {
      // Get all bill history for a shop with records
      const result = await prisma.billHistory.findMany({
        where: {
          shop: Shop as Shop,
        },
        orderBy: {
          pdfDate: "desc",
        },
        include: {
          updatedStocks: true,
        },
      });
      res.status(200).json(result);
    }
  } catch (error) {
    console.log(error);
    res.status(500).json(error);
  }
};
