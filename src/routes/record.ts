import { Router } from "express";
import { bank_transaction, getAllRecords, newRecord } from "../controller/record";
import {HomeProperties} from "../controller/home";

const router = Router();

router.get('/get_all_records', getAllRecords);
router.post('/new_record', newRecord);
router.get('/dashboard',HomeProperties)
router.post('/bank_transaction',bank_transaction)

export default router;