import { getAllBillHistory, generateBillHistory } from "../controller/billhistory";
import { Router } from "express";

const router = Router();

router.get("/get_all_bill_history", getAllBillHistory);
router.post("/generate_bill_history", generateBillHistory); 
 
export default router;