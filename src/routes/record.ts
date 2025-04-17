import { Router } from "express";
import { bank_transaction, getAllBankTransaction, getAllRecords, newRecord } from "../controller/record";
import {HomeProperties} from "../controller/home";

const router = Router();

router.get('/get_all_records', getAllRecords);
router.get('/get_all_banks_statement',getAllBankTransaction );
router.post('/new_record', newRecord);
router.get('/dashboard',HomeProperties)
router.post('/bank_transaction',bank_transaction)

export default router;