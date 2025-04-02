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
      orderBy:{
        id:'asc'
      }
    });

    res.status(200).json(result);
  } catch (error) {
    res.status(500).json(error);
  }
};

export const addNewStocks = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { product, size, price, shop } = req.body;

  try {
    const result = await prisma.stock.create({
      data: {
        product: product,
        size: size,
        price: price,
        shop: shop as Shop,
      },
    });

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
  const { shopName,newQuantities } = req.body;
  
  try {
    await Promise.all(
      Object.entries(newQuantities).map(async ([id, quantity]) => {
        await prisma.stock.update({
          where: {
            id: Number(id), // Convert string key to number
            shop: shopName
            },
            data: {
            quantity: {
              increment: Number(quantity) // Use Prisma's increment operation
            }
          }
        });
      })
    );

    res.status(200).json({message:"updated Succesfully"});
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
): Promise<void> => {
  try {
    const { shopName,newQuantities } = req.body;
    let transferedStock:any[]= []

     await Promise.all(
      Object.entries(newQuantities).map(async ([id, quantity]) => {
        
        const fromShop=  await prisma.stock.update({
          where: {
            id: Number(id), // Convert string key to number
            shop: shopName
            },
            data: {
            quantity: {
              decrement: Number(quantity) // Use Prisma's increment operation
            }}
        })
         transferedStock.push({...fromShop,Transferedquantity:quantity})
      })
    );


    
    const toShopUpdates = await Promise.all(
      transferedStock.map(async(item)=>{
        const transferToShop = item.shop ==="Amariya"? "Vamanpuri":"Amariya"
        if(item.Transferedquantity !== undefined){
        const updatedStock = await prisma.stock.updateMany({
          where: {
              product:item.product,
              size:item.size,
              shop :transferToShop 
            },
            data:{
              quantity:{
                increment:Number(item.Transferedquantity)
              }
            }
        })
        return updatedStock
      }
      }))





     res.status(200).json({ message: "Stock updated successfully" ,transferedStock,   toShop: toShopUpdates,});
  } catch (error) {
    console.log(error);
    
     res.status(500).json(error);
  }
};
