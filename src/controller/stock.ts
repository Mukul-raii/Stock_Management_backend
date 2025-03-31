import { PrismaClient, Shop } from "@prisma/client";
import { Request, Response, NextFunction } from "express";
import * as e from "express";

const prisma = new PrismaClient();

export const getAllStocks = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { Shop } = req.query;

    const result = await prisma.stock.findMany({
      where: {
        shop: Shop as Shop,
      },
    });
console.log(result);

    res.status(200).json(result);
  } catch (error) {
    res.status(500).json(error);
  }
};

export const addNewStocks = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { product, size, quantity, price, shop } = req.body;
  console.log(req.body.size);

  try {
    const result = await prisma.stock.create({
      data: {
        product: product,
        size: size,
        quantity: quantity,
        price: price,
        shop: shop,
      },
    });
    console.log(result);

    res.status(200).json(result);
  } catch (error) {
    console.log(error);

    res.status(500).json(error);
  }
};

export const updateStock = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { id, quantity } = req.body;
  try {
    let result = await prisma.stock.update({
      where: {
        id: id,
      },
      data: {
        quantity: quantity,
        lastUpdated: new Date(),
      },
    });
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json(error);
  }
};

export const deleteStock = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { id } = req.params;
  try {
    let result = await prisma.stock.delete({
      where: {
        id: parseInt(id),
      },
    });
    res.status(200).json({ message: "Stock Deleted Successfully" });
  } catch (error) {
    res.status(500).json(error);
  }
};

export const transferStock = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    const { stockId, fromShop, toShop, transferQuantity } = req.body;
    let stock = await prisma.stock.findUnique({
      where: {
        id: parseInt(stockId),
        shop: fromShop,
      },
    });

    if (!stock) {
      return res.status(401).json({ message: "Stock not found" });
    }
    if (stock.quantity < transferQuantity) {
      return res.status(401).json({ message: "Not enough stock" });
    }

    await prisma.stock.update({
      where: { id: stock.id },
      data: {
        quantity: stock.quantity - transferQuantity,
      },
    });
    return res.json({ message: "Stock updated successfully" });
  } catch (error) {
    return res.status(500).json(error);
  }
};
