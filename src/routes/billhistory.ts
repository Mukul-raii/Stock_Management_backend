import { getAllBillHistory, generateBillHistory, getBillHistoryWithRecords, getBillHistoryPDF } from "../controller/billhistory";
import { Router } from "express";

const router = Router();

router.get("/get_all_bill_history", getAllBillHistory);
router.get("/get_bill_history_with_records", getBillHistoryWithRecords);
router.post("/generate_bill_history", generateBillHistory); 
router.get("/pdf/:id", getBillHistoryPDF);
 
export default router;
