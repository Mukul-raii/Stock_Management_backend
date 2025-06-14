import { PrismaClient, Shop } from "@prisma/client";
import { Request, Response } from "express";
import { GoogleGenAI } from "@google/genai";

const prisma = new PrismaClient();

interface ShopTotals {
  totalSale: number;
  totalCashReceived: number;
  totalUpiPayment: number;
  totalBreakageCash: number;
  totalTransportation: number;
  totalRent: number;
}

interface RecordTotals {
  Cash: number;
  CurrentBank: number;
  none: number;
}

interface BankTotals {
  credit: number;
  debit: number;
}
interface PaymentMethodAggregation {
  paymentMethod: string | null;
  transaction: string;
  _sum: {
    amount: number | null;
  };
}

interface ContentData {
  TotalCash: Record<string, ShopTotals>;
  Record: Record<RecordType, RecordTotals>;
  BankTransactions: Record<string, BankTotals>;
  MoneyCalculation: {
    TotalCash: number;
    TotalBank: number;
  };
  paymentMethodAgg: PaymentMethodAggregation[];
  companyRecords: object;
  stockTotalCost: {};
}

const TypeRecordProps = [
  "Purchase Stock",
  "Excise Inspector Payment",
  "Direct Purchase Stock",
  "MMGD Payment",
  "Assesment Payment",
  "Salary",
  "Cash Handling Charge",
  "Others",
] as const;

const bankAccounts = [
  "Current Bank",
  "Saving Bank (Nana)",
  "Saving Bank (Pooja)",
];
type TransactionType = "credit" | "debit";
type PaymentMethod = "Cash" | "Current Bank" | "none";
type RecordType = (typeof TypeRecordProps)[number];

export const HomeProperties = async (
  req: Request,
  res: Response
): Promise<void> => {
  const shops = ["Amariya", "Vamanpuri"];

  let content: ContentData = {
    TotalCash: {
      Amariya: {
        totalSale: 0,
        totalCashReceived: 0,
        totalUpiPayment: 0,
        totalBreakageCash: 0,
        totalTransportation: 0,
        totalRent: 0,
      },
      Vamanpuri: {
        totalSale: 0,
        totalCashReceived: 0,
        totalUpiPayment: 0,
        totalBreakageCash: 0,
        totalTransportation: 0,
        totalRent: 0,
      },
    },
    Record: TypeRecordProps.reduce((acc, recordType) => {
      acc[recordType] = { Cash: 0, CurrentBank: 0, none: 0 };
      return acc;
    }, {} as Record<RecordType, RecordTotals>),
    BankTransactions: bankAccounts.reduce((acc, bank) => {
      acc[bank] = { credit: 0, debit: 0 };
      return acc;
    }, {} as Record<string, BankTotals>),
    MoneyCalculation: {
      TotalCash: 0,
      TotalBank: 0,
    },
    paymentMethodAgg: [],
    companyRecords: {},
    stockTotalCost: [],
  };

  // Aggregate BillHistory data for each shop
  await Promise.all(
    shops.map(async (shop) => {
      const result = await prisma.billHistory.aggregate({
        where: { shop: shop as Shop },
        _sum: {
          totalCashReceived: true,
          totalSale: true,
          upiPayment: true,
          breakageCash: true,
          transportation: true,
          rent: true,
        },
      });

      content.TotalCash[shop] = {
        totalSale: result._sum.totalSale || 0,
        totalCashReceived: result._sum.totalCashReceived || 0,
        totalUpiPayment: result._sum.upiPayment || 0,
        totalBreakageCash: result._sum.breakageCash || 0,
        totalTransportation: result._sum.transportation || 0,
        totalRent: result._sum.rent || 0,
      };
    })
  );

  // Convert readonly array to regular array for Prisma
  const recordTypes = [...TypeRecordProps];

  // Aggregate record data by recordName and paymentMethod
  const aggregations = await prisma.record.groupBy({
    by: ["recordName", "paymentMethod"],
    where: {
      recordName: { in: recordTypes },
      paymentMethod: { in: ["Cash", "Current Bank", "none"] },
    },
    _sum: {
      amount: true,
    },
  });

  // Process record aggregations
  for (const agg of aggregations) {
    const recordName = agg.recordName as RecordType;
    const paymentMethod = agg.paymentMethod as PaymentMethod;

    // Map "Current Bank" to "CurrentBank" for object property access
    const paymentKey =
      paymentMethod === "Current Bank" ? "CurrentBank" : paymentMethod;

    if (
      content.Record[recordName] &&
      paymentKey in content.Record[recordName]
    ) {
      // Check if _sum and amount exist before accessing
      const amount = agg._sum?.amount || 0;
      content.Record[recordName][paymentKey as keyof RecordTotals] = amount;
    }
  }

  // Aggregate bank transactions by bank and transaction type
  const bankAggregations = await prisma.bank.groupBy({
    by: ["bank", "transaction"],
    where: {
      bank: { in: bankAccounts },
      transaction: { in: ["credit", "debit"] },
    },
    _sum: {
      amount: true,
    },
  });

  // Process bank transaction aggregations
  for (const agg of bankAggregations) {
    const bank = agg.bank;
    const transaction = agg.transaction as TransactionType;

    if (
      content.BankTransactions[bank] &&
      transaction in content.BankTransactions[bank]
    ) {
      // Check if _sum and amount exist before accessing
      const amount = agg._sum?.amount || 0;
      content.BankTransactions[bank][transaction] = amount;
    }
  }

  const paymentMethodAgge = await prisma.bank.groupBy({
    by: ["paymentMethod", "transaction"],
    _sum: { amount: true },
  });

  const lastYearBalance = await prisma.bank.findFirst({
    where: {
      bank: "Cash",
      transaction: "credit",
    },
  });

  const bankPaymentByCash = paymentMethodAgge
    .filter(
      (agg) => agg.paymentMethod === "By Cash" && agg.transaction === "credit"
    )
    .reduce((sum, recordTypes) => sum + (recordTypes._sum.amount || 0), 0);

  const cashPaymentByRecord = Object.values(content.Record).reduce(
    (sum, recordTypes) => sum + (recordTypes.Cash || 0),
    0
  );
  const totalCash =
    content.TotalCash.Amariya.totalCashReceived +
    content.TotalCash.Vamanpuri.totalCashReceived -
    cashPaymentByRecord +
    (lastYearBalance?.amount || 0) -
    bankPaymentByCash;

  const upiPayment = Object.values(content.TotalCash).reduce(
    (sum, recordTypes) => sum + (recordTypes.totalUpiPayment || 0),
    0
  );
  const bankPaymentByRecord = Object.values(content.Record).reduce(
    (sum, recordTypes) => sum + (recordTypes.CurrentBank || 0),
    0
  );
  const totalBankBalance =
    Object.values(content.BankTransactions).reduce(
      (sum, bankTransactions) =>
        sum + (bankTransactions.credit || 0) - (bankTransactions.debit || 0),
      0
    ) -
    bankPaymentByRecord +
    upiPayment;

  content.MoneyCalculation.TotalBank = totalBankBalance;
  content.MoneyCalculation.TotalCash = totalCash;
  content.paymentMethodAgg = paymentMethodAgge;

  const companyPaymentRecord = await prisma.record.findMany({
    where: {
      recordName: {
        in: ["Purchase Stock", "Direct Purchase Stock", "Others", "Salary"],
      },
    },
  });

  const RecordsMessage: string[] = [];
  companyPaymentRecord.forEach((record) => {
    RecordsMessage.push(record.recordName);
  });
  async function aggregateCompanyPayment(
    companyPaymentRecord: {
      id: number;
      recordName: string;
      shopName: string | null;
      message: string;
      amount: number;
      date: Date;
      paymentMethod: string;
    }[]
  ) {
    const groups: Record<
      string,
      { records: typeof companyPaymentRecord; totalAmount: number }
    > = {};

    const ai = new GoogleGenAI({ apiKey: process.env.GENAI });
    console.log("records messages ", RecordsMessage);

    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: `
    You are given a list of stock management record messages. These messages may have spelling mistakes or grammatical differences but refer to the same or similar information.
    Your task is to group similar messages together — even if they have slight spelling or phrasing variations. Each group should be represented as a JSON object where the key is a representative or canonical message, and the value is a list of variations.
    For example:
    {"Kartik salary": ["kartit salary","salary of kartik jun","salary of kartik jan" ]}
      Group the following messages:
      ${RecordsMessage}`,
    });
    console.log("response of ai ", response);

    let groupedMessageVariants: Record<string, string[]>;
    try {
      let content = response.text || ""; // or response.candidates[0].content.parts[0].text if needed

      // Clean the response - remove markdown code blocks if present
      content = content
        .replace(/```json\s*/g, "")
        .replace(/```\s*$/g, "")
        .trim();

      groupedMessageVariants = JSON.parse(content);
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : "Unknown error";
      console.error("AI Response:", response.text);
      throw new Error("Failed to parse AI response as JSON: " + errorMessage);
    }

    for (const [groupLabel, messageVariants] of Object.entries(
      groupedMessageVariants
    )) {
      groups[groupLabel] = { records: [], totalAmount: 0 };

      for (const record of companyPaymentRecord) {
        if (
          Array.isArray(messageVariants) &&
          messageVariants.some(
            (variant: string) =>
              record.message.toLowerCase() === variant.toLowerCase()
          )
        ) {
          groups[groupLabel].records.push(record);
          groups[groupLabel].totalAmount += record.amount;
        }
      }
    }
    console.log("groups ", groups);

    return groups;
  }

  const companiesRecords = await aggregateCompanyPayment(companyPaymentRecord);
  content.companyRecords = companiesRecords;

  const StockData = await prisma.stock.findMany();

  const stock: { shop: string; TotalPrice: number }[] = StockData.map(
    (item) => ({
      shop: item.shop,
      TotalPrice: item.price * (item.quantity || 0),
    })
  );

  content.stockTotalCost = stock;

  res.status(200).json(content);
};
