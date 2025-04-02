import { PrismaClient } from "@prisma/client";
import { Request, Response } from "express";

const prisma = new PrismaClient();



let CurrentBank = 10000;
let Nana_Saving_Bank = 0 
let Pooja_Saving_Bank = 0

export const newRecord = async (req: Request, res: Response): Promise<void> => {
  const {
    recordType,
    selectedShop,
    message,
    amount,
    date,
    selectedPaymentMethod,
  } = req.body;

  try {
    const result = await prisma.record.create({
      data: {
        recordName:recordType,
        shopName: selectedShop?.trim() ? selectedShop : null,
        message,
        amount:parseInt(amount),
        date,
        paymentMethod:selectedPaymentMethod,
      },
    });
    console.log(result);
    
    res.status(200).json(result);
  } catch (error) {
    console.error("Error creating record:", error);
    res.status(500).json({ 
      error: "Internal server error",
      details: error instanceof Error ? error.message : String(error)
    });
  }
};

export const getAllRecords = async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await prisma.record.findMany({
      orderBy: { date: "desc" },
    });
    res.status(200).json(result);
  } catch (error) {
    console.error("Error fetching records:", error);
    res.status(500).json({ 
      error: "Internal server error",
      details: error instanceof Error ? error.message : String(error)
    });
  }
};