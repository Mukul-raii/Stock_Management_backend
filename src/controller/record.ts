import { PrismaClient } from "@prisma/client";
import { Request, Response } from "express";

const prisma = new PrismaClient();

export const newRecord = async (req: Request, res: Response): Promise<void> => {
  const {
    recordName,
    shopName,
    message,
    amount,
    date,
    paymentMethod,
  } = req.body;

  try {
    const result = await prisma.record.create({
      data: {
        recordName,
        shopName,
        message,
        amount,
        date,
        paymentMethod,
      },
    });
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