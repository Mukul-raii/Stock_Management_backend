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
    // Enforce strictly numeric bill id; prevents accidental parsing like "67eb96..." -> 67
    const idParam = req.params.id;
    if (!/^\d+$/.test(idParam)) {
      res.status(400).json({ error: "Invalid bill history id: must be numeric" });
      return;
    }
    const id = parseInt(idParam, 10);

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

    const doc = new PDFDocument({ size: "A4", margin: 36 });
    doc.pipe(res);

    // Helpers
    const currency = (n?: number | null) =>
      typeof n === "number" && !isNaN(n) ? n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "0.00";
    const page = { width: 595.28, height: 841.89 }; // A4 in pt
    const table = {
      x: 36,
      y: 150,
      width: page.width - 72,
      rowHeight: 22,
      headerBg: "#1976d2",
      altRowBg: "#f5f7fb",
      textColor: "#000000",
      headerTextColor: "#ffffff",
    };

    // Title
    doc.font("Helvetica-Bold").fontSize(20).fillColor("#000").text("Om Ganeshay Namah", { align: "center" });
    doc.moveDown(0.4);
    // Subtitle
    doc.font("Helvetica").fontSize(12).text(`Shop Name: ${bill.shop}`, { align: "center" });

    // Invoice number (left) and date (right)
    const headerY = 120;
    doc.font("Helvetica").fontSize(10).fillColor("#000");
    doc.text(`Invoice Number: ${bill.id}`, table.x, headerY, { width: table.width / 2, align: "left" });
    doc.text(`Date: ${new Date(bill.pdfDate).toLocaleDateString("en-IN")}`,
      table.x + table.width / 2, headerY, { width: table.width / 2, align: "right" });

    // Build rows from data (fallback to sample rows if none)
    type Row = { product: string; size: number; open: number; close: number; sold: number; price: number; total: number };
    let rows: Row[] = [];
    if (bill.updatedStocks && bill.updatedStocks.length > 0) {
      rows = bill.updatedStocks.map(s => {
        const open = Number(s.quantity ?? 0);
        const close = Number(s.lastQuantity ?? 0);
        const sold = Math.max(0, open - close);
        const price = Number(s.price ?? 0);
        return {
          product: s.product,
          size: Number(s.size ?? 0),
          open,
          close,
          sold,
          price,
          total: sold * price,
        };
      });
    }

    // Column layout
    const col = {
      product: { x: table.x + 8, w: 190, align: "left" as const },
      size: { x: table.x + 210, w: 50, align: "right" as const },
      open: { x: table.x + 270, w: 70, align: "right" as const },
      close: { x: table.x + 350, w: 80, align: "right" as const },
      sold: { x: table.x + 440, w: 60, align: "right" as const },
      price: { x: table.x + 510, w: 60, align: "right" as const },
      total: { x: table.x + 580, w: 70, align: "right" as const },
    };

    // Clamp table width if needed
    const tableRight = table.x + table.width;
    const lastColRight = col.total.x + col.total.w + 8;
    const overflow = lastColRight - tableRight;
    if (overflow > 0) {
      // Shift columns left uniformly
      const shift = overflow;
      (Object.keys(col) as Array<keyof typeof col>).forEach(k => {
        // @ts-ignore runtime layout only
        col[k].x -= shift;
      });
    }

    // Function to draw header row
    const drawHeader = (y: number) => {
      doc.save();
      doc.rect(table.x, y, table.width, table.rowHeight).fill(table.headerBg);
      doc.fillColor(table.headerTextColor).font("Helvetica-Bold").fontSize(10);
      doc.text("Product", col.product.x, y + 6, { width: col.product.w, align: col.product.align });
      doc.text("Size", col.size.x, y + 6, { width: col.size.w, align: col.size.align });
      doc.text("Open Stock", col.open.x, y + 6, { width: col.open.w, align: col.open.align });
      doc.text("Closing Stock", col.close.x, y + 6, { width: col.close.w, align: col.close.align });
      doc.text("Qty Sold", col.sold.x, y + 6, { width: col.sold.w, align: col.sold.align });
      doc.text("Price", col.price.x, y + 6, { width: col.price.w, align: col.price.align });
      doc.text("Total Sale (₹)", col.total.x, y + 6, { width: col.total.w, align: col.total.align });
      doc.restore();
    };

    // Draw table header
    let y = table.y;
    drawHeader(y);
    y += table.rowHeight;

    // Draw rows
    let grandTotal = 0;
    if (rows.length === 0) {
      // If no stock updates found, draw an empty table header and a friendly note
      doc.font("Helvetica").fontSize(10).fillColor("#666");
      doc.text("No stock updates recorded for this bill.", table.x, y + 12, { width: table.width, align: "center" });
    }

    rows.forEach((r, i) => {
      // Page break check (keep 3 rows margin at bottom)
      if (y + table.rowHeight > doc.page.height - 72) {
        doc.addPage();
        y = table.y;
        drawHeader(y);
        y += table.rowHeight;
      }

      const isAlt = i % 2 === 1;
      if (isAlt) {
        doc.save();
        doc.rect(table.x, y, table.width, table.rowHeight).fill(table.altRowBg);
        doc.restore();
      } else {
        // White rows are page background; draw a thin hairline for separation
        doc.save();
        doc.strokeColor("#e0e6ef").lineWidth(0.5).moveTo(table.x, y + table.rowHeight).lineTo(table.x + table.width, y + table.rowHeight).stroke();
        doc.restore();
      }

      doc.fillColor(table.textColor).font("Helvetica").fontSize(10);
      doc.text(r.product, col.product.x, y + 6, { width: col.product.w, align: col.product.align });
      doc.text(String(r.size), col.size.x, y + 6, { width: col.size.w, align: col.size.align });
      doc.text(String(r.open), col.open.x, y + 6, { width: col.open.w, align: col.open.align });
      doc.text(String(r.close), col.close.x, y + 6, { width: col.close.w, align: col.close.align });
      doc.text(String(r.sold), col.sold.x, y + 6, { width: col.sold.w, align: col.sold.align });
      doc.text(currency(r.price), col.price.x, y + 6, { width: col.price.w, align: col.price.align });
      doc.text(currency(r.total), col.total.x, y + 6, { width: col.total.w, align: col.total.align });

      grandTotal += r.total;
      y += table.rowHeight;
    });

    // Grand total row
    // Draw a subtle separator and the total label/value aligned to last column
    if (y + table.rowHeight > doc.page.height - 72) {
      doc.addPage();
      y = table.y;
      drawHeader(y);
      y += table.rowHeight;
    }
    doc.save();
    doc.strokeColor("#c1c7d0").lineWidth(1).moveTo(table.x, y + 2).lineTo(table.x + table.width, y + 2).stroke();
    doc.restore();
    doc.font("Helvetica-Bold").fontSize(11);
    doc.text("Grand Total", col.price.x - 10, y + 6, { width: col.price.w + col.sold.w, align: "right" });
    doc.text(currency(grandTotal), col.total.x, y + 6, { width: col.total.w, align: col.total.align });

    // Summary section from Bill details (generated in generateBillHistory)
    // Spacing before summary
    y += table.rowHeight * 1.2;

    const ensureSpace = (needed: number) => {
      if (y + needed > doc.page.height - 72) {
        doc.addPage();
        y = table.y; // reset to table start on new page
      }
    };

    // Draw Summary box background
    const summaryItems: Array<{ label: string; value: string }> = [
      { label: "Total Beer Sale", value: `₹ ${currency(bill.totalBeerSale ?? 0)}` },
      { label: "Total Desi Sale", value: `₹ ${currency(bill.totalDesiSale ?? 0)}` },
      { label: "Discount", value: `₹ ${currency(bill.discount ?? 0)}` },
      { label: "Breakage Cash", value: `₹ ${currency(bill.breakageCash ?? 0)}` },
      { label: "Canteen Cash", value: `₹ ${currency(bill.canteenCash ?? 0)}` },
      { label: "Rent", value: `₹ ${currency(bill.rent ?? 0)}` },
      { label: "Transportation", value: `₹ ${currency(bill.transportation ?? 0)}` },
      { label: "Rate Difference", value: `₹ ${currency(bill.rateDiff ?? 0)}` },
      { label: "UPI Payment", value: `₹ ${currency(bill.upiPayment ?? 0)}` },
      { label: "Cash Received", value: `₹ ${currency(bill.totalCashReceived ?? 0)}` },
      { label: "Total Cash (Reported)", value: `₹ ${currency(bill.totalSale ?? 0)}` },
      { label: "Total (Computed)", value: `₹ ${currency(grandTotal)}` },
    ];

    // Two-column layout for summary
    const colGap = 20;
    const boxPadding = 10;
    const colWidth = (table.width - colGap) / 2;
    const leftColX = table.x;
    const rightColX = table.x + colWidth + colGap;

    // Title for the summary
    ensureSpace(28 + (Math.ceil(summaryItems.length / 2) * 20) + boxPadding * 2);
    doc.font("Helvetica-Bold").fontSize(12).fillColor("#000").text("Summary", leftColX, y, { width: table.width, align: "left" });
    y += 16;

    // Determine box height
    const rowsPerCol = Math.ceil(summaryItems.length / 2);
    const boxHeight = rowsPerCol * 20 + boxPadding * 2;

    // Box background
    doc.save();
    doc.roundedRect(table.x, y - 6, table.width, boxHeight + 6, 6).fillOpacity(0.06).fill("#1976d2").fillOpacity(1);
    doc.restore();

    // Draw key-value rows
    doc.font("Helvetica").fontSize(10).fillColor("#000");
    const drawKV = (label: string, value: string, x: number, yy: number) => {
      const labelWidth = colWidth * 0.6;
      const valueWidth = colWidth * 0.4;
      doc.font("Helvetica").fillColor("#333").text(label, x + boxPadding, yy, { width: labelWidth, align: "left" });
      doc.font("Helvetica-Bold").fillColor("#000").text(value, x + boxPadding + labelWidth, yy, { width: valueWidth - boxPadding, align: "right" });
    };

    let yCursor = y + boxPadding;
    summaryItems.slice(0, rowsPerCol).forEach((it, idx) => {
      drawKV(it.label, it.value, leftColX, yCursor + idx * 20);
    });
    summaryItems.slice(rowsPerCol).forEach((it, idx) => {
      drawKV(it.label, it.value, rightColX, yCursor + idx * 20);
    });

    y += boxHeight + 10;

    // Footer note
    doc.font("Helvetica").fontSize(9).fillColor("#666");
    doc.text("Generated by Stock Management", table.x, doc.page.height - 40, { align: "left" });
    doc.fillColor("#000");

    doc.end();
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to generate PDF" });
  }
};
