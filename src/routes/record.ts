import { Router } from "express";
import { getAllRecords, newRecord } from "../controller/record";

const router = Router();

router.get('/get_all_records', getAllRecords);
router.post('/new_record', newRecord);

export default router;