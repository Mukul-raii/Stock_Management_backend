import { getAuth } from "@clerk/express";
import { PrismaClient } from "@prisma/client";
import { Request, Response } from "express";
import prisma from "../lib/prisma";




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
 const { userId } = getAuth(req);
  if(!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  try {
    const result = await prisma.record.create({
      data: {
        userId:userId,
        recordName:recordType,
        shopName: selectedShop?.trim() ? selectedShop : null,
        message,
        amount:parseInt(amount),
        date,
        paymentMethod:selectedPaymentMethod,
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
   const { userId } = getAuth(req);
  if(!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  try {
    const result = await prisma.record.findMany({
      where:{
        userId:userId,
      },
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



export const bank_transaction = async (req: Request, res: Response): Promise<void> => {
  const { amount, transactionType, selectedAccount,paymentMethod,message,structuredDate } = req.body;
 const { userId } = getAuth(req);
  if(!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  try {
    const result = await prisma.bank.create({
      data:{
        userId:userId,
        amount:parseInt(amount),
        transaction : transactionType,
        bank:selectedAccount,
        paymentMethod,
        message,
        date:structuredDate
      }
    })
    
    res.status(200).json({message:"success"})
  }
  catch(error){
    console.log(error);
    res.status(500).json({error:"Internal Server Error"})
  }}


  export const getAllBankTransaction = async (req: Request, res: Response): Promise<void> => {
     const { userId } = getAuth(req);
  if(!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
    try {
      const result = await prisma.bank.findMany({
        where: {
          userId: userId
        },
        orderBy: { id:'asc' },
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
