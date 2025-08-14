import { PrismaClient, Shop } from "@prisma/client";
import { Request, Response } from "express";
import * as e from "express";
import PDFDocument from "pdfkit";

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

export const getBillHistoryPDF = async (
  req: Request<{ id: string }>,
  res: Response
): Promise<void> => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      res.status(400).json({ error: "Invalid bill history id" });
      return;
    }

    const bill = await prisma.billHistory.findUnique({
      where: { id },
      include: { updatedStocks: true },
    });

    if (!bill) {
      res.status(404).json({ error: "Bill history not found" });
      return;
    }

    // Prepare response headers
    const fileName = `bill_${bill.shop}_${new Date(bill.pdfDate).toISOString().split("T")[0]}_${bill.id}.pdf`;
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `inline; filename="${fileName}"`);

    const doc = new PDFDocument({ size: "A4", margin: 40 });
    doc.pipe(res);

    // Helpers
    const lineGap = 6;
    const sectionGap = 12;
    const currency = (n?: number | null) =>
      typeof n === "number" ? n.toLocaleString("en-IN") : "-";

    const moveY = (gap = lineGap) => {
      doc.moveDown(gap / 12); // pdfkit moveDown works in multiples of lineHeight; tweak factor
    };

    // Header
    doc
      .fontSize(18)
      .text("Daily Bill Summary", { align: "center" })
      .fontSize(12);
    moveY(8);
    doc.text(`Shop: ${bill.shop}`);
    doc.text(`Date: ${new Date(bill.pdfDate).toLocaleDateString("en-IN")}`);
    doc.text(`Bill ID: ${bill.id}`);

    moveY(sectionGap);
    doc.fontSize(14).text("Totals").fontSize(11);
    moveY(4);
    const totalsLeftX = doc.x;
    const totalsRightX = 280;
    const writeRow = (label: string, value: string) => {
      doc.text(label, totalsLeftX, doc.y, { continued: true });
      doc.text(value, totalsRightX);
    };
    writeRow("Total Cash Sale:", currency(bill.totalSale));
    writeRow("UPI Payment:", currency(bill.upiPayment));
    writeRow("Discount:", currency(bill.discount));
    writeRow("Breakage Cash:", currency(bill.breakageCash));
    writeRow("Canteen Cash:", currency(bill.canteenCash));
    writeRow("Total Desi Sale:", currency(bill.totalDesiSale));
    writeRow("Total Beer Sale:", currency(bill.totalBeerSale));
    writeRow("Rate Difference:", currency(bill.rateDiff));
    writeRow("Transportation:", currency(bill.transportation));
    writeRow("Rent:", currency(bill.rent));
    writeRow("Total Cash Received:", currency(bill.totalCashReceived));

    moveY(sectionGap);
    // Records (optional)
    if (bill.records) {
      doc.fontSize(14).text("Records").fontSize(10);
      moveY(4);
      try {
        const records = bill.records as unknown as Array<{
          recordType?: string;
          shop?: string;
          message?: string;
          amount?: number;
          date?: string | Date;
          paymentMethod?: string;
        }>;
        if (Array.isArray(records) && records.length) {
          // Header row
          const headerY = doc.y;
          doc.font("Helvetica-Bold");
          doc.text("Type", 40, headerY);
          doc.text("Message", 110, headerY);
          doc.text("Amount", 360, headerY);
          doc.text("Payment", 430, headerY);
          doc.font("Helvetica");
          moveY(6);
          for (const r of records) {
            const y = doc.y;
            if (y > 760) {
              doc.addPage();
            }
            doc.text(r.recordType || "-", 40, doc.y, { width: 60 });
            doc.text(r.message || "-", 110, y, { width: 240 });
            doc.text(currency(r.amount ?? null), 360, y, { width: 60 });
            doc.text(r.paymentMethod || "-", 430, y, { width: 100 });
            moveY(2);
          }
          moveY(sectionGap);
        }
      } catch {}
    }

    // Updated stocks summary
    doc.fontSize(14).text("Updated Stocks").fontSize(10);
    moveY(4);
    // Table headers
    const startY = doc.y;
  doc.font("Helvetica-Bold");
    doc.text("Product", 40, startY);
    doc.text("Size", 220, startY);
    doc.text("Last Qty", 270, startY);
    doc.text("New Qty", 330, startY);
    doc.text("Price", 390, startY);
    doc.text("Shop", 450, startY);
  doc.font("Helvetica");
    moveY(6);

    for (const s of bill.updatedStocks) {
      if (doc.y > 760) doc.addPage();
      const y = doc.y;
      doc.text(s.product, 40, y, { width: 170 });
      doc.text(String(s.size), 220, y, { width: 40 });
      doc.text(String(s.lastQuantity), 270, y, { width: 50 });
      doc.text(String(s.quantity), 330, y, { width: 50 });
      doc.text(currency(s.price), 390, y, { width: 50 });
      doc.text(String(s.shop), 450, y, { width: 100 });
      moveY(2);
    }

    // Footer
    doc.addPage();
    doc.fontSize(9).fillColor("#666").text("Generated by Stock Management", 40, 800, {
      align: "left",
    });
    doc.fillColor("#000");

    doc.end();
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to generate PDF" });
  }
};
