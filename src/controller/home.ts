import { PrismaClient, Shop } from "@prisma/client";
import { Request, Response } from "express";

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
  companyRecords:object
  stockTotalCost:{}
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
    companyRecords:{},
    stockTotalCost:[]
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
  function aggregateCompanyPayment(companyPaymentRecord: {
    id: number,
    recordName: string,
    shopName: string | null,
    message: string,
    amount: number,
    date: Date,
    paymentMethod: string
  }[]) {
    const groups: Record<string, { records: typeof companyPaymentRecord, totalAmount: number }> = {};

    for (const record of companyPaymentRecord) {
      const words = record.message
        .replace(/^\d+\s*-?\s*/, "")
        .trim()
        .split(/\s+/);
      const keyword = words[0]?.toLowerCase();

      if (keyword) {
        if (!groups[keyword]) {
          groups[keyword] = { records: [], totalAmount: 0 };
        }
        groups[keyword].records.push(record);
        groups[keyword].totalAmount += record.amount;
      }
    }
  return groups
  }
  const companiesRecords= aggregateCompanyPayment(companyPaymentRecord)
  content.companyRecords=companiesRecords


  const StockData= await prisma.stock.findMany()
  
  const stock: { shop: string; TotalPrice: number }[] = StockData.map((item) => ({
    shop: item.shop,
    TotalPrice: item.price * (item.quantity || 0),
  }));
  
  content.stockTotalCost=stock
  
  
  res.status(200).json(content);
};
