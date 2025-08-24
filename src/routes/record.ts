import { Router } from "express";
import { bank_transaction, getAllBankTransaction, getAllRecords, newRecord } from "../controller/record";
import {HomeProperties} from "../controller/home";
import { requireAuth } from "@clerk/express";

const router = Router();

router.get('/get_all_records', requireAuth(), getAllRecords);
router.get('/get_all_banks_statement', requireAuth(), getAllBankTransaction);
router.post('/new_record', requireAuth(), newRecord);
router.get('/dashboard', requireAuth(), HomeProperties);
router.post('/bank_transaction', requireAuth(), bank_transaction);

export default router;