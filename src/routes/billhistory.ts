import {
  getAllBillHistory,
  generateBillHistory,
  getBillHistoryWithRecords,
  getBillHistoryPDF,
} from "../controller/billhistory";
import { Router } from "express";
import { requireAuth } from "@clerk/express";

const router = Router();

router.get("/get_all_bill_history", requireAuth(), getAllBillHistory);
router.get(
  "/get_bill_history_with_records",
  requireAuth(),
  getBillHistoryWithRecords
);
router.post("/generate_bill_history", requireAuth(), generateBillHistory);
router.get("/pdf/:id", getBillHistoryPDF);

export default router;
